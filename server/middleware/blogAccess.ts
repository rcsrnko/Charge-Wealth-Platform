import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

/**
 * Check if user has premium blog access.
 * User has access if:
 * - Has active Charge Wealth subscription (lifetime/monthly/etc), OR
 * - Has active blog subscription (monthly/yearly)
 */
export async function checkBlogAccess(userId: string): Promise<{
  hasAccess: boolean;
  accessType: 'main_subscription' | 'blog_subscription' | 'none';
  subscriptionDetails?: {
    type: string;
    expiresAt?: Date | null;
  };
}> {
  if (!userId) {
    return { hasAccess: false, accessType: 'none' };
  }

  const user = await storage.getUser(userId);
  
  if (!user) {
    return { hasAccess: false, accessType: 'none' };
  }

  // Check for main Charge Wealth subscription first
  if (user.subscriptionStatus === 'active') {
    // For lifetime, no expiration check needed
    if (user.subscriptionType === 'lifetime') {
      return {
        hasAccess: true,
        accessType: 'main_subscription',
        subscriptionDetails: {
          type: 'lifetime',
          expiresAt: null,
        },
      };
    }
    
    // For non-lifetime, check expiration
    if (user.subscriptionEndDate) {
      const hasExpired = new Date(user.subscriptionEndDate) < new Date();
      if (!hasExpired) {
        return {
          hasAccess: true,
          accessType: 'main_subscription',
          subscriptionDetails: {
            type: user.subscriptionType || 'subscription',
            expiresAt: user.subscriptionEndDate,
          },
        };
      }
    } else {
      // No end date means it's active indefinitely
      return {
        hasAccess: true,
        accessType: 'main_subscription',
        subscriptionDetails: {
          type: user.subscriptionType || 'subscription',
          expiresAt: null,
        },
      };
    }
  }

  // Check for blog-only subscription
  if (user.blogSubscriptionStatus === 'active') {
    // Check if blog subscription has expired
    if (user.blogSubscriptionEndDate) {
      const hasExpired = new Date(user.blogSubscriptionEndDate) < new Date();
      if (!hasExpired) {
        return {
          hasAccess: true,
          accessType: 'blog_subscription',
          subscriptionDetails: {
            type: user.blogSubscriptionType || 'blog',
            expiresAt: user.blogSubscriptionEndDate,
          },
        };
      }
    } else {
      return {
        hasAccess: true,
        accessType: 'blog_subscription',
        subscriptionDetails: {
          type: user.blogSubscriptionType || 'blog',
          expiresAt: null,
        },
      };
    }
  }

  return { hasAccess: false, accessType: 'none' };
}

/**
 * Express middleware to require blog premium access
 */
export function requireBlogAccess(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.claims?.sub;
  
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  checkBlogAccess(userId).then((result) => {
    if (result.hasAccess) {
      req.blogAccess = result;
      next();
    } else {
      res.status(403).json({ 
        message: 'Premium subscription required',
        requiresSubscription: true,
      });
    }
  }).catch((err) => {
    console.error('Blog access check error:', err);
    res.status(500).json({ message: 'Failed to check subscription status' });
  });
}

/**
 * Express middleware to optionally check blog access (doesn't block, just adds info)
 */
export function optionalBlogAccess(req: any, res: Response, next: NextFunction) {
  const userId = req.user?.claims?.sub;
  
  if (!userId) {
    req.blogAccess = { hasAccess: false, accessType: 'none' };
    return next();
  }

  checkBlogAccess(userId).then((result) => {
    req.blogAccess = result;
    next();
  }).catch((err) => {
    console.error('Blog access check error:', err);
    req.blogAccess = { hasAccess: false, accessType: 'none' };
    next();
  });
}
