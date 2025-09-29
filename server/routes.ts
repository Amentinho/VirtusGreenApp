import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupReplitAuth } from "./replitAuth";
import { setupGoogleAuth } from "./googleAuth";
import { storage } from "./storage";
import { insertProductSchema, insertRewardSchema, updatePasswordSchema } from "@shared/schema";
import { comparePasswords, hashPassword } from "./auth";
import { sendEmail, generatePasswordResetEmail, generateEmailVerificationToken, generateVerificationEmail } from "./emailService";

// Helper functions to calculate environmental metrics from Open Food Facts data
function calculateEcoScore(product: any): number | string {
  // Only use real Eco-Score from OpenFoodFacts
  if (product.ecoscore_score && typeof product.ecoscore_score === 'number') {
    return product.ecoscore_score;
  }
  
  // Return NA if no real data available
  return "NA";
}

function calculateCarbonFootprint(product: any): number | string {
  // Use real carbon footprint from OpenFoodFacts if available
  if (product['carbon-footprint-from-known-ingredients_100g']) {
    return Math.round(product['carbon-footprint-from-known-ingredients_100g'] * 10) / 10;
  }
  
  // Use Agribalyse total CO2 if available
  if (product.ecoscore_data?.agribalyse?.co2_total) {
    return Math.round(product.ecoscore_data.agribalyse.co2_total * 100 * 10) / 10;
  }
  
  // Return NA if no real data available
  return "NA";
}

function calculateWaterUsage(product: any): string {
  // OpenFoodFacts doesn't provide water usage data
  return "NA";
}

function calculateRenewableEnergy(product: any): string {
  // OpenFoodFacts doesn't provide renewable energy data
  return "NA";
}

function calculateRecyclableMaterials(product: any): string {
  // OpenFoodFacts doesn't provide recyclable materials data
  return "NA";
}

function calculateRecycledContent(product: any): string {
  // OpenFoodFacts doesn't provide recycled content data
  return "NA";
}

function calculateLandUsage(product: any): string {
  // OpenFoodFacts doesn't provide land usage data
  return "NA";
}

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
      // First check our internal database
      let product = await storage.getProductByBarcode(barcode);
      
      if (!product) {
        // If not found locally, check Open Food Facts API
        try {
          const openFoodFactsResponse = await fetch(
            `https://world.openfoodfacts.net/api/v2/product/${barcode}?fields=product_name,brands,nutriscore_data,nutrition_grades,nutriments`
          );
          
          if (openFoodFactsResponse.ok) {
            const offData = await openFoodFactsResponse.json();
            
            if (offData.status === 1 && offData.product) {
              // Transform Open Food Facts data to our Product schema
              const transformedProduct = {
                id: Date.now(), // Temporary ID for display
                name: offData.product.product_name || "Unknown Product",
                brand: offData.product.brands || "Unknown Brand", 
                barcode: barcode,
                environmentalImpact: {
                  ecoScore: calculateEcoScore(offData.product),
                  co2Emissions: calculateCarbonFootprint(offData.product),
                  renewableEnergy: calculateRenewableEnergy(offData.product),
                  recyclableMaterials: calculateRecyclableMaterials(offData.product),
                  recycledContent: calculateRecycledContent(offData.product),
                  waterUsage: calculateWaterUsage(offData.product),
                  landUsage: calculateLandUsage(offData.product)
                }
              };
              
              return res.json(transformedProduct);
            }
          }
        } catch (error) {
          console.error("Error fetching from Open Food Facts:", error);
        }
      }
      
      if (!product) {
        return res.status(404).json({ 
          message: "The product is not available in our database, can you please send us a message and we will add it?", 
          errorType: "product_not_found" 
        });
      }
      
      return res.json(product);
    }

    // First search our internal database
    const localProducts = await storage.searchProducts(search || "");
    
    // If we have local results or no search term, return local results
    if (localProducts.length > 0 || !search) {
      return res.json(localProducts);
    }
    
    // If no local results and we have a search term, search Open Food Facts
    try {
      // Use v1 API for full text search since v2 doesn't support search_terms
      const offSearchResponse = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1`,
        {
          headers: {
            'User-Agent': 'VirtusGreen - Web App - Version 1.0 - https://virtusgreen.com'
          }
        }
      );
      
      if (offSearchResponse.ok) {
        const offData = await offSearchResponse.json();
        
        // The v1 API returns results differently than v2
        if (offData.products && offData.products.length > 0) {
          // Transform Open Food Facts search results to our Product schema
          const transformedProducts = offData.products.slice(0, 20).map((offProduct: any) => ({
            id: Date.now() + Math.random(), // Temporary ID for display
            name: offProduct.product_name || "Unknown Product",
            brand: offProduct.brands || "Unknown Brand",
            barcode: offProduct.code || "",
            environmentalImpact: {
              ecoScore: calculateEcoScore(offProduct),
              co2Emissions: calculateCarbonFootprint(offProduct),
              renewableEnergy: calculateRenewableEnergy(offProduct),
              recyclableMaterials: calculateRecyclableMaterials(offProduct),
              recycledContent: calculateRecycledContent(offProduct),
              waterUsage: calculateWaterUsage(offProduct),
              landUsage: calculateLandUsage(offProduct)
            }
          }));
          
          return res.json(transformedProducts);
        }
      }
    } catch (error) {
      console.error("Error searching Open Food Facts:", error);
    }
    
    // Return empty array if no results found anywhere
    res.json([]);
  });

  app.get("/api/products/:barcode", async (req, res) => {
    const barcode = req.params.barcode;
    
    // First check our internal database
    let product = await storage.getProductByBarcode(barcode);
    
    if (!product) {
      // If not found locally, check Open Food Facts API
      try {
        const openFoodFactsResponse = await fetch(
          `https://world.openfoodfacts.net/api/v2/product/${barcode}?fields=product_name,brands,nutriscore_data,nutrition_grades,nutriments,ecoscore_score,ecoscore_grade,ecoscore_data,carbon-footprint-from-known-ingredients_100g`
        );
        
        if (openFoodFactsResponse.ok) {
          const offData = await openFoodFactsResponse.json();
          
          if (offData.status === 1 && offData.product) {
            // Transform Open Food Facts data to our Product schema
            const transformedProduct = {
              id: Date.now(), // Temporary ID for display
              name: offData.product.product_name || "Unknown Product",
              brand: offData.product.brands || "Unknown Brand", 
              barcode: barcode,
              environmentalImpact: {
                ecoScore: calculateEcoScore(offData.product),
                co2Emissions: calculateCarbonFootprint(offData.product),
                renewableEnergy: calculateRenewableEnergy(offData.product),
                recyclableMaterials: calculateRecyclableMaterials(offData.product),
                recycledContent: calculateRecycledContent(offData.product),
                waterUsage: calculateWaterUsage(offData.product),
                landUsage: calculateLandUsage(offData.product)
              }
            };
            
            return res.json(transformedProduct);
          }
        }
      } catch (error) {
        console.error("Error fetching from Open Food Facts:", error);
      }
    }
    
    if (!product) {
      return res.status(404).json({ 
        message: "The product is not available in our database, can you please send us a message and we will add it?", 
        errorType: "product_not_found" 
      });
    }
    
    res.json(product);
  });

  app.get("/api/rewards", async (_req, res) => {
    const rewards = await storage.getRewards();
    res.json(rewards);
  });

  app.post("/api/rewards/:id/purchase", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
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
    } catch (error) {
      console.error("Error purchasing reward:", error);
      
      if (error instanceof Error) {
        if (error.message === "You have already redeemed this reward") {
          return res.status(400).json({ message: "You have already redeemed this reward" });
        }
        if (error.message === "Cannot purchase reward") {
          return res.status(400).json({ message: "Cannot purchase this reward at this time" });
        }
      }
      
      res.status(500).json({ message: "Failed to purchase reward" });
    }
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

  app.get("/api/user/token-earnings", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.claims?.sub || req.user.id;
      const earnings = await storage.getTokenEarnings(userId);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching token earnings:", error);
      res.status(500).json({ message: "Failed to fetch token earnings" });
    }
  });

  // Sharing endpoints
  app.post("/api/share/product", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { productId, platform } = req.body;
      const userId = req.user.claims?.sub || req.user.id;
      
      if (!productId || !platform) {
        return res.status(400).json({ error: "Product ID and platform are required" });
      }

      const validPlatforms = ["whatsapp", "telegram", "instagram"];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      const result = await storage.recordProductShare(userId, productId, platform);
      
      // Get updated user tokens
      const user = await storage.getUser(userId);
      
      res.json({
        ...result,
        tokens: user?.tokens || 0,
      });
    } catch (error) {
      console.error("Error recording product share:", error);
      res.status(500).json({ error: "Failed to record product share" });
    }
  });

  app.post("/api/share/app", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { platform } = req.body;
      const userId = req.user.claims?.sub || req.user.id;
      
      if (!platform) {
        return res.status(400).json({ error: "Platform is required" });
      }

      const validPlatforms = ["whatsapp", "telegram", "instagram"];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      const result = await storage.recordAppShare(userId, platform);
      res.json(result);
    } catch (error) {
      console.error("Error recording app share:", error);
      res.status(500).json({ error: "Failed to record app share" });
    }
  });

  // Profile completion endpoints
  app.get("/api/profile/completion-status", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.claims?.sub || req.user.id;
      const status = await storage.isProfileComplete(userId);
      res.json(status);
    } catch (error) {
      console.error("Error checking profile completion:", error);
      res.status(500).json({ error: "Failed to check profile completion" });
    }
  });

  app.post("/api/profile/claim-completion", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user.claims?.sub || req.user.id;
      const result = await storage.awardProfileCompletionBonus(userId);
      
      // Get updated user tokens
      const user = await storage.getUser(userId);
      
      res.json({
        ...result,
        tokens: user?.tokens || 0,
      });
    } catch (error) {
      console.error("Error claiming profile completion bonus:", error);
      res.status(500).json({ error: "Failed to claim profile completion bonus" });
    }
  });

  // Social media verification endpoints
  app.post("/api/social/initiate-verification", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { platform, handle } = req.body;
      const userId = req.user.claims?.sub || req.user.id;
      
      if (!platform) {
        return res.status(400).json({ error: "Platform is required" });
      }

      const validPlatforms = ["instagram", "linkedin", "twitter"];
      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }

      const result = await storage.initiateSocialFollowVerification(userId, platform, handle);
      res.json(result);
    } catch (error) {
      console.error("Error initiating social verification:", error);
      res.status(500).json({ error: "Failed to initiate social verification" });
    }
  });

  app.post("/api/social/verify", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { platform, verificationCode } = req.body;
      const userId = req.user.claims?.sub || req.user.id;
      
      if (!platform || !verificationCode) {
        return res.status(400).json({ error: "Platform and verification code are required" });
      }

      const result = await storage.verifySocialFollow(userId, platform, verificationCode);
      
      // Get updated user tokens
      const user = await storage.getUser(userId);
      
      res.json({
        ...result,
        tokens: user?.tokens || 0,
      });
    } catch (error) {
      console.error("Error verifying social follow:", error);
      res.status(500).json({ error: "Failed to verify social follow" });
    }
  });

  // EVM wallet verification endpoint
  app.post("/api/verify-evm-wallet", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { walletAddress } = req.body;
      const userId = req.user.claims?.sub || req.user.id;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
      }

      const result = await storage.verifyEvmWallet(userId, walletAddress);
      
      // Get updated user tokens
      const user = await storage.getUser(userId);
      
      res.json({
        ...result,
        tokens: user?.tokens || 0,
      });
    } catch (error) {
      console.error("Error verifying EVM wallet:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to verify EVM wallet" });
    }
  });

  // Telegram verification endpoint
  app.post("/api/verify-telegram", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { telegramUsername } = req.body;
      const userId = req.user.claims?.sub || req.user.id;
      
      if (!telegramUsername) {
        return res.status(400).json({ error: "Telegram username is required" });
      }

      const result = await storage.verifyTelegram(userId, telegramUsername);
      
      // Get updated user tokens
      const user = await storage.getUser(userId);
      
      res.json({
        ...result,
        tokens: user?.tokens || 0,
      });
    } catch (error) {
      console.error("Error verifying Telegram:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to verify Telegram" });
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

  // Contact form endpoint for requesting additional metrics analysis
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, message, productName } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required" });
      }

      const emailContent = `
        New metric analysis request from VirtusGreen user:
        
        Name: ${name}
        Email: ${email}
        Product: ${productName || 'Not specified'}
        
        Message:
        ${message}
        
        ---
        This request was sent from the VirtusGreen product details page.
      `;

      const success = await sendEmail({
        to: "hello@virtusgreen.com", // VirtusGreen team email
        from: "noreply@virtusgreen.com",
        subject: `Metric Analysis Request: ${productName || 'Product Analysis'}`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>')
      });

      if (success) {
        res.json({ success: true, message: "Your message has been sent successfully!" });
      } else {
        res.status(500).json({ error: "Failed to send message. Please try again later." });
      }
    } catch (error) {
      console.error("Error sending contact message:", error);
      res.status(500).json({ error: "Failed to send message. Please try again later." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}