import createMemoryStore from "memorystore";
import session from "express-session";
import { Product, User, Reward, UserPurchase, InsertUser, CreateUser, UpsertUser, InsertUserPurchase, TokenEarning } from "@shared/schema";
import { customAlphabet } from "nanoid";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { users, products, rewards, userPurchases, productShares, appShares, referralEvents, userActions, socialFollowVerifications, tokenEarnings } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const REFERRAL_BONUS = 10; // Tokens awarded for successful referral
const PRODUCT_SHARE_BONUS = 5; // Tokens for sharing products
const PRODUCT_SHARE_DAILY_CAP = 5; // Maximum product shares per day
const PROFILE_COMPLETION_BONUS = 5; // Tokens for completing profile fields
const SOCIAL_FOLLOW_BONUS = 10; // Tokens for following on social media

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
  
  // Email verification operations
  setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<void>;
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  markEmailAsVerified(userId: string): Promise<void>;
  
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
  
  // Sharing and gamification methods
  recordProductShare(userId: string, productId: string, platform: string): Promise<{ awarded: number; sharesLeftToday: number }>;
  recordAppShare(userId: string, platform: string): Promise<{ shareUrl: string; referralCode: string }>;
  getTodayShareCount(userId: string): Promise<number>;
  awardProfileCompletionBonus(userId: string): Promise<{ awarded: boolean; tokensEarned: number }>;
  markOneTimeAction(userId: string, action: string, awardedTokens: number): Promise<boolean>;
  initiateSocialFollowVerification(userId: string, platform: string, handle?: string): Promise<{ verificationCode: string; message: string }>;
  verifySocialFollow(userId: string, platform: string, verificationCode: string): Promise<{ verified: boolean; tokensAwarded: number }>;
  isProfileComplete(userId: string): Promise<{ complete: boolean; missingFields: string[] }>;
  getTokenEarnings(userId: string): Promise<TokenEarning[]>;
  recordTokenEarning(userId: string, source: string, amount: number, description: string): Promise<void>;
  verifyEvmWallet(userId: string, walletAddress: string): Promise<{ verified: boolean; tokensAwarded: number }>;
  verifyTelegram(userId: string, telegramUsername: string): Promise<{ verified: boolean; tokensAwarded: number }>;

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

    // Record referral event if referral code was used
    if (insertUser.usedReferralCode) {
      const referrer = await this.getUserByReferralCode(insertUser.usedReferralCode);
      if (referrer) {
        // Record referral event
        await db
          .insert(referralEvents)
          .values({
            referrerId: referrer.id,
            referredUserId: user.id,
          });

        // Record token earnings for referrer
        await this.recordTokenEarning(
          referrer.id,
          "referral",
          REFERRAL_BONUS,
          `Referral bonus for inviting ${user.username || user.email || "new user"}`
        );

        // Record token earnings for new user
        await this.recordTokenEarning(
          user.id,
          "referral_signup",
          REFERRAL_BONUS,
          "Welcome bonus for joining with referral code"
        );
      }
    }
    
    return user;
  }

  // Replit Auth upsert - referenced from blueprint integration
  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      throw new Error("User ID is required for upsert operation");
    }
    
    // Check if user already exists
    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      // Update existing user, preserving referral code
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    } else {
      // New SSO user - handle referral bonus
      let tokens = 0;
      
      // Handle referral code if provided
      if (userData.usedReferralCode) {
        const referrer = await this.getUserByReferralCode(userData.usedReferralCode);
        if (referrer) {
          // Award tokens to both the referrer and the new user
          tokens = REFERRAL_BONUS;
          await db
            .update(users)
            .set({ tokens: referrer.tokens + REFERRAL_BONUS, updatedAt: new Date() })
            .where(eq(users.id, referrer.id));
          
          // Record referral event
          await db
            .insert(referralEvents)
            .values({
              referrerId: referrer.id,
              referredUserId: userData.id,
            });

          // Record token earnings for referrer
          await this.recordTokenEarning(
            referrer.id,
            "referral",
            REFERRAL_BONUS,
            `Referral bonus for inviting ${userData.firstName || userData.email || "new user"}`
          );

          // Record token earnings for new user
          await this.recordTokenEarning(
            userData.id,
            "referral_signup",
            REFERRAL_BONUS,
            "Welcome bonus for joining with referral code"
          );
        }
      }

      const referralCode = generateReferralCode();
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          tokens,
          referralCode,
          emailVerified: true, // SSO users are considered verified
        })
        .returning();
      return user;
    }
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

  async setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpires: expiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerificationToken, token),
          sql`${users.emailVerificationExpires} > NOW()`
        )
      );
    return user;
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
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
    // Use referral events table for accurate tracking
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(referralEvents)
      .where(eq(referralEvents.referrerId, userId));

    const referralCount = result[0]?.count || 0;
    const tokensEarned = referralCount * REFERRAL_BONUS;

    return { referralCount, tokensEarned };
  }

  async recordProductShare(userId: string, productId: string, platform: string): Promise<{ awarded: number; sharesLeftToday: number }> {
    // Check if user has already shared this product
    const existingShare = await db
      .select()
      .from(productShares)
      .where(
        and(
          eq(productShares.userId, userId),
          eq(productShares.productId, productId)
        )
      )
      .limit(1);
    
    if (existingShare.length > 0) {
      throw new Error("Product already shared");
    }

    // Check today's share count
    const todayCount = await this.getTodayShareCount(userId);
    
    if (todayCount >= PRODUCT_SHARE_DAILY_CAP) {
      throw new Error("Daily sharing limit reached");
    }

    // Record the share
    await db
      .insert(productShares)
      .values({
        userId,
        productId,
        platform,
        pointsAwarded: PRODUCT_SHARE_BONUS,
      });

    // Award tokens to user
    await db
      .update(users)
      .set({ 
        tokens: sql`${users.tokens} + ${PRODUCT_SHARE_BONUS}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Record token earning
    const product = await this.getProductByBarcode(productId);
    await this.recordTokenEarning(
      userId,
      "product_share",
      PRODUCT_SHARE_BONUS,
      `Shared ${product?.name || "product"} on ${platform}`
    );

    const sharesLeftToday = PRODUCT_SHARE_DAILY_CAP - (todayCount + 1);
    return { awarded: PRODUCT_SHARE_BONUS, sharesLeftToday };
  }

  async recordAppShare(userId: string, platform: string): Promise<{ shareUrl: string; referralCode: string }> {
    const user = await this.getUser(userId);
    if (!user?.referralCode) {
      throw new Error("User not found or no referral code");
    }

    const shareUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/auth?ref=${user.referralCode}`;
    
    await db
      .insert(appShares)
      .values({
        userId,
        platform,
        referralCode: user.referralCode,
        shareUrl,
      });

    return { shareUrl, referralCode: user.referralCode };
  }

  async getTodayShareCount(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(productShares)
      .where(
        and(
          eq(productShares.userId, userId),
          sql`${productShares.sharedAt} >= ${startOfDay}`
        )
      );

    return result[0]?.count || 0;
  }

  async awardProfileCompletionBonus(userId: string): Promise<{ awarded: boolean; tokensEarned: number }> {
    const { complete } = await this.isProfileComplete(userId);
    
    if (!complete) {
      return { awarded: false, tokensEarned: 0 };
    }

    // Check if already awarded profile completion bonus
    const alreadyAwarded = await this.markOneTimeAction(userId, "profile_completion", PROFILE_COMPLETION_BONUS);
    
    if (!alreadyAwarded) {
      return { awarded: false, tokensEarned: 0 };
    }

    // Award tokens
    await db
      .update(users)
      .set({
        tokens: sql`${users.tokens} + ${PROFILE_COMPLETION_BONUS}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Record token earning
    await this.recordTokenEarning(
      userId,
      "profile_completion",
      PROFILE_COMPLETION_BONUS,
      "Profile completion bonus"
    );

    return { awarded: true, tokensEarned: PROFILE_COMPLETION_BONUS };
  }

  async markOneTimeAction(userId: string, action: string, awardedTokens: number): Promise<boolean> {
    try {
      await db
        .insert(userActions)
        .values({
          userId,
          action,
          awardedTokens,
        });
      return true; // Successfully marked as completed
    } catch (error) {
      // If constraint error, action was already completed
      return false;
    }
  }

  async initiateSocialFollowVerification(userId: string, platform: string, handle?: string): Promise<{ verificationCode: string; message: string }> {
    const verificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    await db
      .insert(socialFollowVerifications)
      .values({
        userId,
        platform,
        handle: handle || null,
        verificationCode,
        status: "pending",
      })
      .onConflictDoUpdate({
        target: [socialFollowVerifications.userId, socialFollowVerifications.platform],
        set: {
          verificationCode,
          status: "pending",
          createdAt: new Date(),
        },
      });

    let message = "";
    if (platform === "instagram") {
      message = `Follow @virtusgreen on Instagram and post a story mentioning us with code ${verificationCode}`;
    } else if (platform === "linkedin") {
      message = `Follow VirtusGreen on LinkedIn and post about us with code ${verificationCode}`;
    }

    return { verificationCode, message };
  }

  async verifySocialFollow(userId: string, platform: string, verificationCode: string): Promise<{ verified: boolean; tokensAwarded: number }> {
    const verification = await db
      .select()
      .from(socialFollowVerifications)
      .where(
        and(
          eq(socialFollowVerifications.userId, userId),
          eq(socialFollowVerifications.platform, platform),
          eq(socialFollowVerifications.verificationCode, verificationCode)
        )
      )
      .limit(1);

    if (verification.length === 0) {
      return { verified: false, tokensAwarded: 0 };
    }

    const record = verification[0];
    if (record.status === "verified") {
      return { verified: true, tokensAwarded: record.tokensAwarded };
    }

    // Mark as verified and award tokens
    await db
      .update(socialFollowVerifications)
      .set({
        status: "verified",
        verifiedAt: new Date(),
        tokensAwarded: SOCIAL_FOLLOW_BONUS,
      })
      .where(eq(socialFollowVerifications.id, record.id));

    // Award tokens to user
    await db
      .update(users)
      .set({
        tokens: sql`${users.tokens} + ${SOCIAL_FOLLOW_BONUS}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Record token earning
    await this.recordTokenEarning(
      userId,
      "social_follow",
      SOCIAL_FOLLOW_BONUS,
      `Social media verification bonus for ${platform}`
    );

    return { verified: true, tokensAwarded: SOCIAL_FOLLOW_BONUS };
  }

  async isProfileComplete(userId: string): Promise<{ complete: boolean; missingFields: string[] }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { complete: false, missingFields: ["user_not_found"] };
    }

    const missingFields: string[] = [];
    
    if (!user.firstName) missingFields.push("firstName");
    if (!user.lastName) missingFields.push("lastName");
    if (!user.dateOfBirth) missingFields.push("dateOfBirth");
    if (!user.country) missingFields.push("country");
    if (!user.city) missingFields.push("city");
    if (!user.gender) missingFields.push("gender");

    return {
      complete: missingFields.length === 0,
      missingFields,
    };
  }

  async getTokenEarnings(userId: string): Promise<TokenEarning[]> {
    const earnings = await db
      .select()
      .from(tokenEarnings)
      .where(eq(tokenEarnings.userId, userId))
      .orderBy(sql`${tokenEarnings.earnedAt} DESC`);
    
    return earnings;
  }

  async recordTokenEarning(userId: string, source: string, amount: number, description: string): Promise<void> {
    await db
      .insert(tokenEarnings)
      .values({
        userId,
        source,
        amount,
        description,
      });
  }

  async verifyEvmWallet(userId: string, walletAddress: string): Promise<{ verified: boolean; tokensAwarded: number }> {
    // Check if user already has a verified EVM wallet
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.evmWalletVerified) {
      throw new Error("EVM wallet already verified");
    }

    // Comprehensive EVM address validation
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
    if (!isValidAddress) {
      throw new Error("Invalid EVM wallet address format. Must be a valid 42-character hex address starting with 0x");
    }

    // Additional validation - ensure it's not a zero address
    if (walletAddress.toLowerCase() === "0x0000000000000000000000000000000000000000") {
      throw new Error("Zero address is not allowed");
    }

    // Check if this wallet address is already used by another user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.evmWalletAddress, walletAddress))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      throw new Error("This wallet address is already verified by another user");
    }

    // Update user with verified wallet
    await db
      .update(users)
      .set({
        evmWalletAddress: walletAddress,
        evmWalletVerified: true,
        tokens: sql`${users.tokens} + 10`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Record token earning
    await this.recordTokenEarning(
      userId,
      "evm_wallet",
      10,
      "EVM wallet verification bonus"
    );

    return { verified: true, tokensAwarded: 10 };
  }

  async verifyTelegram(userId: string, telegramUsername: string): Promise<{ verified: boolean; tokensAwarded: number }> {
    // Check if user already has verified Telegram
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.telegramVerified) {
      throw new Error("Telegram already verified");
    }

    // Comprehensive Telegram username validation
    const isValidUsername = /^[a-zA-Z0-9_]{5,32}$/.test(telegramUsername);
    if (!isValidUsername) {
      throw new Error("Invalid Telegram username format. Must be 5-32 characters, alphanumeric and underscores only");
    }

    // Additional validation - prevent reserved usernames
    const reservedUsernames = ["admin", "support", "telegram", "bot", "api", "channel"];
    if (reservedUsernames.includes(telegramUsername.toLowerCase())) {
      throw new Error("This username is reserved and cannot be used");
    }

    // Check if this username is already used by another user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.telegramUsername, telegramUsername))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      throw new Error("This Telegram username is already verified by another user");
    }

    // Update user with verified Telegram
    await db
      .update(users)
      .set({
        telegramUsername: telegramUsername,
        telegramVerified: true,
        tokens: sql`${users.tokens} + 10`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Record token earning
    await this.recordTokenEarning(
      userId,
      "telegram",
      10,
      "Telegram verification bonus"
    );

    return { verified: true, tokensAwarded: 10 };
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<number, Product>;
  private rewards: Map<number, Reward>;
  private userPurchases: Map<number, UserPurchase>;
  private productShares: Array<{ userId: string; productId: string; platform: string; sharedAt: Date }>;
  private appShares: Array<{ userId: string; platform: string; sharedAt: Date; shareUrl: string; referralCode: string }>;
  private userActions: Array<{ userId: string; action: string; completedAt: Date; tokensAwarded: number }>;
  private socialVerifications: Array<{ userId: string; platform: string; verificationCode: string; status: string; createdAt: Date; tokensAwarded?: number }>;
  private tokenEarnings: Array<{ userId: string; source: string; amount: number; description: string; earnedAt: Date }>;
  sessionStore: session.Store;
  currentId: { products: number; rewards: number; userPurchases: number };

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.rewards = new Map();
    this.userPurchases = new Map();
    this.productShares = [];
    this.appShares = [];
    this.userActions = [];
    this.socialVerifications = [];
    this.tokenEarnings = [];
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
      dateOfBirth: null,
      country: null,
      city: null,
      gender: null,
      evmWalletAddress: null,
      evmWalletVerified: false,
      telegramUsername: null,
      telegramVerified: false,
      emailVerified: false,
      emailVerificationToken: null,
      emailVerificationExpires: null,
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
        dateOfBirth: null,
        country: null,
        city: null,
        gender: null,
        username: null,
        password: null,
        tokens: 0,
        referralCode: generateReferralCode(),
        usedReferralCode: null,
        resetToken: null,
        resetTokenExpiry: null,
        emailVerified: true, // SSO users are considered verified
        emailVerificationToken: null,
        emailVerificationExpires: null,
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

  async setEmailVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expiry;
    user.updatedAt = new Date();
    this.users.set(userId, user);
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      u => u.emailVerificationToken === token && 
           u.emailVerificationExpires && 
           u.emailVerificationExpires > new Date()
    );
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;
    
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
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

  async recordProductShare(userId: string, productId: string, platform: string): Promise<{ awarded: number; sharesLeftToday: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user has already shared this product
    const existingShare = this.productShares.find(s => 
      s.userId === userId && s.productId === productId
    );
    
    if (existingShare) {
      throw new Error("Product already shared");
    }

    // Check daily limit
    const todayShares = this.productShares.filter(s => 
      s.userId === userId && s.sharedAt >= today
    ).length;
    
    if (todayShares >= PRODUCT_SHARE_DAILY_CAP) {
      throw new Error("Daily sharing limit reached");
    }

    // Record the share
    this.productShares.push({
      userId,
      productId,
      platform,
      sharedAt: new Date(),
    });

    // Award tokens
    const user = await this.getUser(userId);
    if (user) {
      user.tokens += PRODUCT_SHARE_BONUS;
      this.users.set(userId, user);
    }

    const sharesLeftToday = PRODUCT_SHARE_DAILY_CAP - (todayShares + 1);
    return { awarded: PRODUCT_SHARE_BONUS, sharesLeftToday };
  }

  async recordAppShare(userId: string, platform: string): Promise<{ shareUrl: string; referralCode: string }> {
    const user = await this.getUser(userId);
    if (!user?.referralCode) {
      throw new Error("User not found or missing referral code");
    }

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}?ref=${user.referralCode}`;
    
    // Record the share
    this.appShares.push({
      userId,
      platform,
      sharedAt: new Date(),
      shareUrl,
      referralCode: user.referralCode,
    });

    return { shareUrl, referralCode: user.referralCode };
  }

  async getTodayShareCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.productShares.filter(s => 
      s.userId === userId && s.sharedAt >= today
    ).length;
  }

  async awardProfileCompletionBonus(userId: string): Promise<{ awarded: boolean; tokensEarned: number }> {
    // Check if user has already claimed profile completion bonus
    const existingAction = this.userActions.find(a => 
      a.userId === userId && a.action === "profile_completion"
    );
    
    if (existingAction) {
      return { awarded: false, tokensEarned: 0 };
    }

    // Check if profile is complete
    const profileStatus = await this.isProfileComplete(userId);
    if (!profileStatus.complete) {
      throw new Error(`Profile incomplete. Missing: ${profileStatus.missingFields.join(", ")}`);
    }

    // Award tokens
    const user = await this.getUser(userId);
    if (user) {
      user.tokens += PROFILE_COMPLETION_BONUS;
      this.users.set(userId, user);
    }

    // Record the action
    this.userActions.push({
      userId,
      action: "profile_completion",
      completedAt: new Date(),
      tokensAwarded: PROFILE_COMPLETION_BONUS,
    });

    return { awarded: true, tokensEarned: PROFILE_COMPLETION_BONUS };
  }

  async markOneTimeAction(userId: string, action: string, awardedTokens: number): Promise<boolean> {
    // Check if action was already completed
    const existingAction = this.userActions.find(a => 
      a.userId === userId && a.action === action
    );
    
    if (existingAction) {
      return false;
    }

    // Record the action
    this.userActions.push({
      userId,
      action,
      completedAt: new Date(),
      tokensAwarded: awardedTokens,
    });

    return true;
  }

  async initiateSocialFollowVerification(userId: string, platform: string, handle?: string): Promise<{ verificationCode: string; message: string }> {
    // Check if user already has a pending or completed verification for this platform
    const existingVerification = this.socialVerifications.find(v => 
      v.userId === userId && v.platform === platform
    );
    
    if (existingVerification && existingVerification.status === "verified") {
      throw new Error(`${platform} verification already completed`);
    }

    // Generate verification code
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Remove any existing pending verification for this platform
    this.socialVerifications = this.socialVerifications.filter(v => 
      !(v.userId === userId && v.platform === platform && v.status === "pending")
    );

    // Create new verification record
    this.socialVerifications.push({
      userId,
      platform,
      verificationCode,
      status: "pending",
      createdAt: new Date(),
    });

    const platformHandles: Record<string, string> = {
      instagram: "@virtusgreen",
      linkedin: "VirtusGreen",
      twitter: "@virtusgreen"
    };

    const message = `Please follow us on ${platform} (${platformHandles[platform]}) and post this code: ${verificationCode}. Then click verify to claim your 10 tokens!`;
    
    return { verificationCode, message };
  }

  async verifySocialFollow(userId: string, platform: string, verificationCode: string): Promise<{ verified: boolean; tokensAwarded: number }> {
    // Find the verification record
    const record = this.socialVerifications.find(v => 
      v.userId === userId && 
      v.platform === platform && 
      v.verificationCode === verificationCode &&
      v.status === "pending"
    );

    if (!record) {
      throw new Error("Invalid verification code or verification not found");
    }

    // Check if verification code is expired (24 hours)
    const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in ms
    if (new Date().getTime() - record.createdAt.getTime() > expiryTime) {
      throw new Error("Verification code has expired");
    }

    // Mark as verified
    record.status = "verified";
    record.tokensAwarded = SOCIAL_FOLLOW_BONUS;

    // Award tokens to user
    const user = await this.getUser(userId);
    if (user) {
      user.tokens += SOCIAL_FOLLOW_BONUS;
      this.users.set(userId, user);
    }

    return { verified: true, tokensAwarded: SOCIAL_FOLLOW_BONUS };
  }

  async isProfileComplete(userId: string): Promise<{ complete: boolean; missingFields: string[] }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { complete: false, missingFields: ["user_not_found"] };
    }

    const missingFields: string[] = [];
    
    if (!user.firstName) missingFields.push("firstName");
    if (!user.lastName) missingFields.push("lastName");
    if (!user.dateOfBirth) missingFields.push("dateOfBirth");
    if (!user.country) missingFields.push("country");
    if (!user.city) missingFields.push("city");
    if (!user.gender) missingFields.push("gender");

    return {
      complete: missingFields.length === 0,
      missingFields,
    };
  }

  async getTokenEarnings(userId: string): Promise<TokenEarning[]> {
    return this.tokenEarnings
      .filter(earning => earning.userId === userId)
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime())
      .map(earning => ({
        id: 0, // Not needed for in-memory
        userId: earning.userId,
        source: earning.source,
        amount: earning.amount,
        description: earning.description,
        earnedAt: earning.earnedAt,
      }));
  }

  async recordTokenEarning(userId: string, source: string, amount: number, description: string): Promise<void> {
    this.tokenEarnings.push({
      userId,
      source,
      amount,
      description,
      earnedAt: new Date(),
    });
  }

  async verifyEvmWallet(userId: string, walletAddress: string): Promise<{ verified: boolean; tokensAwarded: number }> {
    // Check if user already has a verified EVM wallet
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.evmWalletVerified) {
      throw new Error("EVM wallet already verified");
    }

    // Comprehensive EVM address validation
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
    if (!isValidAddress) {
      throw new Error("Invalid EVM wallet address format. Must be a valid 42-character hex address starting with 0x");
    }

    // Additional validation - ensure it's not a zero address
    if (walletAddress.toLowerCase() === "0x0000000000000000000000000000000000000000") {
      throw new Error("Zero address is not allowed");
    }

    // Check if this wallet address is already used by another user
    for (const [existingUserId, existingUser] of this.users.entries()) {
      if (existingUser.evmWalletAddress === walletAddress && existingUserId !== userId) {
        throw new Error("This wallet address is already verified by another user");
      }
    }

    // Update user with verified wallet
    user.evmWalletAddress = walletAddress;
    user.evmWalletVerified = true;
    user.tokens += 10;
    user.updatedAt = new Date();
    this.users.set(userId, user);

    // Record token earning
    await this.recordTokenEarning(
      userId,
      "evm_wallet",
      10,
      "EVM wallet verification bonus"
    );

    return { verified: true, tokensAwarded: 10 };
  }

  async verifyTelegram(userId: string, telegramUsername: string): Promise<{ verified: boolean; tokensAwarded: number }> {
    // Check if user already has verified Telegram
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.telegramVerified) {
      throw new Error("Telegram already verified");
    }

    // Comprehensive Telegram username validation
    const isValidUsername = /^[a-zA-Z0-9_]{5,32}$/.test(telegramUsername);
    if (!isValidUsername) {
      throw new Error("Invalid Telegram username format. Must be 5-32 characters, alphanumeric and underscores only");
    }

    // Additional validation - prevent reserved usernames
    const reservedUsernames = ["admin", "support", "telegram", "bot", "api", "channel"];
    if (reservedUsernames.includes(telegramUsername.toLowerCase())) {
      throw new Error("This username is reserved and cannot be used");
    }

    // Check if this username is already used by another user
    for (const [existingUserId, existingUser] of this.users.entries()) {
      if (existingUser.telegramUsername === telegramUsername && existingUserId !== userId) {
        throw new Error("This Telegram username is already verified by another user");
      }
    }

    // Update user with verified Telegram
    user.telegramUsername = telegramUsername;
    user.telegramVerified = true;
    user.tokens += 10;
    user.updatedAt = new Date();
    this.users.set(userId, user);

    // Record token earning
    await this.recordTokenEarning(
      userId,
      "telegram",
      10,
      "Telegram verification bonus"
    );

    return { verified: true, tokensAwarded: 10 };
  }
}

// Use database storage for production, memory for development/testing
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();