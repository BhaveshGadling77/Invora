import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"${config.app.name}" <${config.email.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error('Email send failed:', error);
    throw new Error('Failed to send email');
  }
};

// ─── Email Templates ──────────────────────────────────────────────────────────

export const emailVerificationTemplate = (name: string, token: string): string => {
  const url = `${config.app.frontendUrl}/verify-email?token=${token}`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Inventra</h1>
        <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Enterprise Inventory Management</p>
      </div>
      <div style="padding: 40px; background: #f9f9f9;">
        <h2>Hello, ${name}!</h2>
        <p>Please verify your email address to activate your Inventra account.</p>
        <a href="${url}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
          Verify Email
        </a>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
      </div>
    </div>
  `;
};

export const passwordResetTemplate = (name: string, token: string): string => {
  const url = `${config.app.frontendUrl}/reset-password?token=${token}`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">Inventra</h1>
      </div>
      <div style="padding: 40px; background: #f9f9f9;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name}, we received a request to reset your password.</p>
        <a href="${url}" style="display: inline-block; background: #e74c3c; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;
};
