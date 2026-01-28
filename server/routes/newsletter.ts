import type { Express } from "express";
import { db } from "../db";
import { newsletterSubscribers } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { sendWelcomeSequence } from "../emailService";

export function registerNewsletterRoutes(app: Express) {
  app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
      const { email, source = 'blog' } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Valid email is required' });
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      
      const existing = await db.select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, normalizedEmail))
        .limit(1);
      
      if (existing.length > 0) {
        if (!existing[0].isActive) {
          await db.update(newsletterSubscribers)
            .set({ isActive: true, unsubscribedAt: null, subscribedAt: new Date() })
            .where(eq(newsletterSubscribers.email, normalizedEmail));
          
          sendWelcomeSequence(normalizedEmail).catch(console.error);
          return res.json({ success: true, message: 'Welcome back! You have been resubscribed.' });
        }
        return res.json({ success: true, message: 'You are already subscribed!' });
      }
      
      await db.insert(newsletterSubscribers).values({
        email: normalizedEmail,
        source,
      });
      
      sendWelcomeSequence(normalizedEmail).catch(console.error);
      
      res.json({ success: true, message: 'Successfully subscribed!' });
    } catch (error) {
      console.error('Newsletter subscribe error:', error);
      res.status(500).json({ message: 'Failed to subscribe' });
    }
  });

  app.post('/api/newsletter/unsubscribe', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      const normalizedEmail = email.toLowerCase().trim();
      
      await db.update(newsletterSubscribers)
        .set({ isActive: false, unsubscribedAt: new Date() })
        .where(eq(newsletterSubscribers.email, normalizedEmail));
      
      res.json({ success: true, message: 'You have been unsubscribed.' });
    } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      res.status(500).json({ message: 'Failed to unsubscribe' });
    }
  });
}
