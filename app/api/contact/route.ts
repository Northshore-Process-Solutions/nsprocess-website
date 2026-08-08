import { after, NextResponse } from "next/server";

import { defaultNextFollowUpDate } from "@/lib/leads";
import { escapeHtml, getSmtpConfig, sendAppEmail } from "@/lib/mail";
import { normalizeUsPhone } from "@/lib/phone";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToContact(request: Request, status: "sent" | "error") {
  const url = new URL("/contact", request.url);
  url.searchParams.set(status, "1");
  return NextResponse.redirect(url, { status: 303 });
}

async function createWebsiteLead(input: {
  firstName: string;
  lastName: string;
  business: string;
  email: string;
  phone: string;
  message: string;
}): Promise<{ ok: true; leadId: string } | { ok: false; error: string }> {
  // Server route — use service role. Anon RLS allows INSERT but not SELECT/
  // RETURNING, so public-client inserts with `.select()` fail (seen in prod).
  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (setupError) {
    const message =
      setupError instanceof Error
        ? setupError.message
        : "Missing service role key";
    console.error("Failed to create website lead client", setupError);
    return { ok: false, error: message };
  }

  const phone = input.phone ? normalizeUsPhone(input.phone) : null;
  const contactName = `${input.firstName} ${input.lastName}`.trim();
  const now = new Date().toISOString();

  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      business_name: input.business,
      contact_name: contactName,
      email: input.email.toLowerCase(),
      phone,
      title: "Free Process Review",
      source: "website_form",
      stage: "new_inquiry",
      message: input.message,
      next_follow_up_at: defaultNextFollowUpDate(),
    })
    .select("id")
    .single();

  if (error || !lead) {
    console.error("Failed to create website lead", error);
    return {
      ok: false,
      error: error?.message ?? "Lead insert failed",
    };
  }

  const activityBody = [
    `Name: ${contactName}`,
    `Business: ${input.business}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || "Not provided"}`,
    "",
    "Message:",
    input.message,
  ].join("\n");

  const { error: activityError } = await admin.from("activities").insert({
    lead_id: lead.id,
    activity_type: "email",
    email_direction: "received",
    subject: "Free Process Review request (website form)",
    body: activityBody,
    occurred_at: now,
  });

  if (activityError) {
    console.error("Failed to log website form activity", activityError);
  }

  return { ok: true, leadId: lead.id };
}

async function sendContactNotification(input: {
  firstName: string;
  lastName: string;
  business: string;
  email: string;
  phone: string;
  message: string;
}) {
  const smtp = getSmtpConfig();
  const notifyTo = process.env.CONTACT_TO?.trim();

  if (!smtp || !notifyTo) {
    console.error(
      "Contact form lead saved, but email is not configured (SMTP / CONTACT_TO).",
    );
    return;
  }

  const fullName = `${input.firstName} ${input.lastName}`;
  const safe = {
    fullName: escapeHtml(fullName),
    business: escapeHtml(input.business),
    email: escapeHtml(input.email),
    phone: escapeHtml(input.phone || "Not provided"),
    message: escapeHtml(input.message).replaceAll("\n", "<br />"),
  };

  const notify = await sendAppEmail({
    to: notifyTo,
    replyTo: input.email,
    subject: `Free Process Review request from ${input.business}`,
    text: [
      `Name: ${fullName}`,
      `Business: ${input.business}`,
      `Email: ${input.email}`,
      `Phone: ${input.phone || "Not provided"}`,
      "",
      "Message:",
      input.message,
    ].join("\n"),
    html: `
      <h2>Free Process Review Request</h2>
      <p><strong>Name:</strong> ${safe.fullName}</p>
      <p><strong>Business:</strong> ${safe.business}</p>
      <p><strong>Email:</strong> ${safe.email}</p>
      <p><strong>Phone:</strong> ${safe.phone}</p>
      <p><strong>Message:</strong></p>
      <p>${safe.message}</p>
    `,
  });

  if (!notify.ok) {
    console.error(
      "Contact form lead saved, but notification email failed",
      notify.error,
    );
    return;
  }

  console.info("Contact form notification emailed", {
    to: notifyTo,
    messageId: notify.messageId,
    accepted: notify.accepted,
    rejected: notify.rejected,
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();

  // Honeypot: real users never see/fill this field.
  // Keep the name non-semantic so browsers/password managers do not autofill it.
  const honeypot = getField(formData, "hp_nsps_field");
  if (honeypot) {
    console.warn("Contact form honeypot tripped; dropping submission");
    return redirectToContact(request, "sent");
  }

  const firstName = getField(formData, "firstName");
  const lastName = getField(formData, "lastName");
  const business = getField(formData, "business");
  const email = getField(formData, "email");
  const phone = getField(formData, "phone");
  const message = getField(formData, "message");

  if (!firstName || !lastName || !business || !email || !message) {
    console.warn("Contact form missing required fields", {
      firstName: Boolean(firstName),
      lastName: Boolean(lastName),
      business: Boolean(business),
      email: Boolean(email),
      message: Boolean(message),
    });
    return redirectToContact(request, "error");
  }

  const normalizedPhone = phone ? normalizeUsPhone(phone) : null;

  // Persist the CRM lead first so Pipeline is not blocked by SMTP issues.
  const leadResult = await createWebsiteLead({
    firstName,
    lastName,
    business,
    email,
    phone: normalizedPhone ?? "",
    message,
  });

  if (!leadResult.ok) {
    return redirectToContact(request, "error");
  }

  // SMTP is slow — finish the response after the lead is saved, then email.
  after(() =>
    sendContactNotification({
      firstName,
      lastName,
      business,
      email,
      phone: phone || "Not provided",
      message,
    }),
  );

  return redirectToContact(request, "sent");
}
