import { supabase } from '../../../supabase';

async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Sign up error:", error.message);
    throw error;
  }

  console.log("User signed up:", data);
  return data;
}

export default function SignUpPage() {
  return null;
}
