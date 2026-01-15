import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './constants/colors';
import { useNotifications } from './contexts/NotificationContext';
import { useAuth } from './auth/auth';
import { getUserProfile } from './api/usersApi';

const NotificationsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount, isLoading, refreshNotifications, markAllAsRead } = useNotifications();
  const [actorProfiles, setActorProfiles] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mark all as read when screen opens and there are unread notifications
  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  // Fetch actor profiles for notifications
  useEffect(() => {
    const fetchActorProfiles = async () => {
      const actorIds = [...new Set(notifications.map(n => n.actor_id))];
      const profiles = {};

      await Promise.all(
        actorIds.map(async (actorId) => {
          if (!actorProfiles[actorId]) {
            try {
              const profile = await getUserProfile(actorId);
              profiles[actorId] = profile;
            } catch (error) {
              console.error('Error fetching actor profile:', error);
            }
          }
        })
      );

      if (Object.keys(profiles).length > 0) {
        setActorProfiles(prev => ({ ...prev, ...profiles }));
      }
    };

    if (notifications.length > 0) {
      fetchActorProfiles();
    }
  }, [notifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setIsRefreshing(false);
  };

  const getNotificationText = (type) => {
    switch (type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      default:
        return 'interacted with you';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: '#EF4444' };
      case 'comment':
        return { name: 'chatbubble', color: Colors.light.primary };
      case 'follow':
        return { name: 'person-add', color: '#10B981' };
      default:
        return { name: 'notifications', color: Colors.light.secondaryText };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleNotificationPress = (notification) => {
    const actorProfile = actorProfiles[notification.actor_id];
    const username = actorProfile?.user?.username;

    if (notification.type === 'follow' && username) {
      router.push(`/user/${username}`);
    } else if ((notification.type === 'like' || notification.type === 'comment') && notification.post_id) {
      // Navigate to post - for now just go to the actor's profile
      if (username) {
        router.push(`/user/${username}`);
      }
    }
  };

  const renderNotification = ({ item }) => {
    const actorProfile = actorProfiles[item.actor_id];
    const actorName = actorProfile?.user?.name || actorProfile?.user?.username || 'Someone';
    const avatarUrl = actorProfile?.avatarUrl;
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.is_read && styles.notificationUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          {/* Avatar */}
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {actorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Icon badge */}
          <View style={[styles.iconBadge, { backgroundColor: icon.color + '20' }]}>
            <Ionicons name={icon.name} size={12} color={icon.color} />
          </View>

          {/* Text content */}
          <View style={styles.textContent}>
            <Text style={styles.notificationText}>
              <Text style={styles.actorName}>{actorName}</Text>
              {' '}{getNotificationText(item.type)}
            </Text>
            <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-outline" size={48} color={Colors.light.secondaryText} />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyMessage}>
        When someone likes, comments, or follows you, you'll see it here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Notifications List */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={notifications.length === 0 ? styles.emptyListContainer : styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.light.primary}
            />
          }
        />
      )}
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flex: 1,
  },
  notificationItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight + '50',
  },
  notificationUnread: {
    backgroundColor: Colors.light.primary + '08',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.borderLight,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.light.onPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  iconBadge: {
    position: 'absolute',
    left: 32,
    bottom: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.cardBackground,
  },
  textContent: {
    flex: 1,
    marginLeft: 14,
  },
  notificationText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 20,
  },
  actorName: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
});
