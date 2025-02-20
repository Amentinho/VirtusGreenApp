import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  tokens: integer("tokens").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  usedReferralCode: text("used_referral_code"),
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

export const insertUserSchema = createInsertSchema(users)
  .omit({ 
    id: true,
    tokens: true,
    referralCode: true 
  })
  .extend({
    usedReferralCode: z.string().optional()
  });

export const insertProductSchema = createInsertSchema(products).omit({ 
  id: true 
});

export const insertCouponSchema = createInsertSchema(coupons).omit({ 
  id: true 
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;