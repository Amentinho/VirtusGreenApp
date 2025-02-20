import { IStorage } from "./storage";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Product, User, Coupon, InsertUser } from "@shared/schema";
import { customAlphabet } from "nanoid";

const MemoryStore = createMemoryStore(session);

const generateReferralCode = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8
);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private coupons: Map<number, Coupon>;
  sessionStore: session.Store;
  currentId: { users: number; products: number; coupons: number };

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.coupons = new Map();
    this.currentId = { users: 1, products: 1, coupons: 1 };
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
      // Add more sample products as needed
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
      // Add more sample coupons as needed
    ];

    coupons.forEach((coupon) => {
      const id = this.currentId.coupons++;
      this.coupons.set(id, { ...coupon, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = {
      ...insertUser,
      id,
      tokens: 0,
      referralCode: generateReferralCode(),
    };
    this.users.set(id, user);
    return user;
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

  async redeemCoupon(userId: number, couponId: number): Promise<void> {
    const user = this.users.get(userId);
    const coupon = this.coupons.get(couponId);
    
    if (!user || !coupon) return;
    
    user.tokens -= coupon.tokenCost;
    coupon.available = false;
    
    this.users.set(userId, user);
    this.coupons.set(couponId, coupon);
  }
}

export const storage = new MemStorage();
