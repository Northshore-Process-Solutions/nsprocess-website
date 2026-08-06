import nodemailer from "nodemailer";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getSmtpConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    user: SMTP_USER,
    pass: SMTP_PASS,
  };
}

export function createMailTransporter() {
  const config = getSmtpConfig();
  if (!config) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export async function sendAppEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  /** Outlook-friendly calendar invite part (METHOD:REQUEST). */
  icalEvent?: {
    method?: string;
    content: string;
    filename?: string;
  };
}) {
  const config = getSmtpConfig();
  const transporter = createMailTransporter();

  if (!config || !transporter) {
    return { ok: false as const, error: "Email is not configured." };
  }

  try {
    await transporter.sendMail({
      from: `"North Shore Process Solutions" <${config.user}>`,
      to: input.to,
      replyTo: input.replyTo ?? config.user,
      subject: input.subject,
      text: input.text,
      html:
        input.html ??
        `<p>${escapeHtml(input.text).replaceAll("\n", "<br />")}</p>`,
      attachments: input.attachments,
      icalEvent: input.icalEvent
        ? {
            method: input.icalEvent.method ?? "REQUEST",
            content: input.icalEvent.content,
            filename: input.icalEvent.filename ?? "invite.ics",
          }
        : undefined,
    });
    return { ok: true as const };
  } catch (error) {
    console.error("Failed to send app email", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }
}
