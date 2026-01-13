import { supabase } from '../../../supabase';

async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error.message);
    throw error;
  }

  return data;
}

export default function SignInPage() {
  return null;
}
