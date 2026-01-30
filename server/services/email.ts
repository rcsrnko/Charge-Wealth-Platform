/**
 * Email Service for Charge Wealth
 * 
 * Handles all email communications using Resend.
 * Brand voice: Premium, helpful CFO advisor
 * Gold accent: #D4AF37
 */

import { Resend } from 'resend';

// Brand constants
export const BRAND = {
  name: 'Charge Wealth',
  goldAccent: '#D4AF37',
  darkBg: '#0D0F14',
  cardBg: '#1A1D28',
  textPrimary: '#E8E6E3',
  textSecondary: '#A0A0A0',
  success: '#4ADE80',
  error: '#EF4444',
  fromEmail: 'Charge Wealth <hello@chargewealth.co>',
  supportEmail: 'support@chargewealth.co',
  baseUrl: 'https://chargewealth.co',
};

// ============================================
// RESEND CLIENT SETUP
// ============================================

let connectionSettings: any;

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string } | null> {
  // First try environment variable
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || BRAND.fromEmail,
    };
  }

  // Fallback to Replit connectors
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    return null;
  }

  try {
    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    if (!connectionSettings || !connectionSettings.settings?.api_key) {
      return null;
    }
    return {
      apiKey: connectionSettings.settings.api_key,
      fromEmail: connectionSettings.settings.from_email || BRAND.fromEmail
    };
  } catch (error) {
    console.error('Failed to get Resend credentials:', error);
    return null;
  }
}

async function getResendClient(): Promise<{ client: Resend; fromEmail: string } | null> {
  const credentials = await getCredentials();
  if (!credentials) {
    console.warn('Resend not configured - email sending disabled');
    return null;
  }
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

// ============================================
// EMAIL BASE TEMPLATE
// ============================================

function baseTemplate(content: string, options?: { showFooter?: boolean; unsubscribeUrl?: string }): string {
  const { showFooter = true, unsubscribeUrl } = options || {};
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.darkBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${BRAND.goldAccent};">
                ⚡ Charge Wealth
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="background: ${BRAND.darkBg}; color: ${BRAND.textPrimary}; padding: 0;">
              ${content}
            </td>
          </tr>
          
          ${showFooter ? `
          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; border-top: 1px solid #2A2D38; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: ${BRAND.textSecondary};">
                ${BRAND.name} - Your AI-Powered CFO
              </p>
              <p style="margin: 0; font-size: 12px; color: ${BRAND.textSecondary};">
                <a href="${BRAND.baseUrl}/dashboard" style="color: ${BRAND.goldAccent}; text-decoration: none;">Dashboard</a>
                &nbsp;|&nbsp;
                <a href="${BRAND.baseUrl}/dashboard/settings" style="color: ${BRAND.goldAccent}; text-decoration: none;">Settings</a>
                ${unsubscribeUrl ? `&nbsp;|&nbsp;<a href="${unsubscribeUrl}" style="color: ${BRAND.textSecondary}; text-decoration: none;">Unsubscribe</a>` : ''}
              </p>
            </td>
          </tr>
          ` : ''}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function goldButton(text: string, url: string): string {
  return `
    <a href="${url}" style="display: inline-block; background: ${BRAND.goldAccent}; color: ${BRAND.darkBg}; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      ${text}
    </a>
  `;
}

function infoCard(content: string, options?: { borderColor?: string }): string {
  const borderColor = options?.borderColor || BRAND.goldAccent;
  return `
    <div style="background: ${BRAND.cardBg}; border-left: 4px solid ${borderColor}; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
      ${content}
    </div>
  `;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const emailTemplates = {
  /**
   * Welcome Email - Sent immediately on signup
   */
  welcome: (firstName?: string): EmailTemplate => {
    const greeting = firstName ? `Hi ${firstName},` : 'Welcome,';
    
    const html = baseTemplate(`
      <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 24px 0; font-size: 28px; font-weight: 600;">
        Welcome to Your Financial Command Center
      </h2>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        ${greeting}
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        You just did something 99% of high earners never do: <strong>you took control.</strong>
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 24px 0;">
        The financial industry has spent decades making you feel like you need them. Like your income somehow isn't enough for you to make smart decisions about your own money.
      </p>
      
      <p style="font-size: 18px; line-height: 1.7; color: ${BRAND.goldAccent}; font-weight: 600; margin: 0 0 24px 0;">
        That ends now.
      </p>
      
      ${infoCard(`
        <h3 style="color: ${BRAND.goldAccent}; margin: 0 0 12px 0; font-size: 16px;">Here's what to do first:</h3>
        <ol style="margin: 0; padding-left: 20px; color: ${BRAND.textSecondary}; line-height: 1.8;">
          <li style="margin-bottom: 8px;"><strong style="color: ${BRAND.textPrimary};">Complete your financial profile</strong> - Takes 3 minutes, unlocks personalized insights</li>
          <li style="margin-bottom: 8px;"><strong style="color: ${BRAND.textPrimary};">Upload a tax return</strong> - Our AI finds hidden savings opportunities</li>
          <li style="margin-bottom: 8px;"><strong style="color: ${BRAND.textPrimary};">Ask your first question</strong> - Try "What tax strategies should I consider?"</li>
          <li style="margin-bottom: 8px;"><strong style="color: ${BRAND.textPrimary};">Join the Discord community</strong> - Connect with other high earners, get market insights, and exclusive discussions</li>
        </ol>
      `)}
      
      ${infoCard(`
        <h3 style="color: ${BRAND.goldAccent}; margin: 0 0 12px 0; font-size: 16px;">🎉 Founding Member Perk: Discord Community</h3>
        <p style="margin: 0 0 12px 0; color: ${BRAND.textSecondary}; line-height: 1.6;">
          As a founding member, you get exclusive access to our private Discord community. Connect with other high earners, get real-time market alerts, discuss tax strategies, and more.
        </p>
        <p style="margin: 0;">
          <a href="https://discord.gg/APkhRFRajN" style="color: ${BRAND.goldAccent}; font-weight: 600;">Join the Discord →</a>
        </p>
      `)}
      
      <div style="text-align: center; margin: 32px 0;">
        ${goldButton('Open Your Dashboard', `${BRAND.baseUrl}/dashboard`)}
      </div>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 24px 0 0 0;">
        Questions? Just reply to this email. I read every one.
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 16px 0 0 0;">
        To your financial success,<br>
        <strong style="color: ${BRAND.textPrimary};">The Charge Wealth Team</strong>
      </p>
    `);
    
    const text = `
Welcome to Charge Wealth!

${greeting}

You just did something 99% of high earners never do: you took control.

Here's what to do first:
1. Complete your financial profile - Takes 3 minutes
2. Upload a tax return - Our AI finds hidden savings
3. Ask your first question
4. Join the Discord community - Connect with other high earners

Open your dashboard: ${BRAND.baseUrl}/dashboard

FOUNDING MEMBER PERK: DISCORD COMMUNITY
As a founding member, you get exclusive access to our private Discord.
Connect with other high earners, get market alerts, and discuss strategies.
Join here: https://discord.gg/APkhRFRajN

Questions? Reply to this email.

- The Charge Wealth Team
    `.trim();
    
    return {
      subject: "Welcome to Charge Wealth - Here's What to Do First",
      html,
      text,
    };
  },

  /**
   * Onboarding Nudge - Sent 24h after signup if profile not complete
   */
  onboardingNudge: (firstName?: string, completionPercent: number = 0): EmailTemplate => {
    const greeting = firstName ? `Hey ${firstName},` : 'Hey there,';
    const remainingPercent = 100 - completionPercent;
    
    const html = baseTemplate(`
      <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">
        You're ${completionPercent}% There - Let's Finish Strong
      </h2>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        ${greeting}
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        You signed up for Charge Wealth yesterday, but your profile is only ${completionPercent}% complete. That means our AI can't give you personalized recommendations yet.
      </p>
      
      ${infoCard(`
        <p style="margin: 0; color: ${BRAND.textPrimary}; font-size: 16px;">
          <strong style="color: ${BRAND.goldAccent};">Quick math:</strong> Members who complete their profile find an average of <strong>$8,400/year</strong> in tax savings and investment opportunities.
        </p>
      `)}
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 24px 0;">
        The remaining ${remainingPercent}% takes about <strong>5 minutes</strong>. Worth it for thousands in potential savings?
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        ${goldButton('Complete My Profile', `${BRAND.baseUrl}/dashboard?onboarding=true`)}
      </div>
      
      <p style="font-size: 14px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 24px 0 0 0;">
        <strong>What we need:</strong> Basic income info, filing status, and a quick tax return upload (optional but recommended).
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 16px 0 0 0;">
        Here when you're ready,<br>
        <strong style="color: ${BRAND.textPrimary};">The Charge Wealth Team</strong>
      </p>
    `);
    
    const text = `
You're ${completionPercent}% There - Let's Finish Strong

${greeting}

You signed up for Charge Wealth yesterday, but your profile is only ${completionPercent}% complete.

Quick math: Members who complete their profile find an average of $8,400/year in savings opportunities.

The remaining ${remainingPercent}% takes about 5 minutes.

Complete your profile: ${BRAND.baseUrl}/dashboard?onboarding=true

- The Charge Wealth Team
    `.trim();
    
    return {
      subject: `You're ${completionPercent}% there - 5 minutes to unlock your insights`,
      html,
      text,
    };
  },

  /**
   * Weekly Digest - Sent every Monday morning
   */
  weeklyDigest: (data: {
    firstName?: string;
    netWorthChange?: number;
    netWorthChangePercent?: number;
    pendingActions?: number;
    topInsight?: string;
    marketHighlight?: string;
  }): EmailTemplate => {
    const { 
      firstName, 
      netWorthChange, 
      netWorthChangePercent,
      pendingActions = 0,
      topInsight,
      marketHighlight 
    } = data;
    
    const greeting = firstName ? `Good morning ${firstName},` : 'Good morning,';
    
    const changeColor = (netWorthChange || 0) >= 0 ? BRAND.success : BRAND.error;
    const changeSign = (netWorthChange || 0) >= 0 ? '+' : '';
    const changeDisplay = netWorthChange !== undefined 
      ? `${changeSign}$${Math.abs(netWorthChange).toLocaleString()}` 
      : 'N/A';
    const percentDisplay = netWorthChangePercent !== undefined
      ? `(${changeSign}${netWorthChangePercent.toFixed(1)}%)`
      : '';
    
    const html = baseTemplate(`
      <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">
        Your Weekly Financial Snapshot
      </h2>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 24px 0;">
        ${greeting}
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 24px 0;">
        Here's your weekly financial pulse. A quick 60-second read to keep you informed.
      </p>
      
      <!-- Net Worth Change -->
      ${netWorthChange !== undefined ? `
      <div style="background: ${BRAND.cardBg}; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: ${BRAND.textSecondary}; text-transform: uppercase; letter-spacing: 1px;">
          Net Worth Change (7 days)
        </p>
        <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${changeColor};">
          ${changeDisplay} <span style="font-size: 18px; font-weight: 400;">${percentDisplay}</span>
        </p>
      </div>
      ` : ''}
      
      <!-- Pending Actions -->
      ${pendingActions > 0 ? `
      ${infoCard(`
        <div style="display: flex; align-items: center;">
          <span style="font-size: 24px; margin-right: 12px;">📋</span>
          <div>
            <p style="margin: 0; color: ${BRAND.textPrimary}; font-weight: 600;">
              ${pendingActions} Action${pendingActions > 1 ? 's' : ''} Waiting
            </p>
            <p style="margin: 4px 0 0 0; color: ${BRAND.textSecondary}; font-size: 14px;">
              CFO recommendations ready for your review
            </p>
          </div>
        </div>
      `)}
      ` : ''}
      
      <!-- Top Insight -->
      ${topInsight ? `
      <div style="margin-bottom: 24px;">
        <h3 style="color: ${BRAND.goldAccent}; margin: 0 0 12px 0; font-size: 16px;">
          💡 This Week's Top Insight
        </h3>
        <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0; padding: 16px; background: ${BRAND.cardBg}; border-radius: 8px;">
          ${topInsight}
        </p>
      </div>
      ` : ''}
      
      <!-- Market Highlight -->
      ${marketHighlight ? `
      <div style="margin-bottom: 24px;">
        <h3 style="color: ${BRAND.goldAccent}; margin: 0 0 12px 0; font-size: 16px;">
          📈 Market Note
        </h3>
        <p style="font-size: 14px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 0;">
          ${marketHighlight}
        </p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 32px 0;">
        ${goldButton('View Full Dashboard', `${BRAND.baseUrl}/dashboard`)}
      </div>
      
      <p style="font-size: 14px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 24px 0 0 0; text-align: center;">
        Have a great week. We're here if you need us.
      </p>
    `, { unsubscribeUrl: `${BRAND.baseUrl}/dashboard/settings?tab=notifications` });
    
    const text = `
Your Weekly Financial Snapshot

${greeting}

Here's your weekly financial pulse.

${netWorthChange !== undefined ? `Net Worth Change (7 days): ${changeDisplay} ${percentDisplay}` : ''}

${pendingActions > 0 ? `You have ${pendingActions} action${pendingActions > 1 ? 's' : ''} waiting for review.` : ''}

${topInsight ? `This Week's Top Insight: ${topInsight}` : ''}

${marketHighlight ? `Market Note: ${marketHighlight}` : ''}

View your dashboard: ${BRAND.baseUrl}/dashboard

Have a great week!
- The Charge Wealth Team

To manage email preferences: ${BRAND.baseUrl}/dashboard/settings?tab=notifications
    `.trim();
    
    return {
      subject: `Your Weekly Financial Snapshot${netWorthChange !== undefined ? ` | ${changeDisplay}` : ''}`,
      html,
      text,
    };
  },

  /**
   * Tax Deadline Reminder
   */
  taxDeadlineReminder: (data: {
    firstName?: string;
    deadline: string;
    deadlineDate: string;
    description: string;
  }): EmailTemplate => {
    const { firstName, deadline, deadlineDate, description } = data;
    const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
    
    const html = baseTemplate(`
      <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">
        ⏰ Tax Deadline Reminder
      </h2>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        ${greeting}
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 24px 0;">
        Quick reminder about an upcoming tax deadline:
      </p>
      
      <div style="background: ${BRAND.cardBg}; border: 2px solid ${BRAND.goldAccent}; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="color: ${BRAND.goldAccent}; margin: 0 0 8px 0; font-size: 20px;">
          ${deadline}
        </h3>
        <p style="margin: 0 0 12px 0; font-size: 16px; color: ${BRAND.textPrimary};">
          <strong>Due:</strong> ${deadlineDate}
        </p>
        <p style="margin: 0; font-size: 14px; color: ${BRAND.textSecondary}; line-height: 1.6;">
          ${description}
        </p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        ${goldButton('Review Tax Strategies', `${BRAND.baseUrl}/dashboard/tax`)}
      </div>
      
      <p style="font-size: 14px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 24px 0 0 0;">
        Need help? Ask our AI advisor about strategies to optimize before this deadline.
      </p>
    `, { unsubscribeUrl: `${BRAND.baseUrl}/dashboard/settings?tab=notifications` });
    
    const text = `
Tax Deadline Reminder

${greeting}

Upcoming deadline: ${deadline}
Due: ${deadlineDate}

${description}

Review tax strategies: ${BRAND.baseUrl}/dashboard/tax

- The Charge Wealth Team
    `.trim();
    
    return {
      subject: `⏰ Tax Deadline: ${deadline} - ${deadlineDate}`,
      html,
      text,
    };
  },

  /**
   * Opportunity Alert - High-value insight discovered
   */
  opportunityAlert: (data: {
    firstName?: string;
    title: string;
    description: string;
    potentialSavings?: number;
    actionUrl?: string;
  }): EmailTemplate => {
    const { firstName, title, description, potentialSavings, actionUrl } = data;
    const greeting = firstName ? `${firstName},` : '';
    
    const html = baseTemplate(`
      <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">
        💰 New Opportunity Found
      </h2>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        ${greeting} Our AI identified something you should see:
      </p>
      
      <div style="background: ${BRAND.cardBg}; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="color: ${BRAND.textPrimary}; margin: 0 0 12px 0; font-size: 20px;">
          ${title}
        </h3>
        <p style="margin: 0 0 16px 0; font-size: 16px; color: ${BRAND.textSecondary}; line-height: 1.6;">
          ${description}
        </p>
        ${potentialSavings ? `
        <div style="background: ${BRAND.darkBg}; padding: 12px 16px; border-radius: 8px; display: inline-block;">
          <span style="color: ${BRAND.textSecondary}; font-size: 14px;">Potential savings:</span>
          <span style="color: ${BRAND.success}; font-size: 20px; font-weight: 700; margin-left: 8px;">
            $${potentialSavings.toLocaleString()}
          </span>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        ${goldButton('View Details', actionUrl || `${BRAND.baseUrl}/dashboard`)}
      </div>
    `, { unsubscribeUrl: `${BRAND.baseUrl}/dashboard/settings?tab=notifications` });
    
    const text = `
New Opportunity Found

${greeting ? `${greeting} ` : ''}Our AI identified something you should see:

${title}

${description}

${potentialSavings ? `Potential savings: $${potentialSavings.toLocaleString()}` : ''}

View details: ${actionUrl || BRAND.baseUrl}

- The Charge Wealth Team
    `.trim();
    
    return {
      subject: `💰 ${title}${potentialSavings ? ` - Save $${potentialSavings.toLocaleString()}` : ''}`,
      html,
      text,
    };
  },
};

// ============================================
// SEND FUNCTIONS
// ============================================

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
  scheduledAt?: Date;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = await getResendClient();
  
  if (!resend) {
    console.log(`[Email] Sending disabled - would have sent "${options.subject}" to ${options.to}`);
    return { success: false, error: 'Resend not configured' };
  }
  
  try {
    const { data, error } = await resend.client.emails.send({
      from: resend.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || BRAND.supportEmail,
      tags: options.tags,
      scheduled_at: options.scheduledAt?.toISOString(),
    });
    
    if (error) {
      console.error(`[Email] Failed to send to ${options.to}:`, error);
      return { success: false, error: error.message };
    }
    
    console.log(`[Email] Sent "${options.subject}" to ${options.to} (ID: ${data?.id})`);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error(`[Email] Error sending to ${options.to}:`, error);
    return { success: false, error: error.message };
  }
}

// Convenience functions for specific email types
export async function sendWelcomeEmail(to: string, firstName?: string): Promise<boolean> {
  const template = emailTemplates.welcome(firstName);
  const result = await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: 'type', value: 'welcome' }],
  });
  return result.success;
}

export async function sendOnboardingNudge(to: string, firstName?: string, completionPercent: number = 0): Promise<boolean> {
  const template = emailTemplates.onboardingNudge(firstName, completionPercent);
  const result = await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: 'type', value: 'onboarding-nudge' }],
  });
  return result.success;
}

export async function sendWeeklyDigest(to: string, data: Parameters<typeof emailTemplates.weeklyDigest>[0]): Promise<boolean> {
  const template = emailTemplates.weeklyDigest(data);
  const result = await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: 'type', value: 'weekly-digest' }],
  });
  return result.success;
}

export async function sendTaxDeadlineReminder(to: string, data: Parameters<typeof emailTemplates.taxDeadlineReminder>[0]): Promise<boolean> {
  const template = emailTemplates.taxDeadlineReminder(data);
  const result = await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: 'type', value: 'tax-deadline' }],
  });
  return result.success;
}

export async function sendOpportunityAlert(to: string, data: Parameters<typeof emailTemplates.opportunityAlert>[0]): Promise<boolean> {
  const template = emailTemplates.opportunityAlert(data);
  const result = await sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
    tags: [{ name: 'type', value: 'opportunity-alert' }],
  });
  return result.success;
}

// ============================================
// BATCH SEND UTILITIES
// ============================================

export async function sendBatchEmails(
  emails: Array<{ to: string; template: EmailTemplate; tags?: Array<{ name: string; value: string }> }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  
  for (const email of emails) {
    const result = await sendEmail({
      to: email.to,
      subject: email.template.subject,
      html: email.template.html,
      text: email.template.text,
      tags: email.tags,
    });
    
    if (result.success) {
      sent++;
    } else {
      failed++;
    }
    
    // Rate limit: 10 emails per second max
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { sent, failed };
}

// ============================================
// WAITLIST / NEWSLETTER DRIP SEQUENCE
// ============================================

export const waitlistTemplates = {
  /**
   * Initial waitlist welcome - sent immediately
   */
  waitlistWelcome: (): EmailTemplate => {
    const html = baseTemplate(`
      <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 24px 0; font-size: 28px; font-weight: 600;">
        You're In - Here's What Happens Next
      </h2>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        You just did something 99% of high earners never do: <strong>you questioned the system.</strong>
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        The financial industry has spent decades making you feel like you need them. Like your $200K+ income somehow isn't enough for you to make smart decisions about your own money.
      </p>
      
      <p style="font-size: 18px; line-height: 1.7; color: ${BRAND.goldAccent}; font-weight: 600; margin: 0 0 24px 0;">
        That ends now.
      </p>
      
      ${infoCard(`
        <h3 style="color: ${BRAND.goldAccent}; margin: 0 0 12px 0; font-size: 16px;">Here's what's coming:</h3>
        <ul style="margin: 0; padding-left: 20px; color: ${BRAND.textSecondary}; line-height: 1.8;">
          <li style="margin-bottom: 8px;">AI-powered tax strategies that could save you $15K+/year</li>
          <li style="margin-bottom: 8px;">Portfolio analysis without the sales pitch</li>
          <li style="margin-bottom: 8px;">Clear answers, not industry jargon</li>
        </ul>
      `)}
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        Over the next few days, I'll show you exactly how the financial industry has been taking advantage of high earners like you - and how to fight back.
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 24px 0 0 0;">
        Talk soon,<br>
        <strong style="color: ${BRAND.textPrimary};">The Charge Wealth Team</strong>
      </p>
    `, { showFooter: true });
    
    const text = `
You're In - Here's What Happens Next

You just did something 99% of high earners never do: you questioned the system.

The financial industry has spent decades making you feel like you need them. That ends now.

Here's what's coming:
- AI-powered tax strategies that could save you $15K+/year
- Portfolio analysis without the sales pitch
- Clear answers, not industry jargon

Over the next few days, I'll show you exactly how the financial industry has been taking advantage of high earners like you - and how to fight back.

Talk soon,
The Charge Wealth Team
    `.trim();
    
    return {
      subject: "You're In - Here's What Happens Next",
      html,
      text,
    };
  },

  /**
   * Day 2 - Pain point: Financial planner fees
   */
  day2PainPoint: (): EmailTemplate => {
    const html = baseTemplate(`
      <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">
        Let's Talk About That $15K
      </h2>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        The average high earner pays <strong style="color: ${BRAND.error};">$15,000+ per year</strong> for financial planning.
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        Here's what that actually gets you:
      </p>
      
      <ul style="margin: 20px 0; padding-left: 20px; color: ${BRAND.textSecondary}; font-size: 16px; line-height: 1.8;">
        <li>A fancy office with expensive coffee</li>
        <li>Quarterly meetings where they read reports at you</li>
        <li>Commission-driven product recommendations</li>
        <li>The same generic advice you could get from a $20 book</li>
      </ul>
      
      ${infoCard(`
        <p style="color: ${BRAND.error}; font-weight: 600; margin: 0 0 8px 0;">The uncomfortable truth:</p>
        <p style="color: ${BRAND.textPrimary}; margin: 0;">
          Most financial planners are salespeople with licenses. Their job isn't to make you wealthy - it's to sell you products that make <em>them</em> wealthy.
        </p>
      `, { borderColor: BRAND.error })}
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        You didn't earn $200K+ by being gullible. So why are you paying someone else to manage money you're perfectly capable of managing yourself?
      </p>
      
      <p style="font-size: 18px; line-height: 1.7; color: ${BRAND.goldAccent}; font-weight: 600; margin: 0 0 16px 0;">
        The real question isn't whether you can do this. It's whether you have the right tools.
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        Tomorrow, I'll break down the even bigger scam: percentage-based fees that silently drain your retirement.
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 24px 0 0 0;">
        Stay skeptical,<br>
        <strong style="color: ${BRAND.textPrimary};">The Charge Wealth Team</strong>
      </p>
    `, { showFooter: true });
    
    const text = `
The $15K Financial Planner Fee Scam

The average high earner pays $15,000+ per year for financial planning.

Here's what that actually gets you:
- A fancy office with expensive coffee
- Quarterly meetings where they read reports at you
- Commission-driven product recommendations
- The same generic advice you could get from a $20 book

The uncomfortable truth: Most financial planners are salespeople with licenses.

The real question isn't whether you can do this. It's whether you have the right tools.

Tomorrow, I'll break down the even bigger scam: percentage-based fees that silently drain your retirement.

Stay skeptical,
The Charge Wealth Team
    `.trim();
    
    return {
      subject: "The $15K Financial Planner Fee Scam",
      html,
      text,
    };
  },

  /**
   * Day 4 - More pain: AUM fees
   */
  day4MorePain: (): EmailTemplate => {
    const html = baseTemplate(`
      <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">
        The 1% That Costs You $500K
      </h2>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 8px 0;">
        "It's just 1%."
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        That's what they tell you. Sounds reasonable, right?
      </p>
      
      <p style="font-size: 18px; line-height: 1.7; color: ${BRAND.error}; font-weight: 600; margin: 0 0 24px 0;">
        It's not.
      </p>
      
      <div style="background: ${BRAND.cardBg}; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h3 style="color: ${BRAND.goldAccent}; margin: 0 0 16px 0; font-size: 16px;">Let's do the math on a $1M portfolio:</h3>
        <table style="width: 100%; color: ${BRAND.textPrimary}; font-size: 14px; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #2A2D38;">
            <td style="padding: 12px 0;">Year 1</td>
            <td style="text-align: right; color: ${BRAND.error}; font-weight: 600;">-$10,000</td>
          </tr>
          <tr style="border-bottom: 1px solid #2A2D38;">
            <td style="padding: 12px 0;">Over 10 years</td>
            <td style="text-align: right; color: ${BRAND.error}; font-weight: 600;">-$120,000+</td>
          </tr>
          <tr style="border-bottom: 1px solid #2A2D38;">
            <td style="padding: 12px 0;">Over 25 years</td>
            <td style="text-align: right; color: ${BRAND.error}; font-weight: 600;">-$500,000+</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600;">What you actually get</td>
            <td style="text-align: right; color: ${BRAND.textSecondary};">Quarterly emails</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        That 1% compounds against you every single year. And here's the part they don't tell you:
      </p>
      
      <p style="font-size: 18px; line-height: 1.7; color: ${BRAND.goldAccent}; font-weight: 600; margin: 0 0 16px 0;">
        They charge the same fee whether your portfolio goes up OR down.
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        You take all the risk. They take a guaranteed cut. Every. Single. Year.
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        There's a better way. And in a few days, I'll show you exactly what it looks like.
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 24px 0 0 0;">
        Your money, your rules,<br>
        <strong style="color: ${BRAND.textPrimary};">The Charge Wealth Team</strong>
      </p>
    `, { showFooter: true });
    
    const text = `
Why 1% AUM Fees Steal Your Retirement

"It's just 1%." That's what they tell you. Sounds reasonable, right?

It's not.

Let's do the math on a $1M portfolio:
- Year 1: -$10,000
- Over 10 years: -$120,000+
- Over 25 years: -$500,000+
- What you actually get: Quarterly emails

That 1% compounds against you every single year.

They charge the same fee whether your portfolio goes up OR down. You take all the risk. They take a guaranteed cut.

There's a better way. And in a few days, I'll show you exactly what it looks like.

Your money, your rules,
The Charge Wealth Team
    `.trim();
    
    return {
      subject: "Why 1% AUM Fees Steal Your Retirement",
      html,
      text,
    };
  },

  /**
   * Day 7 - Conversion: Early access offer
   */
  day7Conversion: (): EmailTemplate => {
    const html = baseTemplate(`
      <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 24px 0; font-size: 24px; font-weight: 600;">
        Your Early Access Is Ready
      </h2>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 0 0 16px 0;">
        You've seen the numbers. You know what the industry has been doing to high earners like you.
      </p>
      
      <p style="font-size: 18px; line-height: 1.7; color: ${BRAND.goldAccent}; font-weight: 600; margin: 0 0 24px 0;">
        Now it's time to do something about it.
      </p>
      
      <div style="background: linear-gradient(135deg, ${BRAND.cardBg} 0%, ${BRAND.darkBg} 100%); border: 2px solid ${BRAND.goldAccent}; padding: 32px; margin: 24px 0; border-radius: 12px; text-align: center;">
        <h2 style="color: ${BRAND.goldAccent}; margin: 0 0 8px 0; font-size: 32px;">$279</h2>
        <p style="color: ${BRAND.textSecondary}; margin: 0 0 16px 0; font-size: 14px;">Lifetime Access • No Monthly Fees • No Hidden Costs</p>
        
        <div style="background: ${BRAND.darkBg}; padding: 12px 16px; border-radius: 8px; margin: 16px 0; display: inline-block;">
          <p style="color: ${BRAND.success}; font-weight: 600; margin: 0;">
            Save $15,000+/year vs traditional financial planners
          </p>
        </div>
        
        <div style="margin-top: 16px;">
          ${goldButton('Get Lifetime Access Now', `${BRAND.baseUrl}/dashboard`)}
        </div>
      </div>
      
      <h3 style="color: ${BRAND.textPrimary}; margin: 24px 0 16px 0; font-size: 18px;">What you get:</h3>
      
      <div style="margin-bottom: 24px;">
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND.success}; margin-right: 12px;">✓</span>
          <span style="color: ${BRAND.textPrimary};"><strong>AI Tax Advisor</strong> - Find every deduction, estimate real savings</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND.success}; margin-right: 12px;">✓</span>
          <span style="color: ${BRAND.textPrimary};"><strong>Portfolio Engine</strong> - CFA-level analysis without the fees</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND.success}; margin-right: 12px;">✓</span>
          <span style="color: ${BRAND.textPrimary};"><strong>AI Financial Advisor</strong> - Your personal CFO, available 24/7</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="color: ${BRAND.success}; margin-right: 12px;">✓</span>
          <span style="color: ${BRAND.textPrimary};"><strong>Custom Playbooks</strong> - Step-by-step action plans</span>
        </div>
        <div>
          <span style="color: ${BRAND.success}; margin-right: 12px;">✓</span>
          <span style="color: ${BRAND.textPrimary};"><strong>Lifetime Updates</strong> - Every new feature, forever</span>
        </div>
      </div>
      
      ${infoCard(`
        <p style="color: ${BRAND.textSecondary}; margin: 0; font-size: 14px; text-align: center;">
          <strong style="color: ${BRAND.goldAccent};">30-Day Money Back Guarantee.</strong> If Charge Wealth doesn't save you at least $279 in the first month, get a full refund. No questions asked.
        </p>
      `)}
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textPrimary}; margin: 24px 0 16px 0;">
        Stop paying others to manage your money. Start taking control.
      </p>
      
      <p style="font-size: 16px; line-height: 1.7; color: ${BRAND.textSecondary}; margin: 24px 0 0 0;">
        To your financial freedom,<br>
        <strong style="color: ${BRAND.textPrimary};">The Charge Wealth Team</strong>
      </p>
    `, { showFooter: true });
    
    const text = `
Get Early Access - $279 Lifetime Deal

You've seen the numbers. You know what the industry has been doing to high earners like you.

Now it's time to do something about it.

$279 - Lifetime Access
No Monthly Fees • No Hidden Costs

Save $15,000+/year vs traditional financial planners

What you get:
✓ AI Tax Advisor - Find every deduction, estimate real savings
✓ Portfolio Engine - CFA-level analysis without the fees
✓ AI Financial Advisor - Your personal CFO, available 24/7
✓ Custom Playbooks - Step-by-step action plans
✓ Lifetime Updates - Every new feature, forever

30-Day Money Back Guarantee. If Charge Wealth doesn't save you at least $279 in the first month, get a full refund.

Get Lifetime Access: ${BRAND.baseUrl}/dashboard

To your financial freedom,
The Charge Wealth Team
    `.trim();
    
    return {
      subject: "Get Early Access - $279 Lifetime Deal",
      html,
      text,
    };
  },
};

/**
 * Send the full waitlist welcome sequence with scheduled emails
 */
export async function sendWelcomeSequence(email: string): Promise<void> {
  const resend = await getResendClient();
  
  // Send immediate welcome
  const welcomeTemplate = waitlistTemplates.waitlistWelcome();
  await sendEmail({
    to: email,
    subject: welcomeTemplate.subject,
    html: welcomeTemplate.html,
    text: welcomeTemplate.text,
    tags: [{ name: 'type', value: 'waitlist-welcome' }],
  });
  
  if (!resend) {
    console.log(`[Email] Would schedule drip sequence for ${email} (Resend not configured)`);
    return;
  }
  
  const now = new Date();
  
  // Schedule Day 2 - Pain point
  const day2 = new Date(now);
  day2.setDate(day2.getDate() + 2);
  day2.setHours(9, 0, 0, 0);
  const day2Template = waitlistTemplates.day2PainPoint();
  await sendEmail({
    to: email,
    subject: day2Template.subject,
    html: day2Template.html,
    text: day2Template.text,
    tags: [{ name: 'type', value: 'waitlist-day2' }],
    scheduledAt: day2,
  });
  
  // Schedule Day 4 - More pain
  const day4 = new Date(now);
  day4.setDate(day4.getDate() + 4);
  day4.setHours(9, 0, 0, 0);
  const day4Template = waitlistTemplates.day4MorePain();
  await sendEmail({
    to: email,
    subject: day4Template.subject,
    html: day4Template.html,
    text: day4Template.text,
    tags: [{ name: 'type', value: 'waitlist-day4' }],
    scheduledAt: day4,
  });
  
  // Schedule Day 7 - Conversion
  const day7 = new Date(now);
  day7.setDate(day7.getDate() + 7);
  day7.setHours(9, 0, 0, 0);
  const day7Template = waitlistTemplates.day7Conversion();
  await sendEmail({
    to: email,
    subject: day7Template.subject,
    html: day7Template.html,
    text: day7Template.text,
    tags: [{ name: 'type', value: 'waitlist-day7' }],
    scheduledAt: day7,
  });
  
  console.log(`[Email] Welcome sequence scheduled for ${email}`);
}
