import type { Express } from "express";
import { storage } from "../storage";
import { sendWelcomeSequence } from "../services/email";

let testimonialsCache: { data: any[]; timestamp: number } | null = null;
const TESTIMONIALS_CACHE_TTL = 60 * 60 * 1000;

let memberStatsCache: { data: any; timestamp: number } | null = null;
const MEMBER_STATS_CACHE_TTL = 5 * 60 * 1000;

let foundingStatsCache: { data: any; timestamp: number } | null = null;
const FOUNDING_STATS_CACHE_TTL = 60 * 1000; // 1 minute cache

export function registerPublicRoutes(app: Express) {
  app.post('/api/waitlist', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }
      
      const existing = await storage.getWaitlistEntry(email);
      if (existing) {
        return res.json({ success: true, message: "You're already on our list!" });
      }
      
      await storage.addToWaitlist(email);
      
      sendWelcomeSequence(email).catch((err) => {
        console.error('Failed to send welcome sequence:', err);
      });
      
      res.json({ success: true, message: "You're on the list! We'll be in touch soon." });
    } catch (error) {
      console.error("Waitlist error:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.get('/api/testimonials', async (_req, res) => {
    try {
      const now = Date.now();
      
      if (testimonialsCache && (now - testimonialsCache.timestamp) < TESTIMONIALS_CACHE_TTL) {
        return res.json(testimonialsCache.data);
      }
      
      const testimonials = await storage.getRandomTestimonials(6);
      testimonialsCache = { data: testimonials, timestamp: now };
      res.json(testimonials);
    } catch (error) {
      console.error('Testimonials error:', error);
      res.status(500).json({ message: 'Failed to load testimonials' });
    }
  });

  app.get('/api/stats/members', async (_req, res) => {
    try {
      const now = Date.now();
      
      if (memberStatsCache && (now - memberStatsCache.timestamp) < MEMBER_STATS_CACHE_TTL) {
        return res.json(memberStatsCache.data);
      }
      
      const stats = await storage.getMemberStats();
      memberStatsCache = { data: stats, timestamp: now };
      res.json(stats);
    } catch (error) {
      console.error('Member stats error:', error);
      res.status(500).json({ message: 'Failed to load stats' });
    }
  });

  app.get('/api/stats/founding', async (_req, res) => {
    try {
      const now = Date.now();
      
      if (foundingStatsCache && (now - foundingStatsCache.timestamp) < FOUNDING_STATS_CACHE_TTL) {
        return res.json(foundingStatsCache.data);
      }
      
      // Using display count for marketing (actual database count available via storage.getFoundingMemberCount())
      const displayClaimed = 203; // Hardcoded for marketing - update as spots are claimed
      const total = 250;
      const remaining = Math.max(0, total - displayClaimed);
      
      const data = { total, claimed: displayClaimed, remaining };
      foundingStatsCache = { data, timestamp: now };
      res.json(data);
    } catch (error) {
      console.error('Founding stats error:', error);
      res.status(500).json({ message: 'Failed to load founding stats' });
    }
  });

}
