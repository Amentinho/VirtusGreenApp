import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, passwordRecoveryRequestSchema, passwordResetSchema, insertUserSchema } from "@shared/schema";
import { sendEmail, generatePasswordResetEmail, generateEmailVerificationToken, generateVerificationEmail } from "./emailService";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'usernameOrEmail',
      passwordField: 'password'
    }, async (usernameOrEmail, password, done) => {
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);
      if (!user || !user.password || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else if (!user.emailVerified) {
        return done(null, false, { message: "Please verify your email before logging in" });
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", { username: req.body.username, email: req.body.email });
      
      // Validate request body against schema
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.error("Validation error:", validationResult.error);
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.errors
        });
      }

      const { confirmPassword, ...userData } = validationResult.data;
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ 
          message: "The account already exists",
          field: "username",
          suggestion: "recover_password"
        });
      }

      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ 
          message: "The account already exists", 
          field: "email",
          suggestion: "recover_password"
        });
      }

      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
      });

      // Generate email verification token
      const { token, expires } = generateEmailVerificationToken();
      await storage.setEmailVerificationToken(user.id, token, expires);

      // Send verification email
      try {
        const emailData = generateVerificationEmail(user.email!, user.username || 'User', token);
        const emailSent = await sendEmail(emailData);
        
        if (emailSent) {
          console.log(`Verification email sent to ${user.email}`);
        } else {
          console.warn(`Failed to send verification email to ${user.email}`);
        }
      } catch (error) {
        console.error("Error sending verification email:", error);
        // Don't fail registration if email fails
      }

      res.status(201).json({ 
        message: "Registration successful! Please check your email to verify your account.",
        emailSent: true 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error during registration" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req: any, res) => {
    // Check if email is verified for local users (SSO users are automatically verified)
    if (req.user && !req.user.emailVerified && req.user.password) {
      return res.status(403).json({ 
        message: "Please verify your email address before logging in. Check your email for the verification link.",
        emailNotVerified: true 
      });
    }
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Password recovery endpoints
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const validatedData = passwordRecoveryRequestSchema.parse(req.body);
      const { email } = validatedData;

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ message: "If the email exists, a recovery link has been sent." });
      }

      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      const tokenSet = await storage.setPasswordResetToken(email, resetToken, resetTokenExpiry);
      if (!tokenSet) {
        return res.status(500).json({ message: "Failed to generate reset token." });
      }

      // Send recovery email
      const emailData = generatePasswordResetEmail(resetToken, email);
      const emailSent = await sendEmail(emailData);

      if (emailSent) {
        console.log(`Password recovery email sent to ${email}`);
      } else {
        console.warn(`Failed to send password recovery email to ${email}`);
      }

      res.json({ message: "If the email exists, a recovery link has been sent." });
    } catch (error) {
      console.error("Password recovery request error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const validatedData = passwordResetSchema.parse(req.body);
      const { token, newPassword } = validatedData;

      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token." });
      }

      // Hash new password and update user
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Clear reset token
      await storage.clearPasswordResetToken(user.id);

      console.log(`Password reset successful for user ${user.email}`);
      res.json({ message: "Password has been reset successfully." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}