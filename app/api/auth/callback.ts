import { APP_SCHEME, FRONTENT_REDIRECT_URL } from "@/constants";

export async function GET(request: Request) {
  const incomingParams = new URLSearchParams(request.url.split("?")[1]);
  const combinedPlatformAndState = incomingParams.get("state");

  if (!combinedPlatformAndState) {
    return Response.json(
      { error: "Invalid state" },
      { status: 400 }
    );
  }

  const [platform, state] = combinedPlatformAndState.split("|");

  const outgoingParams = new URLSearchParams({
    code: incomingParams.get("code")?.toString() || "",
    state,
  });

  return Response.redirect(
    (platform === "web" ? FRONTENT_REDIRECT_URL : APP_SCHEME) + "?" + outgoingParams.toString()
  );
}

export default function CallbackPage() {
  return null;
}
