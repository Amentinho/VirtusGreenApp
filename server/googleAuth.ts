import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import type { Express, Request, Response, NextFunction } from "express";
import memoize from "memoizee";
import { storage } from "./storage";

const getGoogleConfig = memoize(
  async () => {
    return await client.discovery(
      new URL("https://accounts.google.com"),
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!
    );
  },
  { maxAge: 3600 * 1000 }
);

async function upsertUserFromGoogle(claims: any) {
  return await storage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.given_name,
    lastName: claims.family_name,
    profileImageUrl: claims.picture,
  });
}

export async function setupGoogleAuth(app: Express) {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.log("Google OAuth credentials not configured, skipping Google auth setup");
      return;
    }

    console.log("Setting up Google OAuth authentication...");
    const config = await getGoogleConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      try {
        const claims = tokens.claims();
        const userData = await upsertUserFromGoogle(claims);
        const user = { 
          ...userData,
          claims,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: claims?.exp
        };
        verified(null, user);
      } catch (error) {
        console.error("Error during Google OAuth verification:", error);
        verified(error as Error);
      }
    };

    // Determine callback URL based on environment
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}`
      : 'http://localhost:5000';

    const strategy = new Strategy(
      {
        name: "google",
        config,
        scope: "openid email profile",
        callbackURL: `${baseUrl}/api/oauth/google/callback`,
      },
      verify,
    );
    
    passport.use(strategy);
    console.log("Registered Google OAuth strategy");

    // Google OAuth routes
    app.get("/api/oauth/google/login", (req, res, next) => {
      passport.authenticate("google", {
        scope: ["openid", "email", "profile"],
      })(req, res, next);
    });

    app.get("/api/oauth/google/callback", 
      (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate("google", {
          successReturnToOrRedirect: "/",
          failureRedirect: "/auth?error=google_auth_failed",
        })(req, res, next);
      },
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        console.error("Error in Google OAuth callback:", error);
        res.redirect("/auth?error=google_auth_failed");
      }
    );

  } catch (error) {
    console.error("Failed to setup Google Auth:", error);
    console.log("Continuing without Google authentication");
  }
}