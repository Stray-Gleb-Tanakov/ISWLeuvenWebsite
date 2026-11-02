import nodemailer from "nodemailer";

const MAIL_TO = process.env.MAIL_TO || "isw@ucll.be";
const smtpEnabled = Boolean(process.env.SMTP_HOST);

if (!smtpEnabled && process.env.NODE_ENV === "production") throw new Error("Missing env var SMTP_HOST");

// Without SMTP (local dev) mails are rendered to JSON and logged instead of sent.
const transport = smtpEnabled
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_PORT === "465",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export async function sendMail(opts: { subject: string; text: string; replyTo?: string; json: object }) {
  const info = await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER || "members-api@localhost",
    to: MAIL_TO,
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
    attachments: [{ filename: "signup.json", content: JSON.stringify(opts.json, null, 2), contentType: "application/json" }],
  });
  if (!smtpEnabled && "message" in info) console.log("[mail, not sent: SMTP_HOST unset]", String(info.message));
}
