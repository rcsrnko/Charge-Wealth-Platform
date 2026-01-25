import type { Express, RequestHandler } from "express";
import { storage } from "../storage";

export function registerPlaybookRoutes(app: Express, isAuthenticated: RequestHandler) {
  app.get('/api/playbooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playbooks = await storage.getPlaybooks(userId);
      res.json({ playbooks });
    } catch (error) {
      console.error("Error fetching playbooks:", error);
      res.status(500).json({ message: "Failed to fetch playbooks" });
    }
  });

  app.get('/api/playbooks/templates', isAuthenticated, async (_req: any, res) => {
    try {
      const templates = await storage.getPlaybookTemplates();
      res.json({ templates });
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/playbooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, category, steps, estimatedImpact, targetDate } = req.body;

      if (!title || !steps || steps.length === 0) {
        return res.status(400).json({ message: "Title and at least one step are required" });
      }

      const playbook = await storage.createPlaybook({
        userId,
        title,
        description,
        category: category || 'custom',
        steps,
        status: 'active',
        progress: 0,
        estimatedImpact,
        targetDate,
      });

      res.json({ playbook });
    } catch (error) {
      console.error("Error creating playbook:", error);
      res.status(500).json({ message: "Failed to create playbook" });
    }
  });

  app.get('/api/playbooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playbookId = parseInt(req.params.id);

      const playbook = await storage.getPlaybook(playbookId, userId);
      if (!playbook) {
        return res.status(404).json({ message: "Playbook not found" });
      }

      res.json({ playbook });
    } catch (error) {
      console.error("Error fetching playbook:", error);
      res.status(500).json({ message: "Failed to fetch playbook" });
    }
  });

  app.patch('/api/playbooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playbookId = parseInt(req.params.id);
      const updates = req.body;

      const playbook = await storage.updatePlaybook(playbookId, userId, updates);
      if (!playbook) {
        return res.status(404).json({ message: "Playbook not found" });
      }

      res.json({ playbook });
    } catch (error) {
      console.error("Error updating playbook:", error);
      res.status(500).json({ message: "Failed to update playbook" });
    }
  });

  app.delete('/api/playbooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playbookId = parseInt(req.params.id);

      const deleted = await storage.deletePlaybook(playbookId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Playbook not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting playbook:", error);
      res.status(500).json({ message: "Failed to delete playbook" });
    }
  });
}
