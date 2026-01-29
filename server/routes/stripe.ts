import type { Express, RequestHandler } from "express";
import { sql } from "drizzle-orm";
import { storage } from "../storage";
import { db } from "../db";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";

export function registerStripeRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.get('/api/stripe/config', async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ message: "Failed to get Stripe config" });
    }
  });

  app.get('/api/stripe/products', async (_req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency
        FROM stripe.products p
        JOIN stripe.prices pr ON pr.product = p.id
        WHERE p.active = true AND pr.active = true
        ORDER BY pr.unit_amount
      `);
      const rows = Array.isArray(result) ? result : ((result as any).rows || []);
      res.json({ products: rows });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/stripe/checkout', async (req, res) => {
    try {
      const { planType, email, referralCode } = req.body;
      
      // Define pricing for each plan type
      const planConfig: Record<string, { name: string; amount: number; description: string }> = {
        'lifetime': { name: 'Charge Wealth Lifetime Access', amount: 27900, description: 'One-time payment for lifetime access' },
        'monthly': { name: 'Charge Wealth Monthly', amount: 4900, description: 'Monthly subscription' },
        'quarterly': { name: 'Charge Wealth 3 Months', amount: 9900, description: '3-month access' },
        'biannual': { name: 'Charge Wealth 6 Months', amount: 20000, description: '6-month access' },
      };
      
      const plan = planConfig[planType] || planConfig['lifetime'];

      const stripe = await getUncachableStripeClient();
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://chargewealth.co' 
        : `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'chargewealth.co'}`;
      
      let hasReferralDiscount = false;
      let referrer = null;
      let finalAmount = plan.amount;
      
      if (referralCode && planType === 'lifetime') {
        referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          hasReferralDiscount = true;
          finalAmount = 24900; // $30 off lifetime
        }
      }
      
      const sessionParams: any = {
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${baseUrl}/api/stripe/payment-callback?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?payment=cancelled`,
        allow_promotion_codes: !hasReferralDiscount,
        metadata: {
          planType: planType || 'lifetime',
          email: email || '',
          referralCode: referralCode || '',
          referrerId: referrer?.id || '',
        },
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: hasReferralDiscount ? `${plan.name} (Referral Discount)` : plan.name,
              description: hasReferralDiscount ? '$30 off with referral' : plan.description,
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        }],
      };

      if (email) {
        sessionParams.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ url: session.url, sessionId: session.id, hasReferralDiscount, finalPrice: finalAmount / 100 });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Payment callback - verifies payment and grants access
  app.get('/api/stripe/payment-callback', async (req: any, res) => {
    try {
      const { session_id } = req.query;
      
      if (!session_id || typeof session_id !== 'string') {
        return res.redirect('/dashboard?payment=error&reason=no_session');
      }
      
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(session_id);
      
      if (session.payment_status !== 'paid') {
        return res.redirect('/dashboard?payment=failed');
      }
      
      const customerEmail = session.customer_email || session.metadata?.email;
      const planType = session.metadata?.planType || 'lifetime';
      const referralCode = session.metadata?.referralCode;
      const referrerId = session.metadata?.referrerId;
      
      if (!customerEmail) {
        console.error('No email found in Stripe session:', session_id);
        return res.redirect('/dashboard?payment=error&reason=no_email');
      }
      
      // Find or create user by email
      let user = await storage.getUserByEmail(customerEmail);
      
      if (!user) {
        const userId = `stripe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        user = await storage.upsertUser({
          id: userId,
          email: customerEmail,
          firstName: '',
          lastName: '',
        });
      }
      
      // Calculate subscription end date based on plan type
      let subscriptionEndDate: Date | null = null;
      if (planType === 'monthly') {
        subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      } else if (planType === 'quarterly') {
        subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3);
      } else if (planType === 'biannual') {
        subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 6);
      }
      // lifetime has no end date
      
      // Update user subscription
      await storage.updateUserSubscription(user.id, {
        subscriptionStatus: 'active',
        subscriptionType: planType,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
        subscriptionStartDate: new Date(),
        subscriptionEndDate,
      });
      
      console.log(`Subscription granted: ${customerEmail} -> ${planType}`);
      
      // Handle referral
      if (referralCode && referrerId) {
        try {
          await storage.completeReferral(referralCode, user.id, 30);
        } catch (e) {
          console.log('Referral completion skipped:', e);
        }
      }
      
      // If user is already logged in, redirect directly
      if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect('/dashboard?payment=success');
      }
      
      // Auto-login the user
      const sessionUser = {
        claims: { sub: user.id },
        expires_at: Math.floor(Date.now() / 1000) + 86400 * 30
      };
      
      req.login(sessionUser, (err: any) => {
        if (err) {
          console.error('Auto-login after payment failed:', err);
          return res.redirect('/dashboard?payment=success&login=pending');
        }
        res.redirect('/dashboard?payment=success');
      });
    } catch (error) {
      console.error('Payment callback error:', error);
      res.redirect('/dashboard?payment=error');
    }
  });

  // Verify payment for authenticated users (fallback if webhook fails)
  app.post('/api/stripe/verify-payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ success: false, message: 'User email not found' });
      }
      
      const stripe = await getUncachableStripeClient();
      
      // Find recent successful checkout sessions for this email
      const sessions = await stripe.checkout.sessions.list({
        limit: 10,
        expand: ['data.line_items'],
      });
      
      const userSession = sessions.data.find(s => 
        s.payment_status === 'paid' && 
        (s.customer_email === user.email || s.metadata?.email === user.email)
      );
      
      if (!userSession) {
        return res.json({ success: false, message: 'No recent payment found' });
      }
      
      const planType = userSession.metadata?.planType || 'lifetime';
      
      // Calculate subscription end date
      let subscriptionEndDate: Date | null = null;
      if (planType === 'monthly') {
        subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      } else if (planType === 'quarterly') {
        subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 3);
      } else if (planType === 'biannual') {
        subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 6);
      }
      
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'active',
        subscriptionType: planType,
        stripeCustomerId: typeof userSession.customer === 'string' ? userSession.customer : null,
        subscriptionStartDate: new Date(),
        subscriptionEndDate,
      });
      
      console.log(`Payment verified for ${user.email}: ${planType}`);
      
      res.json({ success: true, planType });
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({ success: false, message: 'Failed to verify payment' });
    }
  });
  
  app.post('/api/stripe/complete-referral', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { referralCode } = req.body;
      
      if (!referralCode) {
        return res.status(400).json({ message: 'Referral code is required' });
      }
      
      const referral = await storage.completeReferral(referralCode, userId, 30);
      
      if (!referral) {
        return res.status(404).json({ message: 'Invalid referral code' });
      }
      
      res.json({ success: true, referral });
    } catch (error) {
      console.error('Complete referral error:', error);
      res.status(500).json({ message: 'Failed to complete referral' });
    }
  });
}
