import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupReplitAuth } from "./replitAuth";
import { setupGoogleAuth } from "./googleAuth";
import { storage } from "./storage";
import { insertProductSchema, insertRewardSchema, updatePasswordSchema } from "@shared/schema";
import { comparePasswords, hashPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication systems - referenced from blueprint integration
  setupAuth(app);
  await setupReplitAuth(app);
  await setupGoogleAuth(app);
  
  // Add unified user endpoint that works with both auth systems
  app.get("/api/auth/user", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // For Replit Auth users, get user from claims
      if (req.user.claims?.sub) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        return res.json(user);
      }
      
      // For local auth users, use existing user object
      return res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/products", async (req, res) => {
    const search = req.query.search as string;
    const barcode = req.query.barcode as string;

    if (barcode) {
      const product = await storage.getProductByBarcode(barcode);
      if (!product) return res.status(404).send("Product not found");
      return res.json(product);
    }

    const products = await storage.searchProducts(search || "");
    res.json(products);
  });

  app.get("/api/products/:barcode", async (req, res) => {
    const product = await storage.getProductByBarcode(req.params.barcode);
    if (!product) return res.status(404).send("Product not found");
    res.json(product);
  });

  app.get("/api/rewards", async (_req, res) => {
    const rewards = await storage.getRewards();
    res.json(rewards);
  });

  app.post("/api/rewards/:id/purchase", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const reward = await storage.getReward(parseInt(req.params.id));
    if (!reward) return res.status(404).send("Reward not found");
    if (!reward.available) return res.status(400).send("Reward not available");

    const user = req.user!;
    if (user.tokens < reward.tokenCost) {
      return res.status(400).send("Insufficient tokens");
    }

    await storage.purchaseReward(user.id, reward.id);
    const updatedUser = await storage.getUser(user.id);
    res.json(updatedUser);
  });

  app.get("/api/user/purchases", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.claims?.sub || req.user.id;
      const purchases = await storage.getUserPurchases(userId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching user purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = updatePasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const user = req.user!;
    const { currentPassword, newPassword } = result.data;

    // Check if user has a password (local auth) vs SSO auth
    if (!user.password) {
      return res.status(400).send("Password update not available for SSO users");
    }

    if (!(await comparePasswords(currentPassword, user.password!))) {
      return res.status(400).send("Current password is incorrect");
    }

    await storage.updateUserPassword(user.id, await hashPassword(newPassword));
    res.sendStatus(200);
  });

  app.get("/api/user/referral-stats", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.claims?.sub || req.user.id;
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}