import React from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import WorkoutPlan from '../common/WorkoutPlan';
import { Colors } from '../../constants/colors';

const WorkoutsTab = ({ workouts }) => {


  if (!workouts || workouts.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No workouts</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={workoutPlans[0].workoutDays}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <WorkoutPlan plan={item.workout} />
      )}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
};

export default WorkoutsTab;

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    marginTop: 20,
  },
  todayContainer: {
    padding: 16,
    backgroundColor: Colors.light.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
