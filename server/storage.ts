import createMemoryStore from "memorystore";
import session from "express-session";
import { Product, User, Coupon, InsertUser, UpsertUser } from "@shared/schema";
import { customAlphabet } from "nanoid";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users, products, coupons } from "@shared/schema";
import { eq } from "drizzle-orm";

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
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: string, newPassword: string): Promise<void>;
  
  // User operations for Replit Auth - referenced from blueprint integration
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Product operations
  searchProducts(search: string): Promise<Product[]>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  
  // Coupon operations
  getCoupons(): Promise<Coupon[]>;
  getCoupon(id: number): Promise<Coupon | undefined>;
  redeemCoupon(userId: string, couponId: number): Promise<void>;
  
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

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
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

  async getCoupons(): Promise<Coupon[]> {
    return await db.select().from(coupons);
  }

  async getCoupon(id: number): Promise<Coupon | undefined> {
    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id));
    return coupon;
  }

  async redeemCoupon(userId: string, couponId: number): Promise<void> {
    const user = await this.getUser(userId);
    const coupon = await this.getCoupon(couponId);

    if (!user || !coupon || user.tokens < coupon.tokenCost) return;

    // Update user tokens and mark coupon as unavailable
    await db
      .update(users)
      .set({ tokens: user.tokens - coupon.tokenCost, updatedAt: new Date() })
      .where(eq(users.id, userId));
      
    await db
      .update(coupons)
      .set({ available: false })
      .where(eq(coupons.id, couponId));
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<number, Product>;
  private coupons: Map<number, Coupon>;
  sessionStore: session.Store;
  currentId: { products: number; coupons: number };

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.coupons = new Map();
    this.currentId = { products: 1, coupons: 1 };
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

    // Sample coupons
    const coupons: Omit<Coupon, "id">[] = [
      {
        name: "10% Off Eco Products",
        description: "Get 10% off on any eco-friendly product",
        tokenCost: 100,
        available: true,
      },
    ];

    coupons.forEach((coupon) => {
      const id = this.currentId.coupons++;
      this.coupons.set(id, { ...coupon, id });
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

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === code
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
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

  async getCoupons(): Promise<Coupon[]> {
    return Array.from(this.coupons.values());
  }

  async getCoupon(id: number): Promise<Coupon | undefined> {
    return this.coupons.get(id);
  }

  async redeemCoupon(userId: string, couponId: number): Promise<void> {
    const user = await this.getUser(userId);
    const coupon = this.coupons.get(couponId);

    if (!user || !coupon) return;

    user.tokens -= coupon.tokenCost;
    coupon.available = false;

    this.users.set(userId, user);
    this.coupons.set(couponId, coupon);
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    user.password = newPassword;
    this.users.set(userId, user);
  }
}

// Use database storage for production, memory for development/testing
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();