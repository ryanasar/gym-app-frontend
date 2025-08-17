import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import { useAuth } from '../auth/auth';
import { Colors } from '../constants/colors';

import MyWorkoutPlanTab from '../components/workout/MyWorkoutPlanTab';
import MyWorkoutsTab from '../components/workout/MyWorkoutsTab';

const WorkoutScreen = () => {
  const { user, workoutPlans, } = useAuth();

  console.log(user)

  const [selectedTab, setSelectedTab] = useState('My Workout Plan');

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'My Workout Plan':
        return <MyWorkoutPlanTab workoutPlan={workoutPlans} />;
      case 'My Workouts':
        return <MyWorkoutsTab workoutPlan={workoutPlans[0]} />;
      default:
        return null;
    }
  };

  return (
    <View>
      <ScrollView>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={selectedTab === 'My Workout Plan' ? styles.activeTab : styles.inactiveTab}
            onPress={() => setSelectedTab('My Workout Plan')}
          >
            <Text style={selectedTab === 'My Workout Plan' ? styles.activeTabText : styles.inactiveTabText}>
              My Workout Plan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={selectedTab === 'My Workouts' ? styles.activeTab : styles.inactiveTab}
            onPress={() => setSelectedTab('My Workouts')}
          >
            <Text style={selectedTab === 'My Workouts' ? styles.activeTabText : styles.inactiveTabText}>
              My Workouts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

export default WorkoutScreen;

const styles = StyleSheet.create({
  topBlock: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: 50,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
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
    color: Colors.light.icon,
  },
  tabContentContainer: {
    padding: 16,
  },
  text: {
    fontSize: 14,
    color: Colors.light.text,
  },
});
