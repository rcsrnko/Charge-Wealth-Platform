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
        success_url: `${baseUrl}/dashboard?payment=success&plan=${planType}${referralCode ? `&ref=${referralCode}` : ''}`,
        cancel_url: `${baseUrl}/?payment=cancelled`,
        allow_promotion_codes: !hasReferralDiscount,
        metadata: {
          planType: planType || 'lifetime',
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
      res.json({ url: session.url, hasReferralDiscount, finalPrice: finalAmount / 100 });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
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
