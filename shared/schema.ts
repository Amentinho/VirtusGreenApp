import { pgTable, text, serial, integer, boolean, json, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from 'drizzle-orm';

// Session storage table for Replit Auth - referenced from blueprint integration
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  // Support both local auth (serial id) and Replit Auth (varchar id)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Local auth fields (optional for SSO users)
  username: text("username").unique(),
  password: text("password"),
  
  // Common fields for both auth systems
  email: text("email").unique(),
  tokens: integer("tokens").notNull().default(0),
  referralCode: text("referral_code").unique(),
  usedReferralCode: text("used_referral_code"),
  
  // Replit Auth fields - referenced from blueprint integration
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  
  // Timestamps for both systems
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  barcode: text("barcode").notNull().unique(),
  brand: text("brand").notNull(),
  environmentalImpact: json("environmental_impact")
    .$type<{
      ecoScore: number;
      co2Emissions: number;
      renewableEnergy: number;
      recyclableMaterials: number;
      recycledContent: number;
      waterUsage: number;
      landUsage: number;
    }>()
    .notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  tokenCost: integer("token_cost").notNull(),
  available: boolean("available").notNull().default(true),
});

// Base schema for user credentials
const userCredentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Login schema (just username and password)
export const loginSchema = userCredentialsSchema;

// Registration schema (full user details with confirmation)
export const insertUserSchema = userCredentialsSchema
  .extend({
    email: z.string().email("Invalid email address"),
    confirmPassword: z.string(),
    usedReferralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
});

export const insertProductSchema = createInsertSchema(products).omit({ 
  id: true 
});

export const insertCouponSchema = createInsertSchema(coupons).omit({ 
  id: true 
});

// Replit Auth upsert schema - referenced from blueprint integration  
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  tokens: true,
  referralCode: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>; // For Replit Auth
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;