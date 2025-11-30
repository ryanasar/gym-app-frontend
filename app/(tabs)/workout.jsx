import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

import { useAuth } from '../auth/auth';
import { Colors } from '../constants/colors';

import MyWorkoutPlansTab from '../components/workout/MyWorkoutPlanTab';
import MyWorkoutsTab from '../components/workout/MyWorkoutsTab';

const WorkoutScreen = () => {
  const { workoutPlans, workouts } = useAuth();
  const [selectedTab, setSelectedTab] = useState('My Workouts');

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'My Splits':
        return <MyWorkoutPlansTab workoutPlans={workoutPlans} />;
      case 'My Workouts':
        return <MyWorkoutsTab workouts={workouts} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Workouts</Text>
      </View>

      <View style={styles.contentView}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={selectedTab === 'My Workouts' ? styles.activeTab : styles.inactiveTab}
            onPress={() => setSelectedTab('My Workouts')}
          >
            <Text style={selectedTab === 'My Workouts' ? styles.activeTabText : styles.inactiveTabText}>
              My Workouts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={selectedTab === 'My Splits' ? styles.activeTab : styles.inactiveTab}
            onPress={() => setSelectedTab('My Splits')}
          >
            <Text style={selectedTab === 'My Splits' ? styles.activeTabText : styles.inactiveTabText}>
              My Splits
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentContainer}>
          {renderTabContent()}
        </View>
      </View>
    </View>
  );
};

export default WorkoutScreen;

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
  contentView: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    backgroundColor: Colors.light.cardBackground,
    marginBottom: 8,
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
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 14,
    color: Colors.light.text,
  },
});
