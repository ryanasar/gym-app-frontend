import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ProfileHeader from '../components/profile/ProfileHeader';
import ActivitiesTab from '../components/profile/ActivitiesTab';
import WorkoutPlansTab from '../components/profile/WorkoutPlansTab';
import PRsTab from '../components/profile/PRsTab';
import { useAuth } from '../auth/auth';
import { Colors } from '../constants/colors';

const ProfileScreen = () => {
  const [selectedTab, setSelectedTab] = useState('Activities');
  const { user, profile, workoutPlans, posts, signOut } = useAuth();

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
  const followedBy = profile?.user?._count?.followedBy;
  const following = profile?.user?._count?.following;
  const workouts = profile?.user?._count?.workouts;
  const isOwnProfile = true;
  const isFollowing = false;
  const isPrivate = profile?.isPrivate;

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'Activities':
        return <ActivitiesTab posts={posts} />;
      case 'Splits':
        return <WorkoutPlansTab workoutPlans={workoutPlans} />;
      case 'PRs':
        return <PRsTab userId={user.id} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ProfileHeader
        profile={profile}
        username={username}
        name={name}
        bio={bio}
        followedBy={followedBy}
        following={following}
        workouts={workouts}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isPrivate={isPrivate}
        onSignOut={signOut}
      />
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={selectedTab === 'Activities' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setSelectedTab('Activities')}
        >
          <Text style={selectedTab === 'Activities' ? styles.activeTabText : styles.inactiveTabText}>Activities</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={selectedTab === 'Splits' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setSelectedTab('Splits')}
        >
          <Text style={selectedTab === 'Splits' ? styles.activeTabText : styles.inactiveTabText}>Splits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={selectedTab === 'PRs' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setSelectedTab('PRs')}
        >
          <Text style={selectedTab === 'PRs' ? styles.activeTabText : styles.inactiveTabText}>PRs</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContentContainer}>
        {renderTabContent()}
      </View>
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomColor: Colors.light.borderLight,
    borderBottomWidth: 1,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: Colors.light.primary,
  },
  inactiveTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  activeTabText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  inactiveTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  tabContentContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
});