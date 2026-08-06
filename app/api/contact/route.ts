import { NextResponse } from "next/server";

import { defaultNextFollowUpDate } from "@/lib/leads";
import { escapeHtml, getSmtpConfig, sendAppEmail } from "@/lib/mail";
import { normalizeUsPhone } from "@/lib/phone";
import { contact } from "@/lib/site-data";
import { createPublicSupabaseClient } from "@/lib/supabase/admin";

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
}) {
  const supabase = createPublicSupabaseClient();
  const phone = input.phone ? normalizeUsPhone(input.phone) : null;

  const { error } = await supabase.from("leads").insert({
    business_name: input.business,
    contact_name: `${input.firstName} ${input.lastName}`.trim(),
    email: input.email.toLowerCase(),
    phone,
    title: "Free Process Review",
    source: "website_form",
    stage: "new_inquiry",
    message: input.message,
    next_follow_up_at: defaultNextFollowUpDate(),
  });

  if (error) {
    console.error("Failed to create website lead", error);
  }
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
    return redirectToContact(request, "error");
  }

  const normalizedPhone = phone ? normalizeUsPhone(phone) : null;

  const { CONTACT_TO } = process.env;
  const smtp = getSmtpConfig();

  if (!smtp || !CONTACT_TO) {
    return redirectToContact(request, "error");
  }

  const fullName = `${firstName} ${lastName}`;
  const safe = {
    fullName: escapeHtml(fullName),
    business: escapeHtml(business),
    email: escapeHtml(email),
    phone: escapeHtml(phone || "Not provided"),
    message: escapeHtml(message).replaceAll("\n", "<br />"),
  };

  const notify = await sendAppEmail({
    to: CONTACT_TO,
    replyTo: email,
    subject: `Free Process Review request from ${business}`,
    text: [
      `Name: ${fullName}`,
      `Business: ${business}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      "",
      "Message:",
      message,
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
    return redirectToContact(request, "error");
  }

  const autoReply = await sendAppEmail({
    to: email,
    replyTo: contact.email,
    subject: "We received your Free Process Review request",
    text: [
      `Hi ${firstName},`,
      "",
      "Thanks for reaching out to North Shore Process Solutions.",
      "",
      "We received your Free Process Review request and will review it shortly. Someone from our team will contact you soon.",
      "",
      "If you need to add anything in the meantime, just reply to this email or call us.",
      "",
      `Email: ${contact.email}`,
      `Phone: ${contact.phone}`,
      "",
      "North Shore Process Solutions",
    ].join("\n"),
    html: `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thanks for reaching out to <strong>North Shore Process Solutions</strong>.</p>
      <p>We received your Free Process Review request and will review it shortly. Someone from our team will contact you soon.</p>
      <p>If you need to add anything in the meantime, just reply to this email or call us.</p>
      <p>
        Email: <a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a><br />
        Phone: <a href="tel:+1${contact.phone.replace(/\D/g, "")}">${escapeHtml(contact.phone)}</a>
      </p>
      <p>North Shore Process Solutions</p>
    `,
  });

  if (!autoReply.ok) {
    console.error("Failed to send contact form auto-reply", autoReply.error);
  }

  await createWebsiteLead({
    firstName,
    lastName,
    business,
    email,
    phone: normalizedPhone ?? "",
    message,
  });

  return redirectToContact(request, "sent");
}
