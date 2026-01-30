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
        
        // Handle blog subscription events
        if (event.type === 'customer.subscription.updated') {
          await WebhookHandlers.handleSubscriptionUpdated(event.data.object);
        }
        
        if (event.type === 'customer.subscription.deleted') {
          await WebhookHandlers.handleSubscriptionDeleted(event.data.object);
        }
        
        if (event.type === 'invoice.payment_succeeded') {
          await WebhookHandlers.handleInvoicePaymentSucceeded(event.data.object);
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
      
      // Check if this is a blog subscription
      if (planType === 'blog_monthly' || planType === 'blog_yearly') {
        const now = new Date();
        let endDate = new Date(now);
        if (planType === 'blog_yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        
        await storage.updateBlogSubscription(user.id, {
          blogSubscriptionStatus: 'active',
          blogSubscriptionType: planType === 'blog_yearly' ? 'yearly' : 'monthly',
          blogSubscriptionStartDate: now,
          blogSubscriptionEndDate: endDate,
          stripeBlogSubscriptionId: session.subscription as string || null,
        });
        
        console.log(`Blog subscription granted via webhook for ${email}: ${planType}`);
      } else {
        // Main Charge Wealth subscription
        await storage.updateUserSubscription(user.id, {
          subscriptionStatus: 'active',
          subscriptionType: planType || 'lifetime',
          stripeCustomerId: session.customer as string || null,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: null,
        });
        
        console.log(`Membership granted via webhook for ${email}`);
      }
      
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

  static async handleSubscriptionUpdated(subscription: any): Promise<void> {
    try {
      const subscriptionId = subscription.id;
      const status = subscription.status; // active, past_due, canceled, etc.
      const cancelAtPeriodEnd = subscription.cancel_at_period_end;
      const currentPeriodEnd = subscription.current_period_end;
      
      // Find user by blog subscription ID
      // This requires a query by stripeBlogSubscriptionId
      const stripe = await getUncachableStripeClient();
      const customerId = subscription.customer;
      
      // Get customer email
      const customer = await stripe.customers.retrieve(customerId as string);
      if (!customer || customer.deleted) {
        console.log('Customer not found or deleted');
        return;
      }
      
      const email = (customer as any).email;
      if (!email) {
        console.log('No email found for customer');
        return;
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('User not found for email:', email);
        return;
      }
      
      // Check if this is the user's blog subscription
      if (user.stripeBlogSubscriptionId === subscriptionId) {
        let blogStatus = 'active';
        if (status === 'canceled' || status === 'unpaid') {
          blogStatus = 'cancelled';
        } else if (cancelAtPeriodEnd) {
          blogStatus = 'cancelled'; // Will cancel at end of period
        }
        
        const endDate = currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null;
        
        await storage.updateBlogSubscription(user.id, {
          blogSubscriptionStatus: blogStatus,
          blogSubscriptionEndDate: endDate,
        });
        
        console.log(`Blog subscription updated for ${email}: ${blogStatus}`);
      }
    } catch (error) {
      console.error('Error handling subscription.updated:', error);
    }
  }

  static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    try {
      const subscriptionId = subscription.id;
      const stripe = await getUncachableStripeClient();
      const customerId = subscription.customer;
      
      const customer = await stripe.customers.retrieve(customerId as string);
      if (!customer || customer.deleted) return;
      
      const email = (customer as any).email;
      if (!email) return;
      
      const user = await storage.getUserByEmail(email);
      if (!user) return;
      
      if (user.stripeBlogSubscriptionId === subscriptionId) {
        await storage.updateBlogSubscription(user.id, {
          blogSubscriptionStatus: 'cancelled',
          stripeBlogSubscriptionId: null,
        });
        
        console.log(`Blog subscription cancelled for ${email}`);
      }
    } catch (error) {
      console.error('Error handling subscription.deleted:', error);
    }
  }

  static async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    try {
      // Handle recurring payment - extend subscription end date
      const subscriptionId = invoice.subscription;
      if (!subscriptionId) return;
      
      const stripe = await getUncachableStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
      
      const customerId = subscription.customer;
      const customer = await stripe.customers.retrieve(customerId as string);
      if (!customer || customer.deleted) return;
      
      const email = (customer as any).email;
      if (!email) return;
      
      const user = await storage.getUserByEmail(email);
      if (!user) return;
      
      if (user.stripeBlogSubscriptionId === subscriptionId) {
        const currentPeriodEnd = subscription.current_period_end;
        const endDate = currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null;
        
        await storage.updateBlogSubscription(user.id, {
          blogSubscriptionStatus: 'active',
          blogSubscriptionEndDate: endDate,
        });
        
        console.log(`Blog subscription renewed for ${email}, new end date: ${endDate}`);
      }
    } catch (error) {
      console.error('Error handling invoice.payment_succeeded:', error);
    }
  }
}
