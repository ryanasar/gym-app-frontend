import {
    APP_SCHEME,
    FRONTENT_REDIRECT_URL,
    GOOGLE_AUTH_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_REDIRECT_URI,
  } from "@/constants";
  
  export async function GET(request: Request) {
    if (!GOOGLE_CLIENT_ID) {
      return Response.json(
        { error: "GOOGLE_CLIENT_ID is not set" },
        { status: 500 }
      );
    }
  
    const url = new URL(request.url);
    const internalClient = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
  
    let platform: string;
  
    if (redirectUri === APP_SCHEME) {
      platform = "mobile";
    } else if (redirectUri === FRONTENT_REDIRECT_URL) {
      platform = "web";
    } else {
      return Response.json(
        { error: "Invalid Redirect URI" },
        { status: 400 }
      );
    }
  
    const state = platform + "|" + url.searchParams.get("state");
  
    if (internalClient !== "google") {
      return Response.json(
        { error: "Invalid client" },
        { status: 400 }
      );
    }
  
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: url.searchParams.get("scope") || "openid profile email",
      state: state,
      prompt: "select_account",
    });
    
    return Response.redirect(GOOGLE_AUTH_URL + "?" + params.toString());
  }

export default function AuthorizePage() {
  return null;
}
  