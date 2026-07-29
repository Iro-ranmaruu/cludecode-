import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.warn(
      `[mailer] SMTP_HOST が未設定のためメール送信をスキップしました（宛先: ${options.to}、件名: ${options.subject}）`
    );
    return;
  }

  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || "WiSM製品アプリ <no-reply@example.com>",
      to: options.to,
      subject: options.subject,
      text: options.text,
    });
  } catch (err) {
    console.error(`[mailer] メール送信に失敗しました（宛先: ${options.to}）`, err);
  }
}
