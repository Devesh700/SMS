import nodemailer, { Transporter } from "nodemailer";
import logger from "../utils/logger";

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; path: string }[];
}

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"School SaaS" <noreply@schoolsaas.com>',
      to: Array.isArray(options.to) ? options.to.join(",") : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || this.wrapInTemplate(options.text || "", options.subject),
      attachments: options.attachments,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${mailOptions.to}: ${options.subject}`);
    } catch (error) {
      logger.error("Email send error:", error);
      throw error;
    }
  }

  async sendFeeReminder(params: {
    to: string;
    studentName: string;
    amount: number;
    dueDate: string;
    schoolName: string;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Fee Payment Reminder</h2>
        <p>Dear Parent,</p>
        <p>This is a reminder that the fee for <strong>${params.studentName}</strong> of <strong>₹${params.amount.toLocaleString("en-IN")}</strong> is due on <strong>${params.dueDate}</strong>.</p>
        <p>Please make the payment at the earliest to avoid any late fees.</p>
        <br>
        <p>Regards,<br><strong>${params.schoolName}</strong></p>
      </div>
    `;
    await this.sendEmail({ to: params.to, subject: `Fee Reminder - ${params.studentName}`, html });
  }

  async sendWelcomeEmail(params: {
    to: string;
    name: string;
    schoolName: string;
    loginUrl: string;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to ${params.schoolName}!</h2>
        <p>Dear ${params.name},</p>
        <p>Your account has been created successfully. You can now login at:</p>
        <p><a href="${params.loginUrl}" style="color: #4F46E5;">${params.loginUrl}</a></p>
        <br>
        <p>Regards,<br><strong>School SaaS Team</strong></p>
      </div>
    `;
    await this.sendEmail({ to: params.to, subject: `Welcome to ${params.schoolName}`, html });
  }

  private wrapInTemplate(content: string, title: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>${title}</title></head>
      <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
          ${content.replace(/\n/g, "<br>")}
        </div>
      </body>
      </html>
    `;
  }
}
