import {
  COOKIE_OPTIONS,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  JWT_SECRET,
} from "@/constants";
import * as jose from "jose";

console.log("[Auth] POST handler called");

export async function POST(request: Request) {
  try {
    console.log("[Auth] POST /api/auth/token - Start");

    const body = await request.json();
    console.log("[Auth] Request body received:", body);

    const { code } = body;

    if (!code) {
      console.error("[Auth] No authorization code provided");
      return Response.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    console.log("[Auth] Exchanging code for token with Google OAuth");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    console.log("[Auth] Token response from Google:", tokenData);

    if (!tokenResponse.ok) {
      console.error("[Auth] Token exchange failed with status", tokenResponse.status);
      console.error("[Auth] Token exchange error response:", tokenData);
      return Response.json(
        { error: "Failed to exchange code for token", details: tokenData },
        { status: 400 }
      );
    }

    const { id_token } = tokenData;

    if (!id_token) {
      console.error("[Auth] Missing id_token in token response");
      return Response.json(
        { error: "No id_token received from Google" },
        { status: 400 }
      );
    }

    console.log("[Auth] Decoding id_token JWT");

    const decodedToken = jose.decodeJwt(id_token);

    console.log("[Auth] Decoded token payload:", decodedToken);

    const user = {
      id: decodedToken.sub as string,
      email: decodedToken.email as string,
      name: decodedToken.name as string,
      picture: decodedToken.picture as string,
      given_name: decodedToken.given_name as string,
      family_name: decodedToken.family_name as string,
      email_verified: decodedToken.email_verified as boolean,
      provider: "google",
    };

    const payload = {
      user,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiry
    };

    console.log("[Auth] Signing JWT for backend token");

    const backendToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode(JWT_SECRET));

    console.log("[Auth] Returning user info and backend token");

    return Response.json({
      user,
      token: backendToken,
    });
  } catch (error) {
    console.error("[Auth] Token exchange error:", error);
    return Response.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
