import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
    
    try {
      const stripe = await getUncachableStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (webhookSecret) {
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        
        if (event.type === 'checkout.session.completed') {
          await WebhookHandlers.handleCheckoutCompleted(event.data.object);
        }
      }
    } catch (err) {
      console.log('Custom webhook processing skipped:', err instanceof Error ? err.message : 'Unknown error');
    }
  }
  
  static async handleCheckoutCompleted(session: any): Promise<void> {
    try {
      const { firstName, lastName, email, planType, referralCode, referrerId } = session.metadata || {};
      
      if (!email) {
        console.log('Checkout completed but no email in metadata');
        return;
      }
      
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        const userId = `email-${email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        user = await storage.upsertUser({
          id: userId,
          email,
          firstName: firstName || '',
          lastName: lastName || '',
        });
      }
      
      await storage.updateUserSubscription(user.id, {
        subscriptionStatus: 'active',
        subscriptionType: planType || 'lifetime',
        stripeCustomerId: session.customer as string || null,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: null,
      });
      
      console.log(`Membership granted via webhook for ${email}`);
      
      if (referralCode && referrerId) {
        try {
          await storage.completeReferral(referralCode, user.id, 30);
        } catch (e) {
          console.log('Referral completion via webhook skipped:', e);
        }
      }
    } catch (error) {
      console.error('Error handling checkout.session.completed:', error);
    }
  }
}
