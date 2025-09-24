import createMemoryStore from "memorystore";
import session from "express-session";
import { Product, User, Reward, UserPurchase, InsertUser, CreateUser, UpsertUser, InsertUserPurchase } from "@shared/schema";
import { customAlphabet } from "nanoid";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users, products, rewards, userPurchases } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const REFERRAL_BONUS = 50; // Tokens awarded for successful referral

const generateReferralCode = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8
);

// Storage interface supporting both local auth and Replit Auth - referenced from blueprint integration
export interface IStorage {
  // User operations for local auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: CreateUser): Promise<User>;
  updateUserPassword(userId: string, newPassword: string): Promise<void>;
  
  // Password recovery operations
  setPasswordResetToken(email: string, token: string, expiry: Date): Promise<boolean>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  clearPasswordResetToken(userId: string): Promise<void>;
  
  // User operations for Replit Auth - referenced from blueprint integration
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Referral operations
  getReferralStats(userId: string): Promise<{ referralCount: number; tokensEarned: number }>;
  
  // Product operations
  searchProducts(search: string): Promise<Product[]>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  
  // Reward operations
  getRewards(): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  purchaseReward(userId: string, rewardId: number): Promise<void>;
  getUserPurchases(userId: string): Promise<Array<UserPurchase & { reward: Reward }>>;
  
  // Session store
  sessionStore: session.Store;
}

// Database storage implementation supporting both local auth and Replit Auth - referenced from blueprint integration
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    this.sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    // Check if it's an email (contains @)
    if (usernameOrEmail.includes('@')) {
      return this.getUserByEmail(usernameOrEmail);
    }
    return this.getUserByUsername(usernameOrEmail);
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async createUser(insertUser: CreateUser): Promise<User> {
    let tokens = 0;

    // Handle referral code if provided
    if (insertUser.usedReferralCode) {
      const referrer = await this.getUserByReferralCode(insertUser.usedReferralCode);
      if (referrer) {
        // Award tokens to both the referrer and the new user
        tokens = REFERRAL_BONUS;
        await db
          .update(users)
          .set({ tokens: referrer.tokens + REFERRAL_BONUS, updatedAt: new Date() })
          .where(eq(users.id, referrer.id));
      }
    }

    const referralCode = generateReferralCode();
    const [user] = await db
      .insert(users)
      .values({
        username: insertUser.username,
        email: insertUser.email,
        password: insertUser.password,
        tokens,
        referralCode,
        usedReferralCode: insertUser.usedReferralCode || null,
      })
      .returning();
    
    return user;
  }

  // Replit Auth upsert - referenced from blueprint integration
  async upsertUser(userData: UpsertUser): Promise<User> {
    const referralCode = generateReferralCode();
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        referralCode,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    try {
      const result = await db
        .update(users)
        .set({ 
          resetToken: token, 
          resetTokenExpiry: expiry,
          updatedAt: new Date()
        })
        .where(eq(users.email, email));
      return true;
    } catch (error) {
      console.error('Error setting password reset token:', error);
      return false;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`${users.resetToken} = ${token} AND ${users.resetTokenExpiry} > ${new Date()}`);
    return user;
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        resetToken: null, 
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async searchProducts(search: string): Promise<Product[]> {
    // For now, return all products. In a real implementation, you'd use full-text search
    const allProducts = await db.select().from(products);
    if (!search) return allProducts;

    const searchLower = search.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower) ||
        p.barcode.includes(search)
    );
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.barcode, barcode));
    return product;
  }

  async getRewards(): Promise<Reward[]> {
    return await db.select().from(rewards);
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }

  async purchaseReward(userId: string, rewardId: number): Promise<void> {
    const user = await this.getUser(userId);
    const reward = await this.getReward(rewardId);

    if (!user || !reward || user.tokens < reward.tokenCost || reward.remainingQuantity <= 0) {
      throw new Error("Cannot purchase reward");
    }

    // Check if user has already purchased this reward (one per user limit)
    const existingPurchase = await db
      .select()
      .from(userPurchases)
      .where(and(eq(userPurchases.userId, userId), eq(userPurchases.rewardId, rewardId)))
      .limit(1);

    if (existingPurchase.length > 0) {
      throw new Error("You have already redeemed this reward");
    }

    // Update user tokens, decrease reward quantity, and create purchase record
    await db
      .update(users)
      .set({ tokens: user.tokens - reward.tokenCost, updatedAt: new Date() })
      .where(eq(users.id, userId));
      
    await db
      .update(rewards)
      .set({ remainingQuantity: reward.remainingQuantity - 1 })
      .where(eq(rewards.id, rewardId));
      
    await db
      .insert(userPurchases)
      .values({ userId, rewardId });
  }

  async getUserPurchases(userId: string): Promise<Array<UserPurchase & { reward: Reward }>> {
    const purchases = await db
      .select({
        id: userPurchases.id,
        userId: userPurchases.userId,
        rewardId: userPurchases.rewardId,
        purchasedAt: userPurchases.purchasedAt,
        reward: rewards
      })
      .from(userPurchases)
      .innerJoin(rewards, eq(userPurchases.rewardId, rewards.id))
      .where(eq(userPurchases.userId, userId));

    return purchases;
  }

  async getReferralStats(userId: string): Promise<{ referralCount: number; tokensEarned: number }> {
    const user = await this.getUser(userId);
    if (!user?.referralCode) {
      return { referralCount: 0, tokensEarned: 0 };
    }

    // Count users who used this user's referral code
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.usedReferralCode, user.referralCode));

    const referralCount = result[0]?.count || 0;
    const tokensEarned = referralCount * REFERRAL_BONUS;

    return { referralCount, tokensEarned };
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<number, Product>;
  private rewards: Map<number, Reward>;
  private userPurchases: Map<number, UserPurchase>;
  sessionStore: session.Store;
  currentId: { products: number; rewards: number; userPurchases: number };

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.rewards = new Map();
    this.userPurchases = new Map();
    this.currentId = { products: 1, rewards: 1, userPurchases: 1 };
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });

    // Seed some sample data
    this.seedData();
  }

  private seedData() {
    // Sample products
    const products: Omit<Product, "id">[] = [
      {
        name: "Eco-Friendly Water Bottle",
        brand: "GreenLife",
        barcode: "123456789",
        environmentalImpact: {
          ecoScore: 85,
          co2Emissions: 80,
          renewableEnergy: 90,
          recyclableMaterials: 100,
          recycledContent: 75,
          waterUsage: 85,
          landUsage: 95,
        },
      },
      {
        name: "Solar Cream",
        brand: "SunCare",
        barcode: "8411135482951",
        environmentalImpact: {
          ecoScore: 1,
          co2Emissions: 10,
          renewableEnergy: 5,
          recyclableMaterials: 15,
          recycledContent: 0,
          waterUsage: 20,
          landUsage: 15,
        },
      },
    ];

    products.forEach((product) => {
      const id = this.currentId.products++;
      this.products.set(id, { ...product, id });
    });

    // Sample rewards
    const rewards: Omit<Reward, "id">[] = [
      {
        name: "20% discount on DUMMY1",
        description: "Get 20% off on DUMMY1 product",
        tokenCost: 10,
        available: true,
        totalAvailable: 100,
        remainingQuantity: 100,
      },
      {
        name: "50% discount on DUMMY2", 
        description: "Get 50% off on DUMMY2 product",
        tokenCost: 100,
        available: true,
        totalAvailable: 100,
        remainingQuantity: 100,
      },
      {
        name: "one Dummy3",
        description: "Get one free Dummy3 product",
        tokenCost: 150,
        available: true,
        totalAvailable: 100,
        remainingQuantity: 100,
      },
    ];

    rewards.forEach((reward) => {
      const id = this.currentId.rewards++;
      this.rewards.set(id, { ...reward, id });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    // Check if it's an email (contains @)
    if (usernameOrEmail.includes('@')) {
      return this.getUserByEmail(usernameOrEmail);
    }
    return this.getUserByUsername(usernameOrEmail);
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === code
    );
  }

  async createUser(insertUser: CreateUser): Promise<User> {
    const id = crypto.randomUUID();
    let tokens = 0;

    // Handle referral code if provided
    if (insertUser.usedReferralCode) {
      const referrer = await this.getUserByReferralCode(insertUser.usedReferralCode);
      if (referrer) {
        // Award tokens to both the referrer and the new user
        tokens = REFERRAL_BONUS;
        referrer.tokens += REFERRAL_BONUS;
        this.users.set(referrer.id, referrer);
      }
    }

    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      tokens,
      referralCode: generateReferralCode(),
      usedReferralCode: insertUser.usedReferralCode || null,
      resetToken: null,
      resetTokenExpiry: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);
    return user;
  }

  // Replit Auth upsert for MemStorage 
  async upsertUser(userData: UpsertUser): Promise<User> {
    const userId = userData.id || crypto.randomUUID();
    const existingUser = Array.from(this.users.values()).find(user => user.id === userId);
    
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        id: userId,
        updatedAt: new Date(),
      };
      this.users.set(userId, updatedUser);
      return updatedUser;
    } else {
      const user: User = {
        id: userId,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        username: null,
        password: null,
        tokens: 0,
        referralCode: generateReferralCode(),
        usedReferralCode: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userId, user);
      return user;
    }
  }

  async searchProducts(search: string): Promise<Product[]> {
    const products = Array.from(this.products.values());
    if (!search) return products;

    const searchLower = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.brand.toLowerCase().includes(searchLower) ||
        p.barcode.includes(search)
    );
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.barcode === barcode
    );
  }

  async getReferralStats(userId: string): Promise<{ referralCount: number; tokensEarned: number }> {
    const user = await this.getUser(userId);
    if (!user?.referralCode) {
      return { referralCount: 0, tokensEarned: 0 };
    }

    // Count users who used this user's referral code
    const referralCount = Array.from(this.users.values()).filter(
      u => u.usedReferralCode === user.referralCode
    ).length;

    const tokensEarned = referralCount * REFERRAL_BONUS;

    return { referralCount, tokensEarned };
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    user.password = newPassword;
    this.users.set(userId, user);
  }

  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) return false;
    
    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    user.updatedAt = new Date();
    this.users.set(user.id, user);
    return true;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      u => u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > new Date()
    );
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.updatedAt = new Date();
    this.users.set(userId, user);
  }

  async getRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values());
  }

  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }

  async purchaseReward(userId: string, rewardId: number): Promise<void> {
    const user = await this.getUser(userId);
    const reward = this.rewards.get(rewardId);

    if (!user || !reward || user.tokens < reward.tokenCost || reward.remainingQuantity <= 0) {
      throw new Error("Cannot purchase reward");
    }

    // Check if user has already purchased this reward (one per user limit)
    const existingPurchase = Array.from(this.userPurchases.values()).find(
      p => p.userId === userId && p.rewardId === rewardId
    );

    if (existingPurchase) {
      throw new Error("You have already redeemed this reward");
    }

    // Update user tokens, decrease reward quantity, and create purchase record
    user.tokens -= reward.tokenCost;
    reward.remainingQuantity -= 1;
    
    const purchaseId = this.currentId.userPurchases++;
    const purchase: UserPurchase = {
      id: purchaseId,
      userId,
      rewardId,
      purchasedAt: new Date(),
    };

    this.users.set(userId, user);
    this.rewards.set(rewardId, reward);
    this.userPurchases.set(purchaseId, purchase);
  }

  async getUserPurchases(userId: string): Promise<Array<UserPurchase & { reward: Reward }>> {
    const purchases = Array.from(this.userPurchases.values()).filter(p => p.userId === userId);
    return purchases.map(purchase => ({
      ...purchase,
      reward: this.rewards.get(purchase.rewardId)!
    }));
  }
}

// Use database storage for production, memory for development/testing
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();