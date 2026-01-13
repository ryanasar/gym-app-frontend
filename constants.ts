function getEnv(name: string, fallback = ""): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`Missing environment variable: ${name}`);
    return fallback;
  }
  return value;
}

export const BACKEND_API_URL = getEnv("EXPO_PUBLIC_BACKEND_API_URL");
export const SUPABASE_URL = getEnv("EXPO_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = getEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY");
export const APP_SCHEME = getEnv("EXPO_PUBLIC_SCHEME");

export const SUPABASE_STORAGE_BUCKET = "images";
