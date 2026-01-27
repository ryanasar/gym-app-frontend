import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { BACKEND_API_URL } from '../constants';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get the Expo push token
 * @returns {Promise<string|null>} The Expo push token or null if registration fails
 */
export const registerForPushNotificationsAsync = async () => {
  let token = null;

  // Must be a physical device
  if (!Device.isDevice) {
    console.log('[Push] Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted for push notifications');
    return null;
  }

  try {
    // Get the project ID from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.error('[Push] No project ID found in app config');
      return null;
    }

    // Get the Expo push token
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId
    });

    token = pushToken.data;
    console.log('[Push] Got push token:', token);
  } catch (error) {
    console.error('[Push] Error getting push token:', error);
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};

/**
 * Register the push token with the backend
 * @param {string} supabaseId - The user's Supabase ID
 * @param {string} token - The Expo push token
 */
export const registerTokenWithBackend = async (supabaseId, token) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/push-tokens/register/${supabaseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register token with backend');
    }

    const data = await response.json();
    console.log('[Push] Token registered with backend:', data);
    return data;
  } catch (error) {
    console.error('[Push] Error registering token with backend:', error);
    throw error;
  }
};

/**
 * Remove the push token from the backend (e.g., on logout)
 * @param {string} token - The Expo push token to remove
 */
export const removeTokenFromBackend = async (token) => {
  if (!token) return;

  try {
    const response = await fetch(`${BACKEND_API_URL}/push-tokens/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove token from backend');
    }

    console.log('[Push] Token removed from backend');
  } catch (error) {
    console.error('[Push] Error removing token from backend:', error);
  }
};

/**
 * Schedule a local notification (for testing)
 */
export const scheduleLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: { seconds: 1 },
  });
};

export default {
  registerForPushNotificationsAsync,
  registerTokenWithBackend,
  removeTokenFromBackend,
  scheduleLocalNotification,
};
