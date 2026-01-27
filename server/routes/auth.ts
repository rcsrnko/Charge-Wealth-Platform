import type { Express, RequestHandler } from "express";
import { sql } from "drizzle-orm";
import { storage } from "../storage";
import { db } from "../db";
import { authLimiter } from "../middleware/rateLimit";

// Demo credentials from environment (never hardcode)
const TEST_USER = {
  username: process.env.DEMO_USERNAME || '',
  password: process.env.DEMO_PASSWORD || ''
};

export function registerAuthRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.post('/api/test-login', authLimiter, async (req, res) => {
    if (process.env.ENABLE_DEMO_LOGIN !== 'true') {
      return res.status(404).json({ message: 'Not found' });
    }
    try {
      const { username, password } = req.body;
      
      if (username === TEST_USER.username && password === TEST_USER.password) {
        const testUser = await storage.upsertUser({
          id: 'test-user-001',
          email: 'testuser@charge.test',
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

  app.post('/api/auth/supabase-sync', async (req, res) => {
    try {
      const { user } = req.body;
      
      if (!user || !user.id || !user.email) {
        return res.status(400).json({ message: 'Invalid user data' });
      }
      
      const nameParts = (user.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const dbUser = await storage.upsertUser({
        id: user.id,
        email: user.email,
        firstName,
        lastName,
      });
      
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
}
