import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import WorkoutPlan from '../common/WorkoutPlan';
import { Colors } from '../../constants/colors';

const WorkoutPlansTab = ({ workoutPlans }) => {
  if (!workoutPlans || workoutPlans.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
        </View>
        <Text style={styles.emptyTitle}>No splits yet</Text>
        <Text style={styles.emptySubtitle}>Create your first split to get started</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={workoutPlans}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <WorkoutPlan plan={item} />}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
};

export default WorkoutPlansTab;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
});
