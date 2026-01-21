/**
 * Secure Storage Service
 * Handles secure storage of authentication tokens using expo-secure-store
 *
 * Stores essential auth data for offline session restoration:
 * - userId: The database user ID
 * - supabaseId: The Supabase auth user ID
 * - accessTokenExpiry: When the access token expires
 * - hasValidSession: Flag indicating a valid session exists
 */

import * as SecureStore from 'expo-secure-store';

const SECURE_KEYS = {
  USER_ID: 'gymvy_user_id',
  SUPABASE_ID: 'gymvy_supabase_id',
  ACCESS_TOKEN_EXPIRY: 'gymvy_access_token_expiry',
  HAS_VALID_SESSION: 'gymvy_has_valid_session',
  USER_EMAIL: 'gymvy_user_email',
  USER_DATA: 'gymvy_user_data', // Cached user profile for offline access
  AUTH_USER_DATA: 'gymvy_auth_user_data', // Cached auth user for offline access
};

/**
 * Save session data securely after successful login
 * @param {Object} params
 * @param {string} params.userId - Database user ID
 * @param {string} params.supabaseId - Supabase auth user ID
 * @param {string} params.email - User email
 * @param {number} params.accessTokenExpiry - Token expiry timestamp (ms)
 * @param {Object} params.userData - Full user data object for offline caching
 * @param {Object} params.authUserData - Auth user data for offline caching
 */
export async function saveSessionSecurely({
  userId,
  supabaseId,
  email,
  accessTokenExpiry,
  userData,
  authUserData,
}) {
  try {
    const promises = [
      SecureStore.setItemAsync(SECURE_KEYS.HAS_VALID_SESSION, 'true'),
    ];

    if (userId) {
      promises.push(SecureStore.setItemAsync(SECURE_KEYS.USER_ID, userId.toString()));
    }
    if (supabaseId) {
      promises.push(SecureStore.setItemAsync(SECURE_KEYS.SUPABASE_ID, supabaseId));
    }
    if (email) {
      promises.push(SecureStore.setItemAsync(SECURE_KEYS.USER_EMAIL, email));
    }
    if (accessTokenExpiry) {
      promises.push(
        SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN_EXPIRY, accessTokenExpiry.toString())
      );
    }
    if (userData) {
      promises.push(
        SecureStore.setItemAsync(SECURE_KEYS.USER_DATA, JSON.stringify(userData))
      );
    }
    if (authUserData) {
      promises.push(
        SecureStore.setItemAsync(SECURE_KEYS.AUTH_USER_DATA, JSON.stringify(authUserData))
      );
    }

    await Promise.all(promises);
    console.log('[SecureStorage] Session data saved securely');
  } catch (error) {
    console.error('[SecureStorage] Failed to save session:', error);
    throw error;
  }
}

/**
 * Get stored session data for offline restoration
 * @returns {Promise<{
 *   hasValidSession: boolean,
 *   userId: string | null,
 *   supabaseId: string | null,
 *   email: string | null,
 *   accessTokenExpiry: number | null,
 *   userData: Object | null,
 *   authUserData: Object | null,
 *   isTokenExpired: boolean
 * }>}
 */
export async function getStoredSession() {
  try {
    const [
      hasValidSession,
      userId,
      supabaseId,
      email,
      accessTokenExpiry,
      userDataStr,
      authUserDataStr,
    ] = await Promise.all([
      SecureStore.getItemAsync(SECURE_KEYS.HAS_VALID_SESSION),
      SecureStore.getItemAsync(SECURE_KEYS.USER_ID),
      SecureStore.getItemAsync(SECURE_KEYS.SUPABASE_ID),
      SecureStore.getItemAsync(SECURE_KEYS.USER_EMAIL),
      SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN_EXPIRY),
      SecureStore.getItemAsync(SECURE_KEYS.USER_DATA),
      SecureStore.getItemAsync(SECURE_KEYS.AUTH_USER_DATA),
    ]);

    const expiryTimestamp = accessTokenExpiry ? parseInt(accessTokenExpiry, 10) : null;
    const isTokenExpired = expiryTimestamp ? Date.now() > expiryTimestamp : true;

    let userData = null;
    let authUserData = null;

    try {
      if (userDataStr) {
        userData = JSON.parse(userDataStr);
      }
      if (authUserDataStr) {
        authUserData = JSON.parse(authUserDataStr);
      }
    } catch (parseError) {
      console.warn('[SecureStorage] Failed to parse cached user data:', parseError);
    }

    return {
      hasValidSession: hasValidSession === 'true',
      userId: userId || null,
      supabaseId: supabaseId || null,
      email: email || null,
      accessTokenExpiry: expiryTimestamp,
      userData,
      authUserData,
      isTokenExpired,
    };
  } catch (error) {
    console.error('[SecureStorage] Failed to get stored session:', error);
    return {
      hasValidSession: false,
      userId: null,
      supabaseId: null,
      email: null,
      accessTokenExpiry: null,
      userData: null,
      authUserData: null,
      isTokenExpired: true,
    };
  }
}

/**
 * Update the cached user data (call after profile changes)
 * @param {Object} userData - Updated user data
 */
export async function updateCachedUserData(userData) {
  try {
    if (userData) {
      await SecureStore.setItemAsync(SECURE_KEYS.USER_DATA, JSON.stringify(userData));
    }
  } catch (error) {
    console.error('[SecureStorage] Failed to update cached user data:', error);
  }
}

/**
 * Update the token expiry time (call after token refresh)
 * @param {number} newExpiry - New expiry timestamp in ms
 */
export async function updateTokenExpiry(newExpiry) {
  try {
    await SecureStore.setItemAsync(
      SECURE_KEYS.ACCESS_TOKEN_EXPIRY,
      newExpiry.toString()
    );
  } catch (error) {
    console.error('[SecureStorage] Failed to update token expiry:', error);
  }
}

/**
 * Clear all secure session data (call on logout)
 */
export async function clearSecureSession() {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_KEYS.USER_ID),
      SecureStore.deleteItemAsync(SECURE_KEYS.SUPABASE_ID),
      SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN_EXPIRY),
      SecureStore.deleteItemAsync(SECURE_KEYS.HAS_VALID_SESSION),
      SecureStore.deleteItemAsync(SECURE_KEYS.USER_EMAIL),
      SecureStore.deleteItemAsync(SECURE_KEYS.USER_DATA),
      SecureStore.deleteItemAsync(SECURE_KEYS.AUTH_USER_DATA),
    ]);
    console.log('[SecureStorage] Session data cleared');
  } catch (error) {
    console.error('[SecureStorage] Failed to clear session:', error);
    throw error;
  }
}

/**
 * Check if a valid offline session exists
 * @returns {Promise<boolean>}
 */
export async function hasOfflineSession() {
  try {
    const session = await getStoredSession();
    return session.hasValidSession && session.userId !== null;
  } catch (error) {
    return false;
  }
}

export { SECURE_KEYS };
