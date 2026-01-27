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
      const { priceId, email, referralCode } = req.body;
      
      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://chargewealth.co' 
        : `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'chargewealth.co'}`;
      
      let hasReferralDiscount = false;
      let referrer = null;
      
      if (referralCode) {
        referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          hasReferralDiscount = true;
        }
      }
      
      const sessionParams: any = {
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${baseUrl}/dashboard?payment=success${referralCode ? `&ref=${referralCode}` : ''}`,
        cancel_url: `${baseUrl}/?payment=cancelled`,
        allow_promotion_codes: !hasReferralDiscount,
        metadata: {
          referralCode: referralCode || '',
          referrerId: referrer?.id || '',
        },
      };
      
      if (hasReferralDiscount) {
        sessionParams.line_items = [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Charge Wealth Lifetime Access (Referral Discount)',
              description: '$30 off with referral - normally $279',
            },
            unit_amount: 24900,
          },
          quantity: 1,
        }];
      } else {
        sessionParams.line_items = [{ price: priceId, quantity: 1 }];
      }

      if (email) {
        sessionParams.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ url: session.url, hasReferralDiscount, finalPrice: hasReferralDiscount ? 249 : 279 });
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
