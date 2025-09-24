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
function calculateEcoScore(product: any): number {
  // Use nutrition grade as base score, convert letter grades to numbers
  const nutritionGrade = product.nutrition_grades?.toLowerCase();
  let baseScore = 50; // Default score
  
  switch (nutritionGrade) {
    case 'a': baseScore = 85; break;
    case 'b': baseScore = 70; break;
    case 'c': baseScore = 55; break;
    case 'd': baseScore = 40; break;
    case 'e': baseScore = 25; break;
  }
  
  // Adjust based on processing level and additives (if available)
  if (product.nutriments?.energy_kcal_100g > 500) baseScore -= 5;
  if (product.nutriments?.sugars_100g > 20) baseScore -= 10;
  if (product.nutriments?.salt_100g > 1.5) baseScore -= 5;
  
  return Math.max(1, Math.min(100, baseScore));
}

function calculateCarbonFootprint(product: any): number {
  // Estimate based on nutrition data and product type
  const energy = product.nutriments?.energy_kcal_100g || 200;
  const protein = product.nutriments?.proteins_100g || 0;
  
  // Simple estimation: higher energy and protein generally means higher footprint
  let footprint = (energy / 100) + (protein * 0.5);
  return Math.round(Math.max(0.1, Math.min(10, footprint)) * 10) / 10;
}

function calculateWaterUsage(product: any): number {
  // Estimate water usage based on product characteristics
  const protein = product.nutriments?.proteins_100g || 0;
  const energy = product.nutriments?.energy_kcal_100g || 200;
  
  // Simple estimation: protein-rich foods typically use more water
  let waterUsage = (protein * 5) + (energy / 50);
  return Math.round(Math.max(1, Math.min(1000, waterUsage)));
}

function calculatePackaging(product: any): number {
  // Simple estimation based on product name/category
  const productName = (product.product_name || "").toLowerCase();
  
  if (productName.includes("fresh") || productName.includes("organic")) return 7;
  if (productName.includes("bottle") || productName.includes("can")) return 4;
  if (productName.includes("package") || productName.includes("box")) return 3;
  
  return 5; // Default packaging score
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
                  carbonFootprint: calculateCarbonFootprint(offData.product),
                  waterUsage: calculateWaterUsage(offData.product),
                  packaging: calculatePackaging(offData.product)
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
              carbonFootprint: calculateCarbonFootprint(offProduct),
              waterUsage: calculateWaterUsage(offProduct),
              packaging: calculatePackaging(offProduct)
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