import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";

import { registerPublicRoutes } from "./routes/public";
import { registerAuthRoutes } from "./routes/auth";
import { registerReferralRoutes } from "./routes/referrals";
import { registerStripeRoutes } from "./routes/stripe";
import { registerFinancialRoutes } from "./routes/financial";
import { registerBlogRoutes } from "./routes/blog";
import { registerChargeAIRoutes } from "./routes/chargeai";
import { registerTaxIntelRoutes } from "./routes/taxintel";
import { registerCfoRoutes } from "./routes/cfo";
// Portfolio Engine removed - replaced by Market Pulse
// import { registerAllocationRoutes } from "./routes/allocation";
import { registerPlaybookRoutes } from "./routes/playbooks";
import { registerContextRoutes } from "./routes/context";
import { registerSettingsRoutes } from "./routes/settings";
import { registerNewsletterRoutes } from "./routes/newsletter";
import { registerMarketPulseRoutes } from "./routes/marketpulse";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  registerPublicRoutes(app);
  registerAuthRoutes(app, isAuthenticated);
  registerReferralRoutes(app, isAuthenticated);
  registerStripeRoutes(app, isAuthenticated);
  registerFinancialRoutes(app, isAuthenticated);
  await registerBlogRoutes(app);
  registerChargeAIRoutes(app, isAuthenticated);
  registerTaxIntelRoutes(app, isAuthenticated, upload);
  registerCfoRoutes(app, isAuthenticated);
  // Portfolio Engine removed - replaced by Market Pulse
  registerPlaybookRoutes(app, isAuthenticated);
  registerContextRoutes(app, isAuthenticated);
  registerSettingsRoutes(app, isAuthenticated);
  registerNewsletterRoutes(app);
  registerMarketPulseRoutes(app, isAuthenticated);

  const httpServer = createServer(app);
  return httpServer;
}
