import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupReplitAuth } from "./replitAuth";
import { storage } from "./storage";
import { insertProductSchema, insertCouponSchema, updatePasswordSchema } from "@shared/schema";
import { comparePasswords, hashPassword } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up both authentication systems - referenced from blueprint integration
  setupAuth(app);
  await setupReplitAuth(app);
  
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

  app.get("/api/coupons", async (_req, res) => {
    const coupons = await storage.getCoupons();
    res.json(coupons);
  });

  app.post("/api/coupons/:id/redeem", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const coupon = await storage.getCoupon(parseInt(req.params.id));
    if (!coupon) return res.status(404).send("Coupon not found");
    if (!coupon.available) return res.status(400).send("Coupon not available");

    const user = req.user!;
    if (user.tokens < coupon.tokenCost) {
      return res.status(400).send("Insufficient tokens");
    }

    await storage.redeemCoupon(user.id, coupon.id);
    const updatedUser = await storage.getUser(user.id);
    res.json(updatedUser);
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

  const httpServer = createServer(app);
  return httpServer;
}