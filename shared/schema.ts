import { pgTable, text, serial, integer, boolean, json, varchar, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
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
  
  // Email verification fields
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  
  // Replit Auth fields - referenced from blueprint integration
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  
  // Profile completion fields
  dateOfBirth: timestamp("date_of_birth"),
  country: text("country"),
  city: text("city"),
  gender: text("gender"), // Male, Female, Non-binary
  
  // Verification fields
  evmWalletAddress: text("evm_wallet_address"),
  evmWalletVerified: boolean("evm_wallet_verified").notNull().default(false),
  telegramUsername: text("telegram_username"),
  telegramVerified: boolean("telegram_verified").notNull().default(false),
  
  // Character system
  currentCharacterId: integer("current_character_id"),
  
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
      ecoScore: number | string;
      co2Emissions: number | string;
      renewableEnergy: number | string;
      recyclableMaterials: number | string;
      recycledContent: number | string;
      waterUsage: number | string;
      landUsage: number | string;
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

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  rewardNumber: integer("reward_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  maxAvailable: integer("max_available").notNull(),
  tokenCost: integer("token_cost").notNull(),
  ipfsLink: text("ipfs_link").notNull(),
  purchasedCount: integer("purchased_count").notNull().default(0),
});

export const userCharacters = pgTable("user_characters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  characterId: integer("character_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_user_characters_unique").on(table.userId, table.characterId),
]);

export const userPurchases = pgTable("user_purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  rewardId: integer("reward_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

// New tables for sharing and rewards tracking
export const productShares = pgTable("product_shares", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  productId: text("product_id").notNull(), // Can be barcode or internal ID
  platform: text("platform").notNull(), // whatsapp, telegram, instagram
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
}, (table) => [
  index("idx_product_shares_user_date").on(table.userId, table.sharedAt),
]);

export const appShares = pgTable("app_shares", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  platform: text("platform").notNull(), // whatsapp, telegram, instagram
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
  referralCode: text("referral_code").notNull(),
  shareUrl: text("share_url").notNull(),
});

export const referralEvents = pgTable("referral_events", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull(),
  referredUserId: varchar("referred_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userActions = pgTable("user_actions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(), // email_shared, telegram_shared, instagram_shared, wallet_shared, profile_completion
  awardedTokens: integer("awarded_tokens").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("unique_user_action").on(table.userId, table.action),
]);

export const socialFollowVerifications = pgTable("social_follow_verifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  platform: text("platform").notNull(), // instagram, linkedin, twitter
  handle: text("handle"),
  status: text("status").notNull().default("pending"), // pending, verified, failed
  verificationCode: text("verification_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
  tokensAwarded: integer("tokens_awarded").notNull().default(0),
}, (table) => [
  uniqueIndex("unique_social_follow_user_platform").on(table.userId, table.platform),
]);

export const tokenEarnings = pgTable("token_earnings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  source: text("source").notNull(), // referral, product_share, app_share, profile_completion, social_follow, etc.
  amount: integer("amount").notNull(),
  description: text("description").notNull(), // Human readable description
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
}, (table) => [
  index("idx_token_earnings_user_date").on(table.userId, table.earnedAt),
]);

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

// Frontend schema for form validation (dd/mm/yyyy)
export const updateProfileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  dateOfBirth: z.string()
    .refine((date) => {
      if (!date || date === "") return true; // Allow empty
      return /^\d{2}\/\d{2}\/\d{4}$/.test(date);
    }, "Date must be in dd/mm/yyyy format")
    .refine((date) => {
      if (!date || date === "") return true; // Allow empty
      const [day, month, year] = date.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.getDate() === day && dateObj.getMonth() === month - 1 && dateObj.getFullYear() === year;
    }, "Invalid date")
    .optional(),
  country: z.string().min(1, "Country is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  gender: z.enum(["Male", "Female", "Non-binary", "Prefer not to say"]).optional(),
});

// Backend schema for API validation (yyyy-mm-dd)
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  dateOfBirth: z.string()
    .refine((date) => {
      if (!date || date === "") return true; // Allow empty
      return /^\d{4}-\d{2}-\d{2}$/.test(date);
    }, "Date must be in yyyy-mm-dd format")
    .refine((date) => {
      if (!date || date === "") return true; // Allow empty
      const dateObj = new Date(date);
      return !isNaN(dateObj.getTime());
    }, "Invalid date")
    .optional(),
  country: z.string().min(1, "Country is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  gender: z.enum(["Male", "Female", "Non-binary", "Prefer not to say"]).optional(),
});

export const insertProductSchema = createInsertSchema(products).omit({ 
  id: true 
});

export const insertRewardSchema = createInsertSchema(rewards).omit({ 
  id: true 
});

export const insertCharacterSchema = createInsertSchema(characters).omit({ 
  id: true,
  purchasedCount: true
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

// Inferred types for better type safety
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type UserCharacter = typeof userCharacters.$inferSelect;
export type UserPurchase = typeof userPurchases.$inferSelect;
export type ProductShare = typeof productShares.$inferSelect;
export type AppShare = typeof appShares.$inferSelect;
export type ReferralEvent = typeof referralEvents.$inferSelect;
export type UserAction = typeof userActions.$inferSelect;
export type SocialFollowVerification = typeof socialFollowVerifications.$inferSelect;
export type TokenEarning = typeof tokenEarnings.$inferSelect;

export type InsertReward = z.infer<typeof insertRewardSchema>;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type InsertUserPurchase = z.infer<typeof insertUserPurchaseSchema>;

// Insert schemas for new tables
export const insertProductShareSchema = createInsertSchema(productShares).omit({
  id: true,
  sharedAt: true,
  pointsAwarded: true
});

export const insertAppShareSchema = createInsertSchema(appShares).omit({
  id: true,
  sharedAt: true
});

export const insertReferralEventSchema = createInsertSchema(referralEvents).omit({
  id: true,
  createdAt: true
});

export const insertUserActionSchema = createInsertSchema(userActions).omit({
  id: true,
  createdAt: true
});

export const insertSocialFollowVerificationSchema = createInsertSchema(socialFollowVerifications).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
  tokensAwarded: true
});

export const insertTokenEarningSchema = createInsertSchema(tokenEarnings).omit({
  id: true,
  earnedAt: true
});

export type InsertProductShare = z.infer<typeof insertProductShareSchema>;
export type InsertAppShare = z.infer<typeof insertAppShareSchema>;
export type InsertReferralEvent = z.infer<typeof insertReferralEventSchema>;
export type InsertUserAction = z.infer<typeof insertUserActionSchema>;
export type InsertSocialFollowVerification = z.infer<typeof insertSocialFollowVerificationSchema>;
export type InsertTokenEarning = z.infer<typeof insertTokenEarningSchema>;