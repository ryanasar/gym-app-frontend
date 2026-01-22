import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import { getNotifications, markAllNotificationsAsRead } from '../api/notificationsApi';
import { useAuth } from '../auth/auth';

const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  refreshNotifications: () => Promise.resolve(),
  markAllAsRead: () => Promise.resolve(),
});

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Compute unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id || unreadCount === 0) return;

    try {
      await markAllNotificationsAsRead(user.id);
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [user?.id, unreadCount]);

  // Initial fetch when user logs in
  useEffect(() => {
    if (user?.id) {
      refreshNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?.id, refreshNotifications]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    let channel = null;
    let isSubscribed = false;

    const setupSubscription = () => {
      // Remove existing channel if any
      if (channel) {
        supabase.removeChannel(channel);
      }

      channel = supabase
        .channel(`notifications-${user.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            // Add new notification to the beginning of the list
            setNotifications(prev => [payload.new, ...prev]);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribed = true;
          }
          if (status === 'CLOSED' && isSubscribed) {
            // Reconnect if closed unexpectedly
            isSubscribed = false;
            setTimeout(setupSubscription, 1000);
          }
        });
    };

    setupSubscription();

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
