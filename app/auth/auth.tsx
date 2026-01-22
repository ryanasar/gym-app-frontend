import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../../supabase";
import { getOrCreateUserBySupabaseId, getUserProfile, getUserWorkoutPlans, getUserPosts } from "../api/usersApi";
import { getWorkoutsByUserId } from "../api/workoutsApi";
import { AuthError } from "expo-auth-session/build/Errors";
import { router } from 'expo-router';
import {
  saveSessionSecurely,
  getStoredSession,
  clearSecureSession,
  updateCachedUserData,
  updateTokenExpiry,
} from "../../services/secureStorage";
import {
  checkNetworkStatus,
  subscribeToNetworkChanges,
} from "../../services/networkService";
import { storage } from "../../storage/StorageAdapter";

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

interface AuthContextType {
  user: any | null;
  authUser: AuthUser | null;
  profile: any | null;
  workoutPlans: any | null;
  workouts: any | null;
  posts: any | null;
  setUser: (user: any | null) => void;
  setAuthUser: (authUser: AuthUser | null) => void;
  refreshWorkouts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signIn: () => void;
  signInWithApple: () => void;
  signOut: () => Promise<void>;
  isLoading: boolean;
  error: AuthError | null;
  // Offline session properties
  isOffline: boolean;
  isTokenExpired: boolean;
  isOfflineSession: boolean;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  authUser: null,
  profile: null,
  workoutPlans: null,
  workouts: null,
  posts: null,
  setUser: () => {},
  setAuthUser: () => {},
  refreshWorkouts: () => Promise.resolve(),
  refreshPosts: () => Promise.resolve(),
  refreshProfile: () => Promise.resolve(),
  signIn: () => {},
  signInWithApple: () => {},
  signOut: () => Promise.resolve(),
  isLoading: false,
  error: null,
  isOffline: false,
  isTokenExpired: false,
  isOfflineSession: false,
  refreshSession: () => Promise.resolve(false),
});

// Supabase OAuth redirect URL
const redirectUrl = Linking.createURL("auth/callback");

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<any | null>(null);
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [profile, setProfile] = React.useState<any | null>(null);
  const [workoutPlans, setWorkoutPlans] = React.useState<any | null>(null);
  const [workouts, setWorkouts] = React.useState<any | null>(null);
  const [posts, setPosts] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<AuthError | null>(null);

  // Offline session state
  const [isOffline, setIsOffline] = React.useState(false);
  const [isTokenExpired, setIsTokenExpired] = React.useState(false);
  const [isOfflineSession, setIsOfflineSession] = React.useState(false);

  // Subscribe to network changes
  React.useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges((online) => {
      setIsOffline(!online);

      // When coming back online, try to refresh session if token was expired
      if (online && isTokenExpired && user) {
        refreshSession();
      }
    });

    return () => unsubscribe();
  }, [isTokenExpired, user]);

  /**
   * Refresh the session - only attempt when online
   */
  const refreshSession = React.useCallback(async (): Promise<boolean> => {
    const online = await checkNetworkStatus();
    if (!online) {
      console.log('[Auth] Cannot refresh session - offline');
      return false;
    }

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error || !session) {
        console.error('[Auth] Session refresh failed:', error);
        return false;
      }

      // Update token expiry
      const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000;
      await updateTokenExpiry(expiresAt);
      setIsTokenExpired(false);
      setIsOfflineSession(false);

      console.log('[Auth] Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('[Auth] Error refreshing session:', error);
      return false;
    }
  }, []);

  /**
   * Initialize auth - handles both online and offline scenarios
   */
  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check network status first
        const online = await checkNetworkStatus();
        setIsOffline(!online);

        if (online) {
          // Online flow - try to get session from Supabase
          await initializeOnlineSession();
        } else {
          // Offline flow - restore from secure storage
          await initializeOfflineSession();
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
        // Try offline session as fallback
        await initializeOfflineSession();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes (only works when online)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] Auth state changed:', _event);

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
        setIsOfflineSession(false);

        // Fetch user data on SIGNED_IN or USER_UPDATED
        if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
          if (authUserData.supabaseID) {
            try {
              const userData = await getOrCreateUserBySupabaseId(authUserData.supabaseID, authUserData.email);
              setUser(userData);

              // Save session securely for offline access
              const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000;
              await saveSessionSecurely({
                userId: userData.id,
                supabaseId: authUserData.supabaseID,
                email: authUserData.email,
                accessTokenExpiry: expiresAt,
                userData: userData,
                authUserData: authUserData,
              });
              setIsTokenExpired(false);
            } catch (error) {
              console.error('[Auth] Error fetching user data on auth change:', error);
            }
          }
        }

        // Update token expiry on refresh
        if (_event === 'TOKEN_REFRESHED') {
          const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000;
          await updateTokenExpiry(expiresAt);
          setIsTokenExpired(false);
        }
      } else {
        setAuthUser(null);
        setUser(null);
        setIsOfflineSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Initialize session when online
   */
  const initializeOnlineSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] Error getting session:', error);
        return;
      }

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
          try {
            const userData = await getOrCreateUserBySupabaseId(authUserData.supabaseID, authUserData.email);
            setUser(userData);

            // Save session securely for offline access
            const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000;
            await saveSessionSecurely({
              userId: userData.id,
              supabaseId: authUserData.supabaseID,
              email: authUserData.email,
              accessTokenExpiry: expiresAt,
              userData: userData,
              authUserData: authUserData,
            });
            setIsTokenExpired(false);
          } catch (error) {
            console.error('[Auth] Error fetching user data:', error);
            // Try to use cached data
            await initializeOfflineSession();
          }
        }
      } else {
        // No online session - check for offline session
        const storedSession = await getStoredSession();
        if (storedSession.hasValidSession) {
          // There was a previous session - user needs to login again
          console.log('[Auth] No active session, but found stored session - user needs to re-login');
        }
        setAuthUser(null);
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Error in online session init:', error);
      // Fallback to offline session
      await initializeOfflineSession();
    }
  };

  /**
   * Initialize session when offline using secure storage
   */
  const initializeOfflineSession = async () => {
    try {
      const storedSession = await getStoredSession();

      if (!storedSession.hasValidSession || !storedSession.userData) {
        console.log('[Auth] No valid offline session found');
        setAuthUser(null);
        setUser(null);
        return;
      }

      console.log('[Auth] Restoring offline session');

      // Restore user data from secure storage
      setUser(storedSession.userData);
      setAuthUser(storedSession.authUserData);
      setIsTokenExpired(storedSession.isTokenExpired);
      setIsOfflineSession(true);

      console.log('[Auth] Offline session restored successfully', {
        userId: storedSession.userId,
        tokenExpired: storedSession.isTokenExpired,
      });
    } catch (error) {
      console.error('[Auth] Error restoring offline session:', error);
      setAuthUser(null);
      setUser(null);
    }
  };

  // Fetch related data when user is set
  React.useEffect(() => {
    if (user?.id && !isOfflineSession) {
      // Only fetch from server if we're not in offline mode
      Promise.all([
        getUserProfile(user.id).catch(() => null),
        getUserWorkoutPlans(user.id).catch(() => null),
        getWorkoutsByUserId(user.id).catch(() => null),
        getUserPosts(user.id).catch(() => null)
      ]).then(async ([profileData, workoutPlansData, workoutsData, postsData]) => {
        setProfile(profileData);
        setWorkoutPlans(workoutPlansData);
        setWorkouts(workoutsData);
        setPosts(postsData);

        // Update cached user data for offline access
        if (profileData || workoutPlansData) {
          const currentUser = user;
          await updateCachedUserData({
            ...currentUser,
            profile: profileData,
            workoutPlans: workoutPlansData,
          });
        }
      }).catch((error) => {
        console.error('[Auth] Error fetching user data:', error);
      });
    } else if (!user) {
      // Clear data when user is null
      setProfile(null);
      setWorkoutPlans(null);
      setWorkouts(null);
      setPosts(null);
    }
  }, [user, isOfflineSession]);

  const signIn = async () => {
    // Don't allow sign in while offline
    const online = await checkNetworkStatus();
    if (!online) {
      setError(
        new AuthError({
          error: "offline_error",
          error_description: "Cannot sign in while offline. Please check your internet connection.",
        })
      );
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open the OAuth URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('[Auth] Google OAuth result:', result);

        if (result.type === 'success') {
          const url = result.url;
          console.log('[Auth] Google callback URL:', url);

          // Extract tokens - try hash fragment first, then query params
          let tokenPart = '';
          if (url.includes('#')) {
            tokenPart = url.split('#')[1];
          } else if (url.includes('?')) {
            tokenPart = url.split('?')[1];
          }

          console.log('[Auth] Token part:', tokenPart);

          const params = new URLSearchParams(tokenPart);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          console.log('[Auth] Access token found:', !!accessToken);
          console.log('[Auth] Refresh token found:', !!refreshToken);

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[Auth] Error setting session:', sessionError);
              throw sessionError;
            }
            console.log('[Auth] Session set successfully');
          } else {
            console.error('[Auth] Missing tokens in callback URL');
            throw new Error('Authentication failed - no tokens received');
          }
        } else if (result.type === 'cancel') {
          console.log('[Auth] User cancelled Google sign-in');
        } else {
          console.log('[Auth] Google OAuth result type:', result.type);
        }
      }
    } catch (e: any) {
      console.error('[Auth] Google sign-in error:', e);
      setError(
        new AuthError({
          error: "sign_in_error",
          error_description: e.message || "Failed to sign in with Google",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async () => {
    // Don't allow sign in while offline
    const online = await checkNetworkStatus();
    if (!online) {
      setError(
        new AuthError({
          error: "offline_error",
          error_description: "Cannot sign in while offline. Please check your internet connection.",
        })
      );
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open the OAuth URL in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('[Auth] Apple OAuth result:', result);

        if (result.type === 'success') {
          const url = result.url;
          console.log('[Auth] Apple callback URL:', url);

          // Extract tokens - try hash fragment first, then query params
          let tokenPart = '';
          if (url.includes('#')) {
            tokenPart = url.split('#')[1];
          } else if (url.includes('?')) {
            tokenPart = url.split('?')[1];
          }

          console.log('[Auth] Token part:', tokenPart);

          const params = new URLSearchParams(tokenPart);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          console.log('[Auth] Access token found:', !!accessToken);
          console.log('[Auth] Refresh token found:', !!refreshToken);

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[Auth] Error setting session:', sessionError);
              throw sessionError;
            }
            console.log('[Auth] Session set successfully');
          } else {
            console.error('[Auth] Missing tokens in callback URL');
            throw new Error('Authentication failed - no tokens received');
          }
        } else if (result.type === 'cancel') {
          console.log('[Auth] User cancelled Apple sign-in');
        } else {
          console.log('[Auth] Apple OAuth result type:', result.type);
        }
      }
    } catch (e: any) {
      console.error('[Auth] Apple sign-in error:', e);
      setError(
        new AuthError({
          error: "sign_in_error",
          error_description: e.message || "Failed to sign in with Apple",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);

      // Clear secure storage first (always works, even offline)
      await clearSecureSession();

      // Clear offline queue
      try {
        await storage.clearAllData?.() || Promise.resolve();
      } catch (e) {
        // Storage clearing is not critical
      }

      // Try to sign out from Supabase (may fail if offline)
      const online = await checkNetworkStatus();
      if (online) {
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.warn('[Auth] Supabase signout failed (may be offline):', e);
        }
      }

      // Clear all auth state
      setAuthUser(null);
      setUser(null);
      setProfile(null);
      setWorkoutPlans(null);
      setWorkouts(null);
      setPosts(null);
      setError(null);
      setIsOfflineSession(false);
      setIsTokenExpired(false);

      // Navigate to login screen
      router.replace('/(auth)/login');

    } catch (e) {
      console.error('[Auth] Error during sign out:', e);
      // Even if there's an error, clear the local state
      setAuthUser(null);
      setUser(null);
      setProfile(null);
      setWorkoutPlans(null);
      setWorkouts(null);
      setPosts(null);
      setError(null);
      setIsOfflineSession(false);
      setIsTokenExpired(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWorkouts = async () => {
    if (user?.id && !isOffline) {
      try {
        const workoutsData = await getWorkoutsByUserId(user.id);
        setWorkouts(workoutsData);
      } catch (error) {
        // Handle error silently
      }
    }
  };

  const refreshPosts = async () => {
    if (user?.id && !isOffline) {
      try {
        const postsData = await getUserPosts(user.id);
        setPosts(postsData);
      } catch (error) {
        // Handle error silently
      }
    }
  };

  const refreshProfile = async () => {
    if (user?.id && !isOffline) {
      try {
        const profileData = await getUserProfile(user.id);
        setProfile(profileData);
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
        refreshPosts,
        refreshProfile,
        signIn,
        signInWithApple,
        signOut,
        isLoading,
        error,
        isOffline,
        isTokenExpired,
        isOfflineSession,
        refreshSession,
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
