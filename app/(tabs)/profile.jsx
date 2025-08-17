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
      case 'Workout Plans':
        return <WorkoutPlansTab workoutPlans={workoutPlans} />;
      case 'PRs':
        return <PRsTab userId={user.id} />;
      default:
        return null;
    }
  };

  return (
    <View >
      <TouchableOpacity onPress={signOut}>
          <Text>Sign Out</Text>
        </TouchableOpacity> 
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
          style={selectedTab === 'Workout Plans' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setSelectedTab('Workout Plans')}
        >
          <Text style={selectedTab === 'Workout Plans' ? styles.activeTabText : styles.inactiveTabText}>Workout Plans</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomColor: Colors.light.secondaryText,
    borderBottomWidth: 1,
    backgroundColor: Colors.light.background,
  },
  activeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: Colors.light.text,
  },
  inactiveTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  inactiveTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  tabContentContainer: {
    padding: 0,
  },
});