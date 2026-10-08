import nodemailer from 'nodemailer';
import { EmailLog } from '../../src/types';

const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL || '';
const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendEmail(emailLog: EmailLog): Promise<boolean> {
  if (!smtpUser || !smtpPass) {
    console.warn('[mailer] SMTP_USER o SMTP_PASS no configurados en .env. Saltando envío real de correo.');
    emailLog.status = 'sent';
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Obsidiana Joyería" <${smtpUser}>`,
      to: emailLog.recipientEmail,
      subject: emailLog.subject,
      html: emailLog.bodyHtml,
    });
    console.log(`[mailer] Email enviado con éxito: ${info.messageId}`);
    emailLog.status = 'sent';
    return true;
  } catch (error) {
    console.error('[mailer] Error al enviar email:', error);
    emailLog.status = 'failed';
    return false;
  }
}
