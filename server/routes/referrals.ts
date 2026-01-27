import type { Express, RequestHandler } from "express";
import { storage } from "../storage";

export function registerReferralRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.get('/api/referrals/code', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getReferralStats(userId);
      const baseUrl = 'https://chargewealth.co';
      
      res.json({
        referralCode: stats.referralCode,
        referralLink: `${baseUrl}/?ref=${stats.referralCode}`,
        referralCount: stats.referralCount,
        referralEarnings: stats.referralEarnings,
      });
    } catch (error) {
      console.error('Get referral code error:', error);
      res.status(500).json({ message: 'Failed to get referral code' });
    }
  });
  
  app.get('/api/referrals/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getReferralStats(userId);
      const history = await storage.getReferralHistory(userId);
      const baseUrl = 'https://chargewealth.co';
      
      res.json({
        ...stats,
        referralLink: `${baseUrl}/?ref=${stats.referralCode}`,
        recentReferrals: history.slice(0, 10),
      });
    } catch (error) {
      console.error('Get referral stats error:', error);
      res.status(500).json({ message: 'Failed to get referral stats' });
    }
  });
  
  app.post('/api/referrals/track', async (req, res) => {
    try {
      const { referralCode, email } = req.body;
      
      if (!referralCode) {
        return res.status(400).json({ message: 'Referral code is required' });
      }
      
      const referral = await storage.trackReferralClick(referralCode, email);
      
      if (!referral) {
        return res.status(404).json({ message: 'Invalid referral code' });
      }
      
      res.json({ success: true, referralId: referral.id });
    } catch (error) {
      console.error('Track referral error:', error);
      res.status(500).json({ message: 'Failed to track referral' });
    }
  });
  
  app.get('/api/referrals/validate/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const referrer = await storage.getUserByReferralCode(code);
      
      if (!referrer) {
        return res.json({ valid: false });
      }
      
      res.json({
        valid: true,
        referrerName: referrer.firstName || 'A friend',
        discount: 30,
        finalPrice: 249,
      });
    } catch (error) {
      console.error('Validate referral error:', error);
      res.status(500).json({ message: 'Failed to validate referral code' });
    }
  });
  
  app.get('/api/referrals/leaderboard', async (_req, res) => {
    try {
      const topReferrers = await storage.getTopReferrers(10);
      
      const leaderboard = topReferrers.map((r, index) => ({
        rank: index + 1,
        name: r.firstName ? `${r.firstName.charAt(0)}***` : 'Anonymous',
        referralCount: r.referralCount,
        earnings: r.referralEarnings,
      }));
      
      res.json({ leaderboard });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ message: 'Failed to get leaderboard' });
    }
  });
}
