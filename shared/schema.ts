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
  
  // Password recovery fields
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  
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

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  tokenCost: integer("token_cost").notNull(),
  available: boolean("available").notNull().default(true),
  totalAvailable: integer("total_available").notNull().default(100),
  remainingQuantity: integer("remaining_quantity").notNull().default(100),
});

export const userPurchases = pgTable("user_purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  rewardId: integer("reward_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

// Base schema for user credentials
const userCredentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Login schema - allow both username and email
export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

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

export const insertRewardSchema = createInsertSchema(rewards).omit({ 
  id: true 
});

export const insertUserPurchaseSchema = createInsertSchema(userPurchases).omit({
  id: true,
  purchasedAt: true
});

// Replit Auth upsert schema - referenced from blueprint integration  
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  tokens: true,
  referralCode: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = Omit<InsertUser, 'confirmPassword'>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Password recovery schemas
export const passwordRecoveryRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
export type UpsertUser = z.infer<typeof upsertUserSchema>; // For Replit Auth
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type UserPurchase = typeof userPurchases.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type InsertUserPurchase = z.infer<typeof insertUserPurchaseSchema>;