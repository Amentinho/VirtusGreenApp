// SendGrid email service - referenced from blueprint integration
import sgMail from '@sendgrid/mail';
import { customAlphabet } from 'nanoid';

const generateVerificationToken = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  32
);

if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not set - email functionality disabled');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('Skipping email send - SENDGRID_API_KEY not configured');
      return false;
    }
    
    await sgMail.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    if (error.response?.body?.errors) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
    }
    return false;
  }
}

export function generatePasswordResetEmail(resetToken: string, userEmail: string) {
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  return {
    to: userEmail,
    from: process.env.SENDGRID_FROM || 'test@example.com', // Use environment variable for verified sender
    subject: 'Reset your VirtusGreen password',
    text: `
Password Reset Request

We received a request to reset your VirtusGreen account password.

If you requested this, click the link below to create a new password:
${resetUrl}

If you didn't request this reset, please ignore this email - your account remains secure.

This link expires in 1 hour for security.

Best regards,
The VirtusGreen Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; font-size: 24px;">🌿 VirtusGreen</h1>
  </div>
  
  <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">Reset Your Password</h2>
  
  <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
    Someone requested to reset the password for your VirtusGreen account.
  </p>
  
  <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
    If this was you, click the button below to reset your password:
  </p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
      Reset Password
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
    If the button doesn't work, you can copy and paste this link into your browser:
  </p>
  
  <p style="color: #666; font-size: 14px; word-break: break-all; margin-bottom: 25px;">
    ${resetUrl}
  </p>
  
  <p style="color: #999; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
    If you didn't request this, you can safely ignore this email.
  </p>
  
  <p style="color: #999; font-size: 14px; line-height: 1.5;">
    This reset link will expire in 1 hour.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    Thanks,<br>
    The VirtusGreen Team
  </p>
</div>
    `
  };
}

export interface EmailVerificationData {
  token: string;
  expires: Date;
}

export function generateEmailVerificationToken(): EmailVerificationData {
  const token = generateVerificationToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hour expiry
  
  return { token, expires };
}

export function generateVerificationEmail(email: string, username: string, verificationToken: string) {
  const baseUrl = getBaseUrl();
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  return {
    to: email,
    from: process.env.SENDGRID_FROM || 'test@example.com', // Use environment variable for verified sender
    subject: 'Please verify your VirtusGreen email address',
    text: `
Welcome to VirtusGreen!

Hi ${username},

Thank you for creating your VirtusGreen account. Please verify your email address to complete your registration and start discovering eco-friendly products.

Verify your email by clicking this link:
${verificationUrl}

This verification link expires in 24 hours for security.

If you didn't sign up for VirtusGreen, please ignore this email.

Best regards,
The VirtusGreen Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #16a34a; font-size: 24px;">🌿 VirtusGreen</h1>
  </div>
  
  <h2 style="color: #333; font-size: 20px; margin-bottom: 20px;">Welcome to VirtusGreen!</h2>
  
  <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
    Hi ${username},
  </p>
  
  <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
    Thank you for registering with VirtusGreen. To complete your registration and start making eco-friendly choices, please verify your email address.
  </p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${verificationUrl}" style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
      Verify Email Address
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
    If the button doesn't work, you can copy and paste this link into your browser:
  </p>
  
  <p style="color: #666; font-size: 14px; word-break: break-all; margin-bottom: 25px;">
    ${verificationUrl}
  </p>
  
  <p style="color: #999; font-size: 14px; line-height: 1.5; margin-bottom: 15px;">
    This link will expire in 24 hours.
  </p>
  
  <p style="color: #999; font-size: 14px; line-height: 1.5;">
    If you didn't create an account with VirtusGreen, you can safely ignore this email.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    Thanks,<br>
    The VirtusGreen Team
  </p>
</div>
    `
  };
}

function getBaseUrl(): string {
  // Get the current domain from environment or use localhost for development
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`;
  }
  return 'http://localhost:5000';
}