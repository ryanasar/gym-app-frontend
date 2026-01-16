import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/auth';
import { useWorkout } from '../contexts/WorkoutContext';
import { useNotifications } from '../contexts/NotificationContext';
import ActivitiesTab from '../components/profile/PostsTab';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProgressTab from '../components/profile/ProgressTab';
import WorkoutPlansTab from '../components/profile/WorkoutPlansTab';
import FollowListModal from '../components/profile/FollowListModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import { Colors } from '../constants/colors';

const ProfileScreen = () => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Progress');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('followers');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const { user, profile, posts, signOut, refreshPosts, refreshProfile } = useAuth();
  const { lastWorkoutCompleted } = useWorkout();
  const { unreadCount } = useNotifications();

  // Force ProgressTab to refresh when workout completion changes
  useEffect(() => {
    if (lastWorkoutCompleted) {
      setProgressKey(prev => prev + 1);
    }
  }, [lastWorkoutCompleted]);

  // Refresh posts when tab comes into focus to sync like states
  useFocusEffect(
    useCallback(() => {
      if (user?.id && posts?.length > 0) {
        refreshPosts();
      }
    }, [user?.id])
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>User not found.</Text>
      </View>
    );
  }

  const username = user.username;
  const name = user.name;
  const bio = profile?.bio;
  const avatarUrl = profile?.avatarUrl;
  const followedBy = profile?.user?._count?.followedBy;
  const following = profile?.user?._count?.following;
  const postsCount = posts?.length || 0;
  const isOwnProfile = true;
  const isFollowing = false;
  const isPrivate = profile?.isPrivate;

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

  const handleOpenEditModal = () => {
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
  };

  const handleProfileUpdated = (updatedProfile) => {
    // Refresh the profile data
    if (refreshProfile) {
      refreshProfile();
    }
  };

  // Render all tabs but only show the selected one to prevent unmounting/remounting
  const renderAllTabs = () => {
    return (
      <>
        <View style={selectedTab === 'Progress' ? styles.tabVisible : styles.tabHidden}>
          <ProgressTab key={progressKey} userId={user.id} />
        </View>
        <View style={selectedTab === 'Posts' ? styles.tabVisible : styles.tabHidden}>
          <ActivitiesTab posts={posts} currentUserId={user.id} onRefresh={refreshPosts} />
        </View>
        <View style={selectedTab === 'Splits' ? styles.tabVisible : styles.tabHidden}>
          <WorkoutPlansTab userId={user.id} />
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.light.text} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ProfileHeader
        profile={profile}
        username={username}
        name={name}
        bio={bio}
        avatarUrl={avatarUrl}
        followedBy={followedBy}
        following={following}
        workouts={postsCount}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isPrivate={isPrivate}
        onSignOut={signOut}
        onFollowersPress={handleOpenFollowersModal}
        onFollowingPress={handleOpenFollowingModal}
        onEditPress={handleOpenEditModal}
      />
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('Progress')}
        >
          <Text style={selectedTab === 'Progress' ? styles.activeTabText : styles.inactiveTabText}>Progress</Text>
          {selectedTab === 'Progress' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('Posts')}
        >
          <Text style={selectedTab === 'Posts' ? styles.activeTabText : styles.inactiveTabText}>Posts</Text>
          {selectedTab === 'Posts' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setSelectedTab('Splits')}
        >
          <Text style={selectedTab === 'Splits' ? styles.activeTabText : styles.inactiveTabText}>Splits</Text>
          {selectedTab === 'Splits' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContentContainer}>
        {renderAllTabs()}
      </View>

      {/* Follow List Modal */}
      <FollowListModal
        visible={modalVisible}
        onClose={handleCloseModal}
        username={username}
        type={modalType}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={handleCloseEditModal}
        userId={user?.id}
        currentBio={bio}
        currentAvatarUrl={avatarUrl}
        userName={name}
        onProfileUpdated={handleProfileUpdated}
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.light.cardBackground,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
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
    backgroundColor: Colors.light.background,
  },
  tabVisible: {
    flex: 1,
  },
  tabHidden: {
    display: 'none',
  },
});