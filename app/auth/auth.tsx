import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../../supabase";
import { BACKEND_API_URL, GOOGLE_CLIENT_ID } from "@/constants";
import { getOrCreateUserBySupabaseId, getUserProfile, getUserWorkoutPlans, getUserPosts } from "../api/usersApi";
import { getWorkoutsByUserId } from "../api/workoutsApi";
import {
  AuthError,
  AuthRequestConfig,
  useAuthRequest,
} from "expo-auth-session";
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
  provider?: string;
  exp?: number;
  cookieExpiration?: number;
  username?: string;
  supabaseID?: string;
  createdAt?: string;
};

const AuthContext = React.createContext({
  user: null as any | null,
  authUser: null as AuthUser | null,
  profile: null as any | null,
  workoutPlans: null as any | null,
  workouts: null as any | null,
  posts: null as any | null,
  setUser: (user: any | null) => {},
  setAuthUser: (authUser: AuthUser | null) => {},
  refreshWorkouts: () => Promise.resolve(),
  signIn: () => {},
  signOut: () => {},
  isLoading: false,
  error: null as AuthError | null,
});

const config: AuthRequestConfig = {
  clientId: GOOGLE_CLIENT_ID,
  scopes: ["openid", "profile", "email"],
  redirectUri: "https://auth.expo.io/@ryanasar/gymapp",
};

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<any | null>(null);
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [profile, setProfile] = React.useState<any | null>(null);
  const [workoutPlans, setWorkoutPlans] = React.useState<any | null>(null);
  const [workouts, setWorkouts] = React.useState<any | null>(null);
  const [posts, setPosts] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<AuthError | null>(null);

  const [request, response, promptAsync] = useAuthRequest(config, discovery);


  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authUserData: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          provider: 'supabase',
          email_verified: session.user.email_confirmed_at ? true : false,
          supabaseID: session.user.id,
        };


        setAuthUser(authUserData);

        if (authUserData.supabaseID) {
          getOrCreateUserBySupabaseId(authUserData.supabaseID, authUserData.email)
            .then((userData) => {
              setUser(userData);
            })
            .catch((error) => {
              // Handle error silently
            });
        }

      } else {
        setAuthUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const authUserData: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          picture: session.user.user_metadata?.avatar_url,
          provider: 'supabase',
          email_verified: session.user.email_confirmed_at ? true : false,
          username: session.user.user_metadata?.username,
          supabaseID: session.user.id,
        };

        setAuthUser(authUserData);

        if (authUserData.supabaseID) {
          getOrCreateUserBySupabaseId(authUserData.supabaseID, authUserData.email)
            .then((userData) => {
              setUser(userData);
            })
            .catch((error) => {
              // Handle error silently
            });
        }
      } else {
        setAuthUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    handleResponse();
  }, [response]);

  // Fetch related data when user is set
  React.useEffect(() => {
    if (user?.id) {
      // Fetch profile, workout plans, workouts, and posts
      Promise.all([
        getUserProfile(user.id).catch(() => null),
        getUserWorkoutPlans(user.id).catch(() => null),
        getWorkoutsByUserId(user.id).catch(() => null),
        getUserPosts(user.id).catch(() => null)
      ]).then(([profileData, workoutPlansData, workoutsData, postsData]) => {
        setProfile(profileData);
        setWorkoutPlans(workoutPlansData);
        setWorkouts(workoutsData);
        setPosts(postsData);
      }).catch((error) => {
        // Handle error silently
      });
    } else {
      // Clear data when user is null
      setProfile(null);
      setWorkoutPlans(null);
      setWorkouts(null);
      setPosts(null);
    }
  }, [user]);

  const handleResponse = async () => {
    if (response?.type === "success") {
      setIsLoading(true);
      try {
        const { code } = response.params;

        const tokenResponse = await fetch(`${BACKEND_API_URL}/auth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenResponse.ok && tokenData.user) {
          setAuthUser(tokenData.user);

          if (tokenData.user.supabaseID) {
            const userData = await getOrCreateUserBySupabaseId(tokenData.user.supabaseID, tokenData.user.email);
            setUser(userData);
          }
        } else {
          throw new Error(tokenData.error || "Failed to sign in");
        }
      } catch (e) {
        // Handle error silently
        setError(
          new AuthError({
            error: "token_exchange_error",
            error_description: "Failed to exchange code for token",
          })
        );
      } finally {
        setIsLoading(false);
      }
    } else if (response?.type === "error") {
      // Handle error silently
      setError(response.error as AuthError);
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      if (!request) {
        // Handle error silently
        return;
      }
      await promptAsync();
    } catch (e) {
      // Handle error silently
      setError(
        new AuthError({
          error: "sign_in_error",
          error_description: "Failed to initiate sign in",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        // Handle error silently
      }
      
      // Clear all auth state
      setAuthUser(null);
      setUser(null);
      setProfile(null);
      setWorkoutPlans(null);
      setWorkouts(null);
      setPosts(null);
      setError(null);
      
      // Navigate to login screen (outside of tabs)
      router.replace('/(auth)/login');
      
    } catch (e) {
      // Handle error silently
      // Even if there's an error, clear the local state
      setAuthUser(null);
      setUser(null);
      setProfile(null);
      setWorkoutPlans(null);
      setWorkouts(null);
      setPosts(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWorkouts = async () => {
    if (user?.id) {
      try {
        const workoutsData = await getWorkoutsByUserId(user.id);
        setWorkouts(workoutsData);
      } catch (error) {
        // Handle error silently
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        profile,
        workoutPlans,
        workouts,
        posts,
        setUser,
        setAuthUser,
        refreshWorkouts,
        signIn,
        signOut,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;