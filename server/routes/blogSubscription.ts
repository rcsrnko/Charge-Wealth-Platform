import type { Express, RequestHandler } from "express";
import { storage } from "../storage";
import { getUncachableStripeClient } from "../stripeClient";
import { checkBlogAccess } from "../middleware/blogAccess";

// Blog subscription pricing - uses pre-created Stripe prices for cleaner management
const BLOG_PLANS = {
  blog_monthly: {
    name: 'Take Charge Blog Pro - Monthly',
    amount: 900, // $9.00
    interval: 'month' as const,
    description: 'Monthly access to all premium blog content',
    priceId: process.env.STRIPE_BLOG_MONTHLY_PRICE_ID || null,
  },
  blog_yearly: {
    name: 'Take Charge Blog Pro - Yearly',
    amount: 8700, // $87.00
    interval: 'year' as const,
    description: 'Yearly access to all premium blog content (save $21!)',
    priceId: process.env.STRIPE_BLOG_YEARLY_PRICE_ID || null,
  },
};

export function registerBlogSubscriptionRoutes(app: Express, isAuthenticated: RequestHandler) {
  // Get blog subscription status for current user
  app.get('/api/blog/subscription-status', async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.json({
          hasAccess: false,
          isAuthenticated: false,
          accessType: 'none',
        });
      }

      const accessResult = await checkBlogAccess(userId);
      const user = await storage.getUser(userId);

      res.json({
        hasAccess: accessResult.hasAccess,
        isAuthenticated: true,
        accessType: accessResult.accessType,
        subscriptionDetails: accessResult.subscriptionDetails,
        blogSubscription: user ? {
          status: user.blogSubscriptionStatus,
          type: user.blogSubscriptionType,
          expiresAt: user.blogSubscriptionEndDate,
        } : null,
        mainSubscription: user ? {
          status: user.subscriptionStatus,
          type: user.subscriptionType,
        } : null,
      });
    } catch (error) {
      console.error('Blog subscription status error:', error);
      res.status(500).json({ message: 'Failed to get subscription status' });
    }
  });

  // Get available blog subscription plans
  app.get('/api/blog/plans', async (_req, res) => {
    res.json({
      plans: [
        {
          id: 'blog_monthly',
          name: BLOG_PLANS.blog_monthly.name,
          price: BLOG_PLANS.blog_monthly.amount / 100,
          interval: 'month',
          description: BLOG_PLANS.blog_monthly.description,
        },
        {
          id: 'blog_yearly',
          name: BLOG_PLANS.blog_yearly.name,
          price: BLOG_PLANS.blog_yearly.amount / 100,
          interval: 'year',
          description: BLOG_PLANS.blog_yearly.description,
          savings: 21, // $9*12 = $108 - $87 = $21 savings
        },
      ],
      chargeWealthPrice: 279,
      chargeWealthDescription: 'Full AI CFO platform with lifetime access',
    });
  });

  // Create checkout session for blog subscription
  app.post('/api/blog/checkout', async (req, res) => {
    try {
      const { planType, email } = req.body;
      const userId = (req as any).user?.claims?.sub;

      if (!planType || !['blog_monthly', 'blog_yearly'].includes(planType)) {
        return res.status(400).json({ message: 'Invalid plan type' });
      }

      const plan = BLOG_PLANS[planType as keyof typeof BLOG_PLANS];
      const stripe = await getUncachableStripeClient();
      
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://chargewealth.co' 
        : `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'chargewealth.co'}`;

      // For subscriptions, we need to use mode: 'subscription'
      // Use pre-created price IDs when available for cleaner Stripe dashboard management
      const lineItems = plan.priceId 
        ? [{ price: plan.priceId, quantity: 1 }]
        : [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: plan.description,
              },
              unit_amount: plan.amount,
              recurring: {
                interval: plan.interval,
              },
            },
            quantity: 1,
          }];

      const sessionParams: any = {
        payment_method_types: ['card'],
        mode: 'subscription',
        success_url: `${baseUrl}/api/blog/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/take-charge/subscribe?cancelled=true`,
        metadata: {
          planType,
          userId: userId || '',
          email: email || '',
        },
        line_items: lineItems,
      };

      // Set customer email
      if (email) {
        sessionParams.customer_email = email;
      } else if (userId) {
        const user = await storage.getUser(userId);
        if (user?.email) {
          sessionParams.customer_email = user.email;
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      
      res.json({ 
        url: session.url, 
        sessionId: session.id,
      });
    } catch (error) {
      console.error('Blog checkout error:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });

  // Handle successful blog subscription checkout
  app.get('/api/blog/checkout-success', async (req: any, res) => {
    try {
      const { session_id } = req.query;

      if (!session_id || typeof session_id !== 'string') {
        return res.redirect('/take-charge/subscribe?error=no_session');
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription'],
      });

      if (session.payment_status !== 'paid') {
        return res.redirect('/take-charge/subscribe?error=payment_failed');
      }

      const { planType, userId: metadataUserId, email: metadataEmail } = session.metadata || {};
      const customerEmail = session.customer_email || metadataEmail;
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription?.id;

      if (!customerEmail) {
        console.error('No email found in blog checkout session:', session_id);
        return res.redirect('/take-charge/subscribe?error=no_email');
      }

      // Find or create user
      let user = await storage.getUserByEmail(customerEmail);
      
      if (!user) {
        const newUserId = `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        user = await storage.upsertUser({
          id: newUserId,
          email: customerEmail,
        });
      }

      // Calculate subscription end date
      const now = new Date();
      let subscriptionEndDate: Date;
      if (planType === 'blog_yearly') {
        subscriptionEndDate = new Date(now);
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
      } else {
        subscriptionEndDate = new Date(now);
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      }

      // Update user with blog subscription
      await storage.updateBlogSubscription(user.id, {
        blogSubscriptionStatus: 'active',
        blogSubscriptionType: planType === 'blog_yearly' ? 'yearly' : 'monthly',
        blogSubscriptionStartDate: now,
        blogSubscriptionEndDate: subscriptionEndDate,
        stripeBlogSubscriptionId: subscriptionId || null,
      });

      console.log(`Blog subscription granted: ${customerEmail} -> ${planType}`);

      // Auto-login the user
      const sessionUser = {
        claims: { sub: user.id },
        expires_at: Math.floor(Date.now() / 1000) + 86400 * 30,
      };

      req.login(sessionUser, (err: any) => {
        if (err) {
          console.error('Auto-login after blog subscription failed:', err);
          return res.redirect('/take-charge?subscription=success&login=pending');
        }
        res.redirect('/take-charge?subscription=success');
      });
    } catch (error) {
      console.error('Blog checkout success handler error:', error);
      res.redirect('/take-charge/subscribe?error=processing');
    }
  });

  // Cancel blog subscription
  app.post('/api/blog/cancel-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.stripeBlogSubscriptionId) {
        return res.status(400).json({ message: 'No active blog subscription found' });
      }

      const stripe = await getUncachableStripeClient();
      
      // Cancel at period end (user keeps access until subscription expires)
      await stripe.subscriptions.update(user.stripeBlogSubscriptionId, {
        cancel_at_period_end: true,
      });

      await storage.updateBlogSubscription(userId, {
        blogSubscriptionStatus: 'cancelled',
      });

      res.json({ 
        success: true, 
        message: 'Subscription will be cancelled at the end of the billing period',
        expiresAt: user.blogSubscriptionEndDate,
      });
    } catch (error) {
      console.error('Cancel blog subscription error:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  // Manage blog subscription (redirect to Stripe portal)
  app.post('/api/blog/manage-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: 'No Stripe customer found' });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://chargewealth.co' 
        : `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'chargewealth.co'}`;

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/take-charge/subscribe`,
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error('Manage subscription error:', error);
      res.status(500).json({ message: 'Failed to create portal session' });
    }
  });
}
