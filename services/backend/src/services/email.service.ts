import nodemailer from 'nodemailer';
import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface ReferralEmailData {
  referrerName: string;
  referrerAddress: string;
  referralCode: string;
  referralLink: string;
  inviteeEmail: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Send referral invitation email
   */
  async sendReferralInvitation(data: ReferralEmailData): Promise<boolean> {
    try {
      const { referrerName, referrerAddress, referralCode, referralLink, inviteeEmail } = data;

      const subject = `🚀 You've been invited to join Baskt!`;

      const html = this.generateReferralEmailHTML({
        referrerName,
        referrerAddress,
        referralCode,
        referralLink,
        inviteeEmail,
      });

      const mailOptions: EmailOptions = {
        to: inviteeEmail,
        subject,
        html,
      };

      const result = await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        ...mailOptions,
      });

      logger.info(`Referral email sent successfully to ${inviteeEmail}`, {
        messageId: result.messageId,
        referrerAddress,
        referralCode,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send referral email:', error);
      return false;
    }
  }

  /**
   * Generate beautiful HTML email template matching Baskt platform design
   */
  private generateReferralEmailHTML(data: ReferralEmailData): string {
    const { referrerName, referrerAddress, referralCode, referralLink, inviteeEmail } = data;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🚀 You've been invited to Baskt!</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            box-shadow: 
              0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04),
              0 0 0 1px rgba(255, 255, 255, 0.1);
            overflow: hidden;
            border: 1px solid rgba(139, 92, 246, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
            padding: 40px 32px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
          }
          
          .logo {
            font-size: 36px;
            font-weight: 800;
            color: white;
            margin-bottom: 16px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
          }
          
          .title {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
          }
          
          .subtitle {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
            position: relative;
            z-index: 1;
          }
          
          .content {
            padding: 40px 32px;
            background: white;
          }
          
          .welcome-text {
            font-size: 18px;
            color: #374151;
            margin-bottom: 24px;
            text-align: center;
            font-weight: 500;
          }
          
          .referrer-card {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .referrer-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc);
          }
          
          .referrer-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .referrer-name {
            font-size: 20px;
            font-weight: 700;
            color: #8b5cf6;
            margin-bottom: 8px;
          }
          
          .referrer-address {
            font-size: 12px;
            color: #9ca3af;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: #f9fafb;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            display: inline-block;
          }
          
          .referral-code-section {
            text-align: center;
            margin: 32px 0;
          }
          
          .referral-code-label {
            font-size: 16px;
            color: #374151;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          
          .referral-code {
            background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
            color: white;
            padding: 16px 32px;
            border-radius: 12px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 18px;
            font-weight: 700;
            display: inline-block;
            margin: 16px 0;
            box-shadow: 
              0 10px 15px -3px rgba(139, 92, 246, 0.3),
              0 4px 6px -2px rgba(139, 92, 246, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.2);
            letter-spacing: 1px;
          }
          
          
          .cta-section {
            text-align: center;
            margin: 32px 0;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
            color: white;
            padding: 18px 36px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            margin: 16px 0;
            transition: all 0.3s ease;
            box-shadow: 
              0 10px 15px -3px rgba(16, 185, 129, 0.3),
              0 4px 6px -2px rgba(16, 185, 129, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 
              0 20px 25px -5px rgba(16, 185, 129, 0.4),
              0 10px 10px -5px rgba(16, 185, 129, 0.3);
          }
          
          .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }
          
          .cta-button:hover::before {
            left: 100%;
          }
          
          .link-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
          }
          
          .link-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 8px;
          }
          
          .referral-link {
            font-size: 12px;
            color: #8b5cf6;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            word-break: break-all;
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            display: block;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          
          .referral-link:hover {
            background: #f1f5f9;
            border-color: #8b5cf6;
          }
          
          .footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 24px 32px;
            text-align: center;
          }
          
          .footer-text {
            color: #6b7280;
            font-size: 14px;
            margin: 8px 0;
            line-height: 1.5;
          }
          
          .footer-divider {
            width: 40px;
            height: 2px;
            background: linear-gradient(90deg, #8b5cf6, #a855f7);
            margin: 16px auto;
            border-radius: 1px;
          }
          
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            
            .email-container {
              border-radius: 12px;
            }
            
            .header {
              padding: 32px 24px;
            }
            
            .content {
              padding: 32px 24px;
            }
            
            .logo {
              font-size: 28px;
            }
            
            .title {
              font-size: 24px;
            }
            
            .referral-code {
              padding: 12px 24px;
              font-size: 16px;
            }
            
            .cta-button {
              padding: 16px 28px;
              font-size: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">🚀 Baskt</div>
            <h1 class="title">You've been invited!</h1>
            <p class="subtitle">Join the future of decentralized trading</p>
          </div>

          <div class="content">
            <p class="welcome-text">
              Hey there! 👋<br>
              Great news! <strong style="color: #8b5cf6;">${
                referrerName || 'A friend'
              }</strong> thinks you'd love Baskt and has invited you to join our community.
            </p>

            <div class="referrer-card">
              <div class="referrer-label">Invited by</div>
              <div class="referrer-name">${referrerName || 'Baskt User'}</div>
              <div class="referrer-address">${referrerAddress}</div>
            </div>

            <div class="referral-code-section">
              <div class="referral-code-label">
                🎯 Your exclusive referral code
              </div>
              <div class="referral-code">${referralCode}</div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">
                Use this code when you sign up to get special benefits and rewards!
              </p>
            </div>

            <div class="cta-section">
              <a href="${referralLink}" class="cta-button">
                🚀 Join Baskt Now
              </a>
            </div>

            <div class="link-section">
              <div class="link-label">Or copy this link:</div>
              <a href="${referralLink}" class="referral-link">${referralLink}</a>
            </div>
          </div>

          <div class="footer">
            <div class="footer-divider"></div>
            <p class="footer-text">© 2024 Baskt. All rights reserved.</p>
            <p class="footer-text">If you didn't expect this email, you can safely ignore it.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
