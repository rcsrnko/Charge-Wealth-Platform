import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
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
      fromEmail: connectionSettings.settings.from_email || 'Charge Wealth <hello@chargewealth.co>'
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

export const emailTemplates = {
  welcome: {
    subject: "You're In - Here's What Happens Next",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0F14; color: #E8E6E3; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #C9A962; margin: 0; font-size: 28px;">Welcome to Charge Wealth</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          You just did something 99% of high earners never do: <strong>you questioned the system.</strong>
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          The financial industry has spent decades making you feel like you need them. Like your $200K+ income somehow isn't enough for you to make smart decisions about your own money.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          <strong style="color: #C9A962;">That ends now.</strong>
        </p>
        
        <div style="background: #1A1D28; border-left: 4px solid #C9A962; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <h3 style="color: #C9A962; margin: 0 0 12px 0;">Here's what's coming:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #A0A0A0;">
            <li style="margin-bottom: 8px;">AI-powered tax strategies that could save you $15K+/year</li>
            <li style="margin-bottom: 8px;">Portfolio analysis without the sales pitch</li>
            <li style="margin-bottom: 8px;">Clear answers, not industry jargon</li>
          </ul>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          Over the next few days, I'll show you exactly how the financial industry has been taking advantage of high earners like you—and how to fight back.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
          Talk soon,<br>
          <strong style="color: #E8E6E3;">The Charge Wealth Team</strong>
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2A2D38; text-align: center; font-size: 12px; color: #666;">
          <p>You're receiving this because you joined the Charge Wealth waitlist.</p>
        </div>
      </div>
    `,
  },
  
  day2PainPoint: {
    subject: "The $15K Financial Planner Fee Scam",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0F14; color: #E8E6E3; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #C9A962; margin: 0; font-size: 24px;">Let's Talk About That $15K</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          The average high earner pays <strong style="color: #EF4444;">$15,000+ per year</strong> for financial planning.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          Here's what that actually gets you:
        </p>
        
        <ul style="margin: 20px 0; padding-left: 20px; color: #A0A0A0; font-size: 16px; line-height: 1.8;">
          <li>A fancy office with expensive coffee</li>
          <li>Quarterly meetings where they read reports at you</li>
          <li>Commission-driven product recommendations</li>
          <li>The same generic advice you could get from a $20 book</li>
        </ul>
        
        <div style="background: #1A1D28; border: 1px solid #EF4444; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="color: #EF4444; font-weight: bold; margin: 0 0 8px 0;">The uncomfortable truth:</p>
          <p style="color: #E8E6E3; margin: 0;">
            Most financial planners are salespeople with licenses. Their job isn't to make you wealthy—it's to sell you products that make <em>them</em> wealthy.
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          You didn't earn $200K+ by being gullible. So why are you paying someone else to manage money you're perfectly capable of managing yourself?
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          <strong style="color: #C9A962;">The real question isn't whether you can do this. It's whether you have the right tools.</strong>
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          Tomorrow, I'll break down the even bigger scam: percentage-based fees that silently drain your retirement.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
          Stay skeptical,<br>
          <strong style="color: #E8E6E3;">The Charge Wealth Team</strong>
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2A2D38; text-align: center; font-size: 12px; color: #666;">
          <p>You're receiving this because you joined the Charge Wealth waitlist.</p>
        </div>
      </div>
    `,
  },
  
  day4MorePain: {
    subject: "Why 1% AUM Fees Steal Your Retirement",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0F14; color: #E8E6E3; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #C9A962; margin: 0; font-size: 24px;">The 1% That Costs You $500K</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          "It's just 1%."
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          That's what they tell you. Sounds reasonable, right?
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          <strong style="color: #EF4444;">It's not.</strong>
        </p>
        
        <div style="background: #1A1D28; padding: 24px; margin: 24px 0; border-radius: 8px;">
          <h3 style="color: #C9A962; margin: 0 0 16px 0;">Let's do the math on a $1M portfolio:</h3>
          <table style="width: 100%; color: #E8E6E3; font-size: 14px;">
            <tr style="border-bottom: 1px solid #2A2D38;">
              <td style="padding: 8px 0;">Year 1</td>
              <td style="text-align: right; color: #EF4444;">-$10,000</td>
            </tr>
            <tr style="border-bottom: 1px solid #2A2D38;">
              <td style="padding: 8px 0;">Over 10 years</td>
              <td style="text-align: right; color: #EF4444;">-$120,000+</td>
            </tr>
            <tr style="border-bottom: 1px solid #2A2D38;">
              <td style="padding: 8px 0;">Over 25 years</td>
              <td style="text-align: right; color: #EF4444;">-$500,000+</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">What you actually get</td>
              <td style="text-align: right; color: #A0A0A0;">Quarterly emails</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          That 1% compounds against you every single year. And here's the part they don't tell you:
        </p>
        
        <p style="font-size: 18px; line-height: 1.6; color: #C9A962; font-weight: bold;">
          They charge the same fee whether your portfolio goes up OR down.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          You take all the risk. They take a guaranteed cut. Every. Single. Year.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          There's a better way. And in a few days, I'll show you exactly what it looks like.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
          Your money, your rules,<br>
          <strong style="color: #E8E6E3;">The Charge Wealth Team</strong>
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2A2D38; text-align: center; font-size: 12px; color: #666;">
          <p>You're receiving this because you joined the Charge Wealth waitlist.</p>
        </div>
      </div>
    `,
  },
  
  day7Conversion: {
    subject: "Get Early Access - $279 Lifetime Deal",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0F14; color: #E8E6E3; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #C9A962; margin: 0; font-size: 24px;">Your Early Access Is Ready</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          You've seen the numbers. You know what the industry has been doing to high earners like you.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          <strong style="color: #C9A962;">Now it's time to do something about it.</strong>
        </p>
        
        <div style="background: linear-gradient(135deg, #1A1D28 0%, #0D0F14 100%); border: 2px solid #C9A962; padding: 32px; margin: 24px 0; border-radius: 12px; text-align: center;">
          <h2 style="color: #C9A962; margin: 0 0 8px 0; font-size: 32px;">$279</h2>
          <p style="color: #A0A0A0; margin: 0 0 16px 0; font-size: 14px;">Lifetime Access • No Monthly Fees • No Hidden Costs</p>
          
          <div style="background: #0D0F14; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="color: #4ADE80; font-weight: bold; margin: 0;">
              Save $15,000+/year vs traditional financial planners
            </p>
          </div>
          
          <a href="https://chargewealth.co/dashboard" style="display: inline-block; background: #C9A962; color: #0D0F14; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: bold; font-size: 16px; margin-top: 16px;">
            Get Lifetime Access Now
          </a>
        </div>
        
        <h3 style="color: #E8E6E3; margin: 24px 0 16px 0;">What you get:</h3>
        
        <div style="margin-bottom: 24px;">
          <div style="display: flex; margin-bottom: 12px;">
            <span style="color: #4ADE80; margin-right: 12px;">✓</span>
            <span style="color: #E8E6E3;"><strong>AI Tax Advisor</strong> - Find every deduction, estimate real savings</span>
          </div>
          <div style="display: flex; margin-bottom: 12px;">
            <span style="color: #4ADE80; margin-right: 12px;">✓</span>
            <span style="color: #E8E6E3;"><strong>Portfolio Engine</strong> - CFA-level analysis without the fees</span>
          </div>
          <div style="display: flex; margin-bottom: 12px;">
            <span style="color: #4ADE80; margin-right: 12px;">✓</span>
            <span style="color: #E8E6E3;"><strong>AI Financial Advisor</strong> - Your personal CFO, available 24/7</span>
          </div>
          <div style="display: flex; margin-bottom: 12px;">
            <span style="color: #4ADE80; margin-right: 12px;">✓</span>
            <span style="color: #E8E6E3;"><strong>Custom Playbooks</strong> - Step-by-step action plans</span>
          </div>
          <div style="display: flex;">
            <span style="color: #4ADE80; margin-right: 12px;">✓</span>
            <span style="color: #E8E6E3;"><strong>Lifetime Updates</strong> - Every new feature, forever</span>
          </div>
        </div>
        
        <div style="background: #1A1D28; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="color: #A0A0A0; margin: 0; font-size: 14px; text-align: center;">
            <strong style="color: #C9A962;">30-Day Money Back Guarantee.</strong> If Charge Wealth doesn't save you at least $279 in the first month, get a full refund. No questions asked.
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #E8E6E3;">
          Stop paying others to manage your money. Start taking control.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
          To your financial freedom,<br>
          <strong style="color: #E8E6E3;">The Charge Wealth Team</strong>
        </p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2A2D38; text-align: center; font-size: 12px; color: #666;">
          <p>You're receiving this because you joined the Charge Wealth waitlist.</p>
        </div>
      </div>
    `,
  },
};

export async function sendEmail(to: string, template: keyof typeof emailTemplates): Promise<boolean> {
  const resend = await getResendClient();
  if (!resend) {
    console.log(`Email sending disabled - would have sent ${template} to ${to}`);
    return false;
  }
  
  try {
    const { subject, html } = emailTemplates[template];
    
    const { error } = await resend.client.emails.send({
      from: resend.fromEmail,
      to,
      subject,
      html,
    });
    
    if (error) {
      console.error(`Failed to send ${template} email to ${to}:`, error);
      return false;
    }
    
    console.log(`Successfully sent ${template} email to ${to}`);
    return true;
  } catch (error) {
    console.error(`Error sending ${template} email:`, error);
    return false;
  }
}

export async function scheduleEmail(to: string, template: keyof typeof emailTemplates, scheduledAt: Date): Promise<boolean> {
  const resend = await getResendClient();
  if (!resend) {
    console.log(`Email sending disabled - would have scheduled ${template} to ${to} for ${scheduledAt.toISOString()}`);
    return false;
  }
  
  try {
    const { subject, html } = emailTemplates[template];
    
    const { error } = await resend.client.emails.send({
      from: resend.fromEmail,
      to,
      subject,
      html,
      scheduledAt: scheduledAt.toISOString(),
    });
    
    if (error) {
      console.error(`Failed to schedule ${template} email to ${to}:`, error);
      return false;
    }
    
    console.log(`Scheduled ${template} email to ${to} for ${scheduledAt.toISOString()}`);
    return true;
  } catch (error) {
    console.error(`Error scheduling ${template} email:`, error);
    return false;
  }
}

export async function sendWelcomeSequence(email: string): Promise<void> {
  const now = new Date();
  
  await sendEmail(email, 'welcome');
  
  const day2 = new Date(now);
  day2.setDate(day2.getDate() + 2);
  day2.setHours(9, 0, 0, 0);
  await scheduleEmail(email, 'day2PainPoint', day2);
  
  const day4 = new Date(now);
  day4.setDate(day4.getDate() + 4);
  day4.setHours(9, 0, 0, 0);
  await scheduleEmail(email, 'day4MorePain', day4);
  
  const day7 = new Date(now);
  day7.setDate(day7.getDate() + 7);
  day7.setHours(9, 0, 0, 0);
  await scheduleEmail(email, 'day7Conversion', day7);
  
  console.log(`Welcome sequence scheduled for ${email}`);
}
