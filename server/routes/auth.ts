import type { Express, RequestHandler } from "express";
import { sql } from "drizzle-orm";
import { storage } from "../storage";
import { db } from "../db";
import { authLimiter } from "../middleware/rateLimit";
import { getUncachableStripeClient } from "../stripeClient";

// Demo credentials from environment (never hardcode)
const TEST_EMAIL = 'testuser@test.com';
const TEST_PASSWORD = process.env.DEMO_PASSWORD || '';

export function registerAuthRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.post('/api/test-login', authLimiter, async (req, res) => {
    if (process.env.ENABLE_DEMO_LOGIN !== 'true') {
      return res.status(404).json({ message: 'Not found' });
    }
    try {
      const { email, password } = req.body;
      
      if (email === TEST_EMAIL && password === TEST_PASSWORD) {
        const testUser = await storage.upsertUser({
          id: 'test-user-001',
          email: TEST_EMAIL,
          firstName: 'Test',
          lastName: 'User',
        });
        
        const user = {
          claims: { sub: testUser.id },
          expires_at: Math.floor(Date.now() / 1000) + 86400 * 7
        };
        
        req.login(user, (err) => {
          if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: 'Login failed' });
          }
          res.json({ success: true, user: testUser });
        });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Test login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Session check endpoint (no auth required) - for checking if user is logged in via server session
  app.get('/api/auth/session', async (req: any, res) => {
    try {
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          return res.json({ authenticated: true, user });
        }
      }
      res.json({ authenticated: false });
    } catch (error) {
      console.error('Session check error:', error);
      res.json({ authenticated: false });
    }
  });

  app.post('/api/auth/supabase-sync', async (req, res) => {
    try {
      const { user } = req.body;
      
      if (!user || !user.id || !user.email) {
        return res.status(400).json({ message: 'Invalid user data' });
      }
      
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // First check if a user with this email already exists (may have paid before OAuth)
      let dbUser = await storage.getUserByEmail(user.email);
      
      if (dbUser) {
        // User exists by email - update their Supabase ID if different
        if (dbUser.id !== user.id) {
          // Update the user record to use the Supabase ID while preserving subscription data
          await db.execute(sql`
            UPDATE users 
            SET id = ${user.id}, 
                first_name = COALESCE(NULLIF(${firstName}, ''), first_name),
                last_name = COALESCE(NULLIF(${lastName}, ''), last_name),
                updated_at = NOW()
            WHERE email = ${user.email}
          `);
          dbUser = await storage.getUser(user.id);
        }
      } else {
        // Create new user with Supabase ID
        dbUser = await storage.upsertUser({
          id: user.id,
          email: user.email,
          firstName,
          lastName,
        });
      }
      
      if (!dbUser) {
        return res.status(500).json({ message: 'Failed to create/update user' });
      }
      
      const sessionUser = {
        claims: { sub: dbUser.id },
        expires_at: Math.floor(Date.now() / 1000) + 86400 * 7
      };
      
      req.login(sessionUser, (err) => {
        if (err) {
          console.error('Supabase session sync error:', err);
          return res.status(500).json({ message: 'Failed to sync session' });
        }
        res.json({ success: true, user: dbUser });
      });
    } catch (error) {
      console.error('Supabase auth sync error:', error);
      res.status(500).json({ message: 'Failed to sync authentication' });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/onboarding/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [profile, taxReturns, positions, liquidity] = await Promise.all([
        storage.getFinancialProfile(userId),
        storage.getTaxReturns(userId),
        storage.getPortfolioPositions(userId),
        storage.getLiquidityProfile(userId)
      ]);

      const financialProfile = !!(profile && profile.annualIncome && profile.filingStatus);
      const taxReturn = !!(taxReturns && taxReturns.length > 0);
      const portfolioPositions = !!(positions && positions.length > 0);
      const cashFlow = !!(liquidity && liquidity.monthlyEssentialExpenses);

      const completedItems = [financialProfile, taxReturn, portfolioPositions, cashFlow].filter(Boolean).length;
      const completionPercentage = Math.round((completedItems / 4) * 100);

      res.json({
        financialProfile,
        taxReturn,
        portfolioPositions,
        cashFlow,
        completionPercentage
      });
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      res.status(500).json({ message: "Failed to fetch onboarding status" });
    }
  });

  app.post('/api/user/onboarding-complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await db.execute(sql`UPDATE users SET onboarding_completed = true, updated_at = NOW() WHERE id = ${userId}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.get('/api/user/onboarding-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ 
        onboardingCompleted: user?.onboardingCompleted || false 
      });
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      res.status(500).json({ message: "Failed to fetch onboarding status" });
    }
  });

  // Check membership/subscription status
  app.get('/api/user/membership-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Test user always has access for development
      const isTestUser = userId === 'test-user-001';
      
      // Check if subscription is active
      const isActive = isTestUser || 
        user.subscriptionStatus === 'active' ||
        (user.subscriptionType === 'lifetime');
      
      // Check if subscription has expired (for non-lifetime)
      let hasExpired = false;
      if (user.subscriptionEndDate && user.subscriptionType !== 'lifetime') {
        hasExpired = new Date(user.subscriptionEndDate) < new Date();
      }

      res.json({
        hasMembership: isActive && !hasExpired,
        subscriptionStatus: isTestUser ? 'active' : (user.subscriptionStatus || 'none'),
        subscriptionType: isTestUser ? 'lifetime' : user.subscriptionType,
        expiresAt: user.subscriptionEndDate,
        isTestUser
      });
    } catch (error) {
      console.error("Error fetching membership status:", error);
      res.status(500).json({ message: "Failed to fetch membership status" });
    }
  });

  app.post('/api/auth/signup-checkout', async (req, res) => {
    try {
      const { firstName, lastName, email, referralCode } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'First name, last name, and email are required' });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.subscriptionStatus === 'active') {
        return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
      }
      
      const stripe = await getUncachableStripeClient();
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://chargewealth.co' 
        : `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'chargewealth.co'}`;
      
      let hasReferralDiscount = false;
      let referrer = null;
      let finalAmount = 27900;
      
      if (referralCode) {
        referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          hasReferralDiscount = true;
          finalAmount = 24900;
        }
      }
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        success_url: `${baseUrl}/api/auth/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
        allow_promotion_codes: !hasReferralDiscount,
        metadata: {
          firstName,
          lastName,
          email,
          planType: 'lifetime',
          referralCode: referralCode || '',
          referrerId: referrer?.id || '',
        },
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: hasReferralDiscount ? 'Charge Wealth Lifetime Access (Referral Discount)' : 'Charge Wealth Lifetime Access',
              description: hasReferralDiscount ? '$30 off with referral' : 'One-time payment for lifetime access',
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        }],
      });
      
      res.json({ url: session.url, hasReferralDiscount, finalPrice: finalAmount / 100 });
    } catch (error) {
      console.error('Signup checkout error:', error);
      res.status(500).json({ message: 'Failed to start checkout' });
    }
  });

  app.get('/api/auth/payment-success', async (req, res) => {
    try {
      const { session_id } = req.query;
      
      if (!session_id || typeof session_id !== 'string') {
        return res.redirect('/dashboard?payment=error');
      }
      
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      if (session.payment_status !== 'paid') {
        return res.redirect('/dashboard?payment=failed');
      }
      
      const { firstName, lastName, email, planType, referralCode, referrerId } = session.metadata || {};
      
      if (!email) {
        return res.redirect('/dashboard?payment=error');
      }
      
      const userId = `email-${email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
      const user = await storage.upsertUser({
        id: userId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
      });
      
      await storage.updateUserSubscription(user.id, {
        subscriptionStatus: 'active',
        subscriptionType: planType || 'lifetime',
        stripeCustomerId: session.customer as string || null,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: null,
      });
      
      if (referralCode && referrerId) {
        try {
          await storage.completeReferral(referralCode, user.id, 30);
        } catch (e) {
          console.log('Referral completion skipped:', e);
        }
      }
      
      const sessionUser = {
        claims: { sub: user.id },
        expires_at: Math.floor(Date.now() / 1000) + 86400 * 30
      };
      
      req.login(sessionUser, (err) => {
        if (err) {
          console.error('Login after payment error:', err);
          return res.redirect('/dashboard?payment=success&login=pending');
        }
        res.redirect('/dashboard?payment=success');
      });
    } catch (error) {
      console.error('Payment success handler error:', error);
      res.redirect('/dashboard?payment=error');
    }
  });
}
