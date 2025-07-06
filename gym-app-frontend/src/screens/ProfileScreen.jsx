import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import ProfileHeader from '../components/profile/ProfileHeader';

import ActivitiesTab from '../components/profile/ActivitiesTab';
import WorkoutPlansTab from '../components/profile/WorkoutPlansTab';
import PRsTab from '../components/profile/PRsTab';

import { getUserByUsername } from '../api/usersApi';
import { getPostsByUserId } from '../api/postsApi';
import { getWorkoutPlansByUserId } from '../api/workoutPlansApi';

import { Colors } from '../constants/colors';

const ProfileScreen = ({ route }) => {
  const { username, isOwnProfile } = route.params;

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [selectedTab, setSelectedTab] = useState('Activities');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch user
        const user = await getUserByUsername(username);
        setUser(user);
        setLoadingUser(false);

        // Fetch posts
        const postsData = await getPostsByUserId(user.id);
        setPosts(postsData);
        setLoadingPosts(false);

        // Fetch workout plans
        const plansData = await getWorkoutPlansByUserId(user.id);
        setWorkoutPlans(plansData);
        setLoadingPlans(false);

      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        setLoadingUser(false);
        setLoadingPosts(false);
        setLoadingPlans(false);
      }
    };

    fetchProfileData();
  }, [username]);

  if (loadingUser) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>User not found.</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'Activities':
        return <ActivitiesTab posts={posts} loading={loadingPosts} />;
      case 'Workout Plans':
        return <WorkoutPlansTab workoutPlans={workoutPlans} loading={loadingPlans} />;
      case 'PRs':
        return <PRsTab userId={user.id} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.topBlock}>
      <ProfileHeader
        username={user.username}
        name={user.name}
        bio={user.profile.bio}
        workouts={user.workoutCount}
        followedBy={user.followerCount}
        following={user.followingCount}
        isOwnProfile={isOwnProfile}
        isFollowing={false}
        isPrivate={user.profile.isPrivate}
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
      <View contentContainerStyle={styles.tabContentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  topBlock: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: 50,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: Colors.light.tabIconDefault,
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
    padding: 16,
  },
});
