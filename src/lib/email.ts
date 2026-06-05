import nodemailer, { type Transporter } from "nodemailer";
import { log } from "@/lib/log";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are required");
  cachedTransporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  return cachedTransporter;
}

export type SendEmailResult = { ok: true; messageId: string } | { ok: false; error: string };

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const fromName = process.env.EMAIL_FROM_NAME ?? "crop-management";
  const fromAddress = process.env.GMAIL_USER ?? "";
  try {
    const info = await getTransporter().sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    });
    log.info({ to: params.to, subject: params.subject, messageId: info.messageId }, "email.sent");
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    log.error({ to: params.to, subject: params.subject, err }, "email.send_failed");
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
