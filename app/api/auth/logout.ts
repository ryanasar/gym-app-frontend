import {
    COOKIE_NAME,
    COOKIE_OPTIONS,
    REFRESH_COOKIE_NAME,
    REFRESH_COOKIE_OPTIONS,
  } from "@/constants";
  
  export async function POST(request: Request) {
    try {
      const response = new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
  
      response.headers.append(
        "Set-Cookie",
        `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`
      );
      response.headers.append(
        "Set-Cookie",
        `${REFRESH_COOKIE_NAME}=; Max-Age=0; Path=/api/auth/refresh; HttpOnly; Secure; SameSite=Lax`
      );
  
      return response;
    } catch (error) {
      console.error("Logout error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  