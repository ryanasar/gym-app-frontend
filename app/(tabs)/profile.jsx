import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../auth/auth';
import { useWorkout } from '../contexts/WorkoutContext';
import ActivitiesTab from '../components/profile/PostsTab';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProgressTab from '../components/profile/ProgressTab';
import WorkoutPlansTab from '../components/profile/WorkoutPlansTab';
import FollowListModal from '../components/profile/FollowListModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import { useThemeColors } from '../hooks/useThemeColors';
import TabBar from '../components/ui/TabBar';

const ProfileScreen = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('Progress');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('followers');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const { user, profile, posts, signOut, refreshPosts, refreshProfile } = useAuth();
  const { lastWorkoutCompleted } = useWorkout();

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>User not found.</Text>
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
  const isVerified = profile?.isVerified;

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
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
        isVerified={isVerified}
        onSignOut={signOut}
        onFollowersPress={handleOpenFollowersModal}
        onFollowingPress={handleOpenFollowingModal}
        onEditPress={handleOpenEditModal}
      />
      {/* Tabs */}
      <TabBar
        tabs={[
          { key: 'Progress', label: 'Progress' },
          { key: 'Posts', label: 'Posts' },
          { key: 'Splits', label: 'Splits' },
        ]}
        activeTab={selectedTab}
        onTabPress={setSelectedTab}
        style={{ backgroundColor: colors.cardBackground, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}
      />

      {/* Tab Content */}
      <View style={[styles.tabContentContainer, { backgroundColor: colors.background }]}>
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
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  tabContentContainer: {
    flex: 1,
    position: 'relative',
  },
  tabVisible: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabHidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
});