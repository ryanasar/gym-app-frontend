import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/auth';
import {
  registerForPushNotificationsAsync,
  registerTokenWithBackend,
  removeTokenFromBackend
} from '../../services/pushNotificationService';

const PushNotificationContext = createContext({
  expoPushToken: null,
  notification: null,
});

export const PushNotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Register for push notifications when user logs in
  useEffect(() => {
    if (!user?.supabaseId) {
      // User logged out, clean up token
      if (expoPushToken) {
        removeTokenFromBackend(expoPushToken);
        setExpoPushToken(null);
      }
      return;
    }

    const registerPush = async () => {
      try {
        const token = await registerForPushNotificationsAsync();

        if (token) {
          setExpoPushToken(token);
          await registerTokenWithBackend(user.supabaseId, token);
        }
      } catch (error) {
        console.error('[PushContext] Error registering push:', error);
      }
    };

    registerPush();
  }, [user?.supabaseId]);

  // Listen for incoming notifications
  useEffect(() => {
    // Notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[PushContext] Notification received:', notification);
        setNotification(notification);
      }
    );

    // User tapped on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[PushContext] Notification tapped:', response);
        handleNotificationTap(response.notification);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Handle notification tap navigation
  const handleNotificationTap = (notification) => {
    const data = notification.request.content.data;

    if (!data) return;

    switch (data.type) {
      case 'like':
      case 'comment':
      case 'tag':
        if (data.postId) {
          router.push(`/post/${data.postId}`);
        } else {
          router.push('/notifications');
        }
        break;
      case 'follow':
        router.push('/notifications');
        break;
      default:
        router.push('/notifications');
    }
  };

  return (
    <PushNotificationContext.Provider
      value={{
        expoPushToken,
        notification,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
};

export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }
  return context;
};

export default PushNotificationProvider;
