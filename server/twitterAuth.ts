import type { Express } from "express";
import { createHash, randomBytes } from "crypto";
import { storage } from "./storage";

const TWITTER_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const TWITTER_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWITTER_USERINFO_URL = "https://api.twitter.com/2/users/me";

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function generateCodeVerifier(): string {
  return base64url(randomBytes(32));
}

function generateCodeChallenge(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

export function setupTwitterAuth(app: Express) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log("Twitter OAuth credentials not configured, skipping Twitter auth setup");
    return;
  }

  const baseUrl = process.env.APP_URL || "http://localhost:5000";
  const callbackUrl = `${baseUrl}/api/oauth/twitter/callback`;

  // Step 1: Redirect to Twitter
  app.get("/api/oauth/twitter/login", (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/auth?error=login_required");
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = randomBytes(16).toString("hex");

    req.session.twitterLinkUserId = req.user.claims?.sub || req.user.id;
    req.session.twitterCodeVerifier = codeVerifier;
    req.session.twitterState = state;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId!,
      redirect_uri: callbackUrl,
      scope: "users.read tweet.read",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    res.redirect(`${TWITTER_AUTH_URL}?${params}`);
  });

  // Step 2: Twitter redirects back here
  app.get("/api/oauth/twitter/callback", async (req: any, res) => {
    const { code, state, error } = req.query;

    if (error) {
      console.error("Twitter OAuth error:", error);
      return res.redirect("/profile?error=twitter_denied");
    }

    if (!code || state !== req.session.twitterState) {
      return res.redirect("/profile?error=twitter_invalid_state");
    }

    const userId = req.session.twitterLinkUserId;
    const codeVerifier = req.session.twitterCodeVerifier;

    if (!userId || !codeVerifier) {
      return res.redirect("/auth?error=session_expired");
    }

    try {
      // Exchange code for access token (Basic auth with client credentials)
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await fetch(TWITTER_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: callbackUrl,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error("Twitter token error:", err);
        return res.redirect("/profile?error=twitter_token_failed");
      }

      const { access_token } = await tokenRes.json();

      // Get user info
      const userRes = await fetch(`${TWITTER_USERINFO_URL}?user.fields=username,name`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!userRes.ok) {
        return res.redirect("/profile?error=twitter_userinfo_failed");
      }

      const { data } = await userRes.json();
      const handle = data?.username ? `@${data.username}` : data?.name || data?.id;

      const result = await storage.verifySocialOAuth(userId, "twitter", handle);

      // Clean up session
      delete req.session.twitterLinkUserId;
      delete req.session.twitterCodeVerifier;
      delete req.session.twitterState;

      if (result.alreadyVerified) {
        return res.redirect("/profile?twitter=already_verified");
      }

      res.redirect(`/profile?twitter=verified&tokens=${result.tokensAwarded}`);
    } catch (err) {
      console.error("Twitter OAuth callback error:", err);
      res.redirect("/profile?error=twitter_failed");
    }
  });

  console.log("Twitter OAuth routes registered");
}
