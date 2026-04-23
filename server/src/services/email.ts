import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

function ensureTransport() {
  if (transporter) return transporter;
  if (!env.smtpHost || !env.smtpPort || !env.smtpUser || !env.smtpPass) {
    return null; // email disabled
  }
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass }
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const tx = ensureTransport();
  if (!tx) {
    console.log('[email disabled]', subject, '->', to);
    return { queued: false, disabled: true };
  }
  const info = await tx.sendMail({ from: env.emailFrom, to, subject, html });
  console.log('[email sent]', info.messageId, 'to', to);
  return { queued: true, id: info.messageId };
}
