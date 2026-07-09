import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetEmail(toEmail: string, resetUrl: string) {
    try {
      await this.mailerService.sendMail({
        to: toEmail,
        subject: '🔒 Password reset for KeepTrack application',
        // Simple HTML. You can connect Pug/EJS templates here in the future!
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Reset Forgotten Password</h2>
            <p>Hi,</p>
            <p>We received a request to reset the password for your KeepTrack account.</p>
            <p>If you did not request this change, you can safely ignore this email. Your password will remain unchanged.</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Set New Password
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px;">
              Or copy this link into your browser:<br>
              <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #64748b; font-size: 14px; margin-top: 40px;">
              For security reasons, this link will expire in 1 hour.
            </p>
          </div>
        `,
      });
      console.log(`Password reset email sent to: ${toEmail}`);
    } catch (error) {
      console.error('Error sending email via Brevo:', error);
      // You can throw the error or log it and let the backend keep running
      throw error;
    }
  }
}
