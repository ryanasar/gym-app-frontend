import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '../hooks/useThemeColors';
import { getUserByUsername, followUser, unfollowUser } from '../api/usersApi';
import { getPostsByUserId } from '../api/postsApi';
import { createFollowNotification, deleteFollowNotification } from '../api/notificationsApi';
import { useAuth } from '../auth/auth';
import { Ionicons } from '@expo/vector-icons';
import ProfileHeader from '../components/profile/ProfileHeader';
import PostsTab from '../components/profile/PostsTab';
import ProgressTab from '../components/profile/ProgressTab';
import FollowListModal from '../components/profile/FollowListModal';
import EmptyState from '../components/common/EmptyState';

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.secondaryText }]}>User not found</Text>
      </View>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || `@${username}`}</Text>
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
      <View style={[styles.tabsContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('Progress')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'Progress' ? colors.primary : colors.secondaryText }]}>
            Progress
          </Text>
          {selectedTab === 'Progress' && <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('Posts')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'Posts' ? colors.primary : colors.secondaryText }]}>
            Posts
          </Text>
          {selectedTab === 'Posts' && <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('Splits')}
        >
          <Text style={[styles.tabText, { color: selectedTab === 'Splits' ? colors.primary : colors.secondaryText }]}>
            Splits
          </Text>
          {selectedTab === 'Splits' && <View style={[styles.activeTabIndicator, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={[styles.tabContentContainer, { backgroundColor: colors.background }]}>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
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
  },
  headerPlaceholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
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
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
    width: '70%',
  },
  tabContentContainer: {
    flex: 1,
    paddingTop: 16,
  },
});
