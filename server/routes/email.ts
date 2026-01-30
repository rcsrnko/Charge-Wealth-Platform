/**
 * Email Routes for Charge Wealth
 * 
 * Provides endpoints for:
 * - Triggering welcome emails
 * - Cron-friendly batch email endpoints
 * - Email preference management
 */

import type { Express, RequestHandler } from 'express';
import { db } from '../db';
import { storage } from '../storage';
import { users } from '../../shared/schema';
import { eq, and, isNull, lt, gte, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  sendWelcomeEmail,
  sendOnboardingNudge,
  sendWeeklyDigest,
  sendOpportunityAlert,
  sendTaxDeadlineReminder,
} from '../services/email';

// Simple in-memory tracking for email sends (in production, use database)
const emailSendLog = new Map<string, { type: string; sentAt: Date }[]>();

function logEmailSent(userId: string, type: string) {
  if (!emailSendLog.has(userId)) {
    emailSendLog.set(userId, []);
  }
  emailSendLog.get(userId)!.push({ type, sentAt: new Date() });
}

function wasEmailSentRecently(userId: string, type: string, withinHours: number): boolean {
  const logs = emailSendLog.get(userId) || [];
  const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000);
  return logs.some(log => log.type === type && log.sentAt > cutoff);
}

export function registerEmailRoutes(app: Express, isAuthenticated: RequestHandler) {
  /**
   * Send welcome email to a specific user
   * POST /api/email/send-welcome
   */
  app.post('/api/email/send-welcome', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ message: 'User email not found' });
      }
      
      // Check if welcome was sent recently (within 24h)
      if (wasEmailSentRecently(userId, 'welcome', 24)) {
        return res.json({ 
          success: false, 
          message: 'Welcome email already sent recently' 
        });
      }
      
      const success = await sendWelcomeEmail(user.email, user.firstName || undefined);
      
      if (success) {
        logEmailSent(userId, 'welcome');
      }
      
      res.json({ success, message: success ? 'Welcome email sent' : 'Failed to send email' });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      res.status(500).json({ message: 'Failed to send welcome email' });
    }
  });

  /**
   * Trigger welcome email for a new user (internal use)
   * Called after user creation/signup
   */
  app.post('/api/internal/email/welcome', async (req, res) => {
    try {
      const { userId, email, firstName } = req.body;
      
      // Basic validation
      if (!email) {
        return res.status(400).json({ message: 'Email required' });
      }
      
      // Check authorization header for internal calls
      const authHeader = req.headers['x-internal-key'];
      if (authHeader !== process.env.INTERNAL_API_KEY && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const success = await sendWelcomeEmail(email, firstName);
      
      if (success && userId) {
        logEmailSent(userId, 'welcome');
      }
      
      res.json({ success });
    } catch (error) {
      console.error('Error in internal welcome email:', error);
      res.status(500).json({ message: 'Failed to send welcome email' });
    }
  });

  /**
   * Cron endpoint: Process onboarding nudge emails
   * Should be called ~24 hours after users sign up
   * 
   * GET /api/cron/email/onboarding-nudge
   */
  app.get('/api/cron/email/onboarding-nudge', async (req, res) => {
    try {
      // Optional cron secret for security
      const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
      if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Find users who:
      // 1. Signed up 24-48 hours ago
      // 2. Haven't completed onboarding
      // 3. Have an active subscription
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      
      const eligibleUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.onboardingCompleted, false),
            gte(users.createdAt, fortyEightHoursAgo),
            lt(users.createdAt, twentyFourHoursAgo),
            eq(users.subscriptionStatus, 'active')
          )
        )
        .limit(50); // Process in batches
      
      let sent = 0;
      let skipped = 0;
      
      for (const user of eligibleUsers) {
        if (!user.email) {
          skipped++;
          continue;
        }
        
        // Check if nudge was already sent
        if (wasEmailSentRecently(user.id, 'onboarding-nudge', 48)) {
          skipped++;
          continue;
        }
        
        // Get completion percentage
        const { percentage } = await storage.calculateProfileCompletion(user.id);
        
        // Only nudge if they haven't made much progress
        if (percentage < 75) {
          const success = await sendOnboardingNudge(user.email, user.firstName || undefined, percentage);
          if (success) {
            logEmailSent(user.id, 'onboarding-nudge');
            sent++;
          }
        } else {
          skipped++;
        }
        
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`[Cron] Onboarding nudge: ${sent} sent, ${skipped} skipped`);
      res.json({ success: true, sent, skipped, checked: eligibleUsers.length });
    } catch (error) {
      console.error('Error in onboarding nudge cron:', error);
      res.status(500).json({ message: 'Cron job failed' });
    }
  });

  /**
   * Cron endpoint: Send weekly digest emails
   * Should be called Monday morning
   * 
   * GET /api/cron/email/weekly-digest
   */
  app.get('/api/cron/email/weekly-digest', async (req, res) => {
    try {
      // Optional cron secret for security
      const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
      if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Find users who:
      // 1. Have email digest enabled
      // 2. Have an active subscription
      const eligibleUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.emailWeeklyDigest, true),
            eq(users.subscriptionStatus, 'active')
          )
        )
        .limit(100); // Process in batches
      
      let sent = 0;
      let skipped = 0;
      
      for (const user of eligibleUsers) {
        if (!user.email) {
          skipped++;
          continue;
        }
        
        // Check if digest was sent this week
        if (wasEmailSentRecently(user.id, 'weekly-digest', 24 * 6)) { // 6 days
          skipped++;
          continue;
        }
        
        try {
          // Gather user's weekly data
          const [snapshots, recommendations] = await Promise.all([
            storage.getNetWorthSnapshots(user.id, 2),
            storage.getPendingRecommendations(user.id),
          ]);
          
          // Calculate net worth change
          let netWorthChange: number | undefined;
          let netWorthChangePercent: number | undefined;
          
          if (snapshots.length >= 2) {
            const current = parseFloat(snapshots[0].netWorth);
            const previous = parseFloat(snapshots[1].netWorth);
            netWorthChange = current - previous;
            netWorthChangePercent = previous !== 0 ? (netWorthChange / previous) * 100 : 0;
          }
          
          const success = await sendWeeklyDigest(user.email, {
            firstName: user.firstName || undefined,
            netWorthChange,
            netWorthChangePercent,
            pendingActions: recommendations.length,
            topInsight: recommendations.length > 0 
              ? recommendations[0].title 
              : "Your AI advisor is ready to help with tax and investment questions.",
            marketHighlight: "Markets continue to evolve. Stay informed with your dashboard.",
          });
          
          if (success) {
            logEmailSent(user.id, 'weekly-digest');
            sent++;
          }
        } catch (userError) {
          console.error(`Error processing digest for user ${user.id}:`, userError);
          skipped++;
        }
        
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`[Cron] Weekly digest: ${sent} sent, ${skipped} skipped`);
      res.json({ success: true, sent, skipped, checked: eligibleUsers.length });
    } catch (error) {
      console.error('Error in weekly digest cron:', error);
      res.status(500).json({ message: 'Cron job failed' });
    }
  });

  /**
   * Send test email (for debugging)
   * POST /api/email/test
   */
  app.post('/api/email/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ message: 'User email not found' });
      }
      
      const { template = 'welcome' } = req.body;
      
      let success = false;
      
      switch (template) {
        case 'welcome':
          success = await sendWelcomeEmail(user.email, user.firstName || undefined);
          break;
        case 'onboarding-nudge':
          const { percentage } = await storage.calculateProfileCompletion(userId);
          success = await sendOnboardingNudge(user.email, user.firstName || undefined, percentage);
          break;
        case 'weekly-digest':
          success = await sendWeeklyDigest(user.email, {
            firstName: user.firstName || undefined,
            netWorthChange: 5420,
            netWorthChangePercent: 1.2,
            pendingActions: 3,
            topInsight: "Consider maxing out your 401(k) before year-end to reduce taxable income.",
            marketHighlight: "S&P 500 up 2.3% this week. Tech sector leading gains.",
          });
          break;
        case 'opportunity-alert':
          success = await sendOpportunityAlert(user.email, {
            firstName: user.firstName || undefined,
            title: 'Tax-Loss Harvesting Opportunity',
            description: 'Based on your portfolio, you have positions with unrealized losses that could offset gains.',
            potentialSavings: 3200,
            actionUrl: 'https://chargewealth.co/dashboard/tax',
          });
          break;
        case 'tax-deadline':
          success = await sendTaxDeadlineReminder(user.email, {
            firstName: user.firstName || undefined,
            deadline: 'Q4 Estimated Tax Payment',
            deadlineDate: 'January 15, 2026',
            description: 'If you have self-employment income or significant investment gains, estimated taxes may be due.',
          });
          break;
        default:
          return res.status(400).json({ message: 'Unknown template' });
      }
      
      res.json({ success, template, sentTo: user.email });
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  /**
   * Get email send history for current user
   * GET /api/email/history
   */
  app.get('/api/email/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.userId;
      const history = emailSendLog.get(userId) || [];
      
      res.json({
        emails: history.map(h => ({
          type: h.type,
          sentAt: h.sentAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('Error fetching email history:', error);
      res.status(500).json({ message: 'Failed to fetch email history' });
    }
  });
}

/**
 * Helper function to trigger welcome email after user creation
 * Call this from auth routes after successful signup
 */
export async function triggerWelcomeEmail(userId: string, email: string, firstName?: string): Promise<void> {
  try {
    // Small delay to ensure user record is committed
    setTimeout(async () => {
      const success = await sendWelcomeEmail(email, firstName);
      if (success) {
        logEmailSent(userId, 'welcome');
        console.log(`[Email] Welcome email triggered for ${email}`);
      }
    }, 2000);
  } catch (error) {
    console.error('Error triggering welcome email:', error);
  }
}
