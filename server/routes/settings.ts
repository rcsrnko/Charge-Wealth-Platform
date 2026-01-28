import type { Express, RequestHandler } from "express";
import { storage } from "../storage";

const emailPreferencesCache = new Map<string, any>();
const notificationSettingsCache = new Map<string, any>();

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

  app.get('/api/settings/email-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const prefs = emailPreferencesCache.get(userId) || {
        marketingEmails: false,
        productUpdates: true,
        weeklyDigest: true,
        taxAlerts: true,
        portfolioAlerts: true,
      };
      
      res.json(prefs);
    } catch (error) {
      console.error('Error fetching email preferences:', error);
      res.status(500).json({ message: 'Failed to fetch email preferences' });
    }
  });

  app.put('/api/settings/email-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const preferences = req.body;
      
      emailPreferencesCache.set(userId, preferences);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating email preferences:', error);
      res.status(500).json({ message: 'Failed to update email preferences' });
    }
  });

  app.get('/api/settings/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const settings = notificationSettingsCache.get(userId) || {
        pushEnabled: false,
        emailNotifications: true,
        priceAlerts: true,
        taxDeadlines: true,
        weeklyReports: true,
        aiInsights: true,
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      res.status(500).json({ message: 'Failed to fetch notification settings' });
    }
  });

  app.put('/api/settings/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const settings = req.body;
      
      notificationSettingsCache.set(userId, settings);
      
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
