import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { getUserByUsername, followUser, unfollowUser } from '../api/usersApi';
import { getPostsByUserId } from '../api/postsApi';
import { createFollowNotification, deleteFollowNotification } from '../api/notificationsApi';
import { useAuth } from '../auth/auth';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from '../components/profile/ProfileHeader';
import PostsTab from '../components/profile/PostsTab';
import ProgressTab from '../components/profile/ProgressTab';
import FollowListModal from '../components/profile/FollowListModal';

// Empty state component for unavailable content
const EmptyState = ({ icon, title, message }) => (
  <ScrollView contentContainerStyle={styles.emptyStateContainer}>
    <View style={styles.emptyIconContainer}>
      <Ionicons name={icon} size={40} color={Colors.light.secondaryText} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
  </ScrollView>
);

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser, refreshProfile } = useAuth();

  const [selectedTab, setSelectedTab] = useState('Progress');
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('followers');

  useEffect(() => {
    loadUserData();
  }, [username]);

  const loadUserData = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setIsLoading(true);
      }
      const userData = await getUserByUsername(username);
      setUser(userData);

      // Fetch posts using userId
      if (userData?.id) {
        const userPosts = await getPostsByUserId(userData.id);
        setPosts(userPosts);
      }

      // Check if current user is following this user
      if (currentUser?.id && userData?.followedBy) {
        const following = userData.followedBy.some(
          (follow) => follow.followedById === currentUser.id
        );
        setIsFollowing(following);
      } else {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      if (showLoadingSpinner) {
        setIsLoading(false);
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.id) {
      Alert.alert('Error', 'You must be logged in to follow users');
      return;
    }

    try {
      setIsFollowLoading(true);

      if (isFollowing) {
        await unfollowUser(username, currentUser.id);
        setIsFollowing(false);
        // Delete the follow notification
        if (user?.id) {
          await deleteFollowNotification(currentUser.id, user.id);
        }
      } else {
        await followUser(username, currentUser.id);
        setIsFollowing(true);
        // Create a notification for the followed user
        if (user?.id && user.id !== currentUser.id) {
          await createFollowNotification(user.id, currentUser.id);
        }
      }

      // Reload user data to update follower count (without full screen loading)
      await loadUserData(false);

      // Refresh current user's profile to update following count
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', `Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleOpenFollowersModal = () => {
    setModalType('followers');
    setModalVisible(true);
  };

  const handleOpenFollowingModal = () => {
    setModalType('following');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'Progress':
        return <ProgressTab userId={user?.id} isViewerMode={!isOwnProfile} />;
      case 'Posts':
        return <PostsTab posts={posts} currentUserId={currentUser?.id} onRefresh={loadUserData} />;
      case 'Splits':
        // Show empty state for viewer - splits are not shared publicly
        return (
          <EmptyState
            icon="barbell-outline"
            title="Splits not available"
            message="This user hasn't shared any workout splits yet"
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>@{username}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ProfileHeader
        profile={user.profile}
        username={user.username}
        name={user.name}
        bio={user.profile?.bio}
        avatarUrl={user.profile?.avatarUrl}
        followedBy={user.followerCount}
        following={user.followingCount}
        workouts={posts?.length || 0}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isPrivate={user.profile?.isPrivate}
        onFollowToggle={handleFollowToggle}
        isFollowLoading={isFollowLoading}
        onFollowersPress={handleOpenFollowersModal}
        onFollowingPress={handleOpenFollowingModal}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('Progress')}
        >
          <Text style={selectedTab === 'Progress' ? styles.activeTabText : styles.inactiveTabText}>
            Progress
          </Text>
          {selectedTab === 'Progress' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('Posts')}
        >
          <Text style={selectedTab === 'Posts' ? styles.activeTabText : styles.inactiveTabText}>
            Posts
          </Text>
          {selectedTab === 'Posts' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('Splits')}
        >
          <Text style={selectedTab === 'Splits' ? styles.activeTabText : styles.inactiveTabText}>
            Splits
          </Text>
          {selectedTab === 'Splits' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContentContainer}>
        {renderTabContent()}
      </View>

      {/* Follow List Modal */}
      <FollowListModal
        visible={modalVisible}
        onClose={handleCloseModal}
        username={username}
        type={modalType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  activeTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  inactiveTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: Colors.light.primary,
    borderRadius: 1.5,
    width: '70%',
  },
  tabContentContainer: {
    flex: 1,
    paddingTop: 16,
    backgroundColor: Colors.light.background,
  },
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
});
