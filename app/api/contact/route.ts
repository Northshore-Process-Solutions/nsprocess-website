import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

function getField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function redirectToContact(request: Request, status: "sent" | "error") {
  const url = new URL("/contact", request.url);
  url.searchParams.set(status, "1");
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const firstName = getField(formData, "firstName");
  const lastName = getField(formData, "lastName");
  const business = getField(formData, "business");
  const email = getField(formData, "email");
  const phone = getField(formData, "phone");
  const message = getField(formData, "message");

  if (!firstName || !lastName || !business || !email || !message) {
    return redirectToContact(request, "error");
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO } =
    process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !CONTACT_TO) {
    return redirectToContact(request, "error");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const fullName = `${firstName} ${lastName}`;
  const safe = {
    fullName: escapeHtml(fullName),
    business: escapeHtml(business),
    email: escapeHtml(email),
    phone: escapeHtml(phone || "Not provided"),
    message: escapeHtml(message).replaceAll("\n", "<br />"),
  };

  try {
    await transporter.sendMail({
      from: `"North Shore Process Solutions" <${SMTP_USER}>`,
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

    return redirectToContact(request, "sent");
  } catch (error) {
    console.error("Failed to send contact form email", error);
    return redirectToContact(request, "error");
  }
}
