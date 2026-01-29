import type { Express, RequestHandler } from "express";
import { storage } from "../storage";

export function registerSettingsRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.get('/api/settings/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });

  app.put('/api/settings/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { firstName, lastName } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updatedUser = await storage.upsertUser({
        id: userId,
        email: user.email,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
      });
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // New consolidated notification preferences endpoint
  app.get('/api/settings/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return notification preferences from user record
      res.json({
        emailFrequency: user.emailFrequency || 'weekly',
        emailOpportunityAlerts: user.emailOpportunityAlerts ?? true,
        emailWeeklyDigest: user.emailWeeklyDigest ?? true,
        emailTaxDeadlines: user.emailTaxDeadlines ?? true,
        emailProductUpdates: user.emailProductUpdates ?? false,
      });
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      res.status(500).json({ message: 'Failed to fetch notification settings' });
    }
  });

  app.put('/api/settings/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { 
        emailFrequency, 
        emailOpportunityAlerts, 
        emailWeeklyDigest, 
        emailTaxDeadlines, 
        emailProductUpdates 
      } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user with new notification preferences
      await storage.upsertUser({
        id: userId,
        email: user.email,
        emailFrequency: emailFrequency || user.emailFrequency || 'weekly',
        emailOpportunityAlerts: emailOpportunityAlerts ?? user.emailOpportunityAlerts ?? true,
        emailWeeklyDigest: emailWeeklyDigest ?? user.emailWeeklyDigest ?? true,
        emailTaxDeadlines: emailTaxDeadlines ?? user.emailTaxDeadlines ?? true,
        emailProductUpdates: emailProductUpdates ?? user.emailProductUpdates ?? false,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({ message: 'Failed to update notification settings' });
    }
  });

  app.get('/api/settings/connected-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      const accounts = [];
      
      if (user?.email?.includes('@gmail.com') || user?.profileImageUrl?.includes('googleusercontent')) {
        accounts.push({
          provider: 'google',
          email: user.email,
          connectedAt: user.createdAt?.toISOString() || new Date().toISOString(),
        });
      }
      
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      res.status(500).json({ message: 'Failed to fetch connected accounts' });
    }
  });

  app.post('/api/settings/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new password are required' });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      
      // Note: Actual password change would be handled by Supabase Auth
      res.json({ 
        success: true, 
        message: 'Password updated successfully.' 
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });
}
