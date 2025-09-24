import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupReplitAuth } from "./replitAuth";
import { setupGoogleAuth } from "./googleAuth";
import { storage } from "./storage";
import { insertProductSchema, insertRewardSchema, updatePasswordSchema } from "@shared/schema";
import { comparePasswords, hashPassword } from "./auth";
import { sendEmail, generatePasswordResetEmail, generateEmailVerificationToken, generateVerificationEmail } from "./emailService";

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

  // Email verification endpoint
  app.get("/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc2626;">❌ Invalid Verification Link</h1>
              <p>The verification token is missing or invalid.</p>
              <a href="/" style="color: #16a34a;">Go to Homepage</a>
            </body>
          </html>
        `);
      }

      const user = await storage.getUserByEmailVerificationToken(token);
      
      if (!user) {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc2626;">❌ Invalid or Expired Link</h1>
              <p>This verification link is either invalid or has expired.</p>
              <p>Please register again or contact support.</p>
              <a href="/auth" style="color: #16a34a;">Go to Registration</a>
            </body>
          </html>
        `);
      }

      // Mark email as verified
      await storage.markEmailAsVerified(user.id);
      
      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #16a34a;">✅ Email Verified Successfully!</h1>
            <p>Your email has been verified. You can now log in to your VirtusGreen account.</p>
            <a href="/auth" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">
              Login Now
            </a>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">❌ Verification Error</h1>
            <p>An error occurred while verifying your email. Please try again later.</p>
            <a href="/" style="color: #16a34a;">Go to Homepage</a>
          </body>
        </html>
      `);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}