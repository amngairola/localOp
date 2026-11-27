import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'resend' | 'mock';
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<EmailResult>;
}

export class MockEmailProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<EmailResult> {
    logger.info(
      { to: options.to, subject: options.subject },
      '[MockEmailProvider] Simulated email sent successfully'
    );
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      provider: 'mock',
    };
  }
}

export class ResendEmailProvider implements EmailProvider {
  constructor(private apiKey: string, private fromAddress: string) {}

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error({ status: response.status, errorBody }, 'Resend API error');
        return {
          success: false,
          error: `Resend error: ${response.status} ${errorBody}`,
          provider: 'resend',
        };
      }

      const data = (await response.json()) as { id?: string };
      logger.info({ id: data.id, to: options.to }, 'Email delivered via Resend');
      return {
        success: true,
        messageId: data.id,
        provider: 'resend',
      };
    } catch (err: any) {
      logger.error({ err }, 'Failed to send email via Resend');
      return {
        success: false,
        error: err?.message || 'Network error sending email',
        provider: 'resend',
      };
    }
  }
}

export class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    if (provider) {
      this.provider = provider;
    } else if (env.RESEND_API_KEY && env.NODE_ENV !== 'test') {
      this.provider = new ResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM);
    } else {
      this.provider = new MockEmailProvider();
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    return this.provider.send(options);
  }

  // Email Templates (Branded, mobile-responsive HTML)

  renderReminderEmail(data: {
    title: string;
    dueDate: string;
    priority: string;
    description?: string | null;
  }): { subject: string; html: string; text: string } {
    const subject = `[LifeOps Reminder] ${data.title} is due soon`;
    const text = `LifeOps Reminder: ${data.title}\nDue Date: ${data.dueDate}\nPriority: ${data.priority}\n${
      data.description ? `\nDetails: ${data.description}` : ''
    }\n\nView details in LifeOps: ${env.FRONTEND_URL}/reminders`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #0284c7; margin: 0; font-size: 20px;">LifeOps Reminder Alert</h2>
        </div>
        <p style="color: #334155; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">${data.title}</p>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;"><strong>Due Date:</strong> ${data.dueDate}</p>
          <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Priority:</strong> <span style="color: #0284c7; font-weight: 600;">${data.priority}</span></p>
          ${
            data.description
              ? `<p style="margin: 8px 0 0 0; color: #475569; font-size: 13px;">${data.description}</p>`
              : ''
          }
        </div>
        <a href="${env.FRONTEND_URL}/reminders" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600;">Open LifeOps</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">LifeOps Personal Management Assistant</p>
      </div>
    `;

    return { subject, html, text };
  }

  renderBillEmail(data: {
    title: string;
    amount: number;
    currency: string;
    dueDate: string;
    isOverdue: boolean;
  }): { subject: string; html: string; text: string } {
    const statusLabel = data.isOverdue ? 'OVERDUE' : 'DUE SOON';
    const subject = `[LifeOps Bill ${statusLabel}] ${data.title} (${data.currency} ${data.amount})`;
    const text = `Bill ${statusLabel}: ${data.title}\nAmount: ${data.currency} ${data.amount}\nDue Date: ${data.dueDate}\n\nReview bill in LifeOps: ${env.FRONTEND_URL}/bills`;

    const accentColor = data.isOverdue ? '#e11d48' : '#d97706';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: ${accentColor}; margin: 0; font-size: 20px;">Bill ${statusLabel}</h2>
        </div>
        <p style="color: #334155; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">${data.title}</p>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;"><strong>Amount:</strong> <span style="font-size: 18px; font-weight: bold; color: #0f172a;">${data.currency} ${data.amount}</span></p>
          <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
        <a href="${env.FRONTEND_URL}/bills" style="display: inline-block; background-color: ${accentColor}; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600;">Manage Bill</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">LifeOps Personal Management Assistant</p>
      </div>
    `;

    return { subject, html, text };
  }

  renderSubscriptionEmail(data: {
    name: string;
    amount: number;
    currency: string;
    renewalDate: string;
    isTrialEnding: boolean;
  }): { subject: string; html: string; text: string } {
    const alertType = data.isTrialEnding ? 'Trial Ending Soon' : 'Upcoming Renewal';
    const subject = `[LifeOps Subscription Alert] ${data.name} ${alertType}`;
    const text = `Subscription ${alertType}: ${data.name}\nAmount: ${data.currency} ${data.amount}\nDate: ${data.renewalDate}\n\nReview subscription in LifeOps: ${env.FRONTEND_URL}/subscriptions`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #7c3aed; margin: 0; font-size: 20px;">Subscription Alert: ${alertType}</h2>
        </div>
        <p style="color: #334155; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">${data.name}</p>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;"><strong>Cost:</strong> ${data.currency} ${data.amount}</p>
          <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Date:</strong> ${data.renewalDate}</p>
        </div>
        <a href="${env.FRONTEND_URL}/subscriptions" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600;">Review Subscription</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">LifeOps Personal Management Assistant</p>
      </div>
    `;

    return { subject, html, text };
  }

  renderBudgetEmail(data: {
    category: string;
    spent: number;
    budget: number;
    percent: number;
    isExceeded: boolean;
  }): { subject: string; html: string; text: string } {
    const alertType = data.isExceeded ? 'Budget Exceeded' : 'Budget Warning (Threshold Reached)';
    const subject = `[LifeOps Budget Alert] ${data.category} has reached ${data.percent}%`;
    const text = `${alertType}: ${data.category}\nSpent: ${data.spent} / ${data.budget} (${data.percent}%)\n\nReview finances in LifeOps: ${env.FRONTEND_URL}/expenses`;

    const color = data.isExceeded ? '#e11d48' : '#d97706';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: ${color}; margin: 0; font-size: 20px;">${alertType}</h2>
        </div>
        <p style="color: #334155; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Category: ${data.category}</p>
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;"><strong>Spent:</strong> ${data.spent} of ${data.budget}</p>
          <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Consumed:</strong> <span style="font-weight: bold; color: ${color};">${data.percent}%</span></p>
        </div>
        <a href="${env.FRONTEND_URL}/expenses" style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600;">View Budget</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">LifeOps Personal Management Assistant</p>
      </div>
    `;

    return { subject, html, text };
  }
}

export const emailService = new EmailService();
