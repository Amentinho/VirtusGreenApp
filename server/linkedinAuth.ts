import type { Express } from "express";
import { storage } from "./storage";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export function setupLinkedInAuth(app: Express) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log("LinkedIn OAuth credentials not configured, skipping LinkedIn auth setup");
    return;
  }

  const baseUrl = process.env.APP_URL || "http://localhost:5000";
  const callbackUrl = `${baseUrl}/api/oauth/linkedin/callback`;

  // Step 1: Redirect user to LinkedIn
  app.get("/api/oauth/linkedin/login", (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/auth?error=login_required");
    }

    // Store userId in session so callback knows who to link
    req.session.linkedinLinkUserId = req.user.claims?.sub || req.user.id;
    req.session.linkedinState = crypto.randomUUID();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId!,
      redirect_uri: callbackUrl,
      state: req.session.linkedinState,
      scope: "openid profile email",
    });

    res.redirect(`${LINKEDIN_AUTH_URL}?${params}`);
  });

  // Step 2: LinkedIn redirects back here
  app.get("/api/oauth/linkedin/callback", async (req: any, res) => {
    const { code, state, error } = req.query;

    if (error) {
      console.error("LinkedIn OAuth error:", error);
      return res.redirect("/profile?error=linkedin_denied");
    }

    if (!code || state !== req.session.linkedinState) {
      return res.redirect("/profile?error=linkedin_invalid_state");
    }

    const userId = req.session.linkedinLinkUserId;
    if (!userId) {
      return res.redirect("/auth?error=session_expired");
    }

    try {
      // Exchange code for access token
      const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: callbackUrl,
          client_id: clientId!,
          client_secret: clientSecret!,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error("LinkedIn token error:", err);
        return res.redirect("/profile?error=linkedin_token_failed");
      }

      const { access_token } = await tokenRes.json();

      // Get user info
      const userRes = await fetch(LINKEDIN_USERINFO_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!userRes.ok) {
        return res.redirect("/profile?error=linkedin_userinfo_failed");
      }

      const profile = await userRes.json();
      const handle = profile.email || profile.name || profile.sub;

      const result = await storage.verifySocialOAuth(userId, "linkedin", handle);

      // Clean up session state
      delete req.session.linkedinLinkUserId;
      delete req.session.linkedinState;

      if (result.alreadyVerified) {
        return res.redirect("/profile?linkedin=already_verified");
      }

      res.redirect(`/profile?linkedin=verified&tokens=${result.tokensAwarded}`);
    } catch (err) {
      console.error("LinkedIn OAuth callback error:", err);
      res.redirect("/profile?error=linkedin_failed");
    }
  });

  console.log("LinkedIn OAuth routes registered");
}
