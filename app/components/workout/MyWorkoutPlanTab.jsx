import React from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import WorkoutPlan from '../common/WorkoutPlan';
import { Colors } from '../../constants/colors';

const WorkoutPlansTab = ({ workoutPlans }) => {
    if (!workoutPlans || workoutPlans.length === 0) {
      return (
        <View style={styles.center}>
            <Text>No workout plans</Text>
        </View>
    );
    }
    
    return (
      <View style={styles.todayContainer}>
        <Text style={styles.sectionTitle}>Today's Workout</Text>
        <FlatList
          data={workoutPlans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <WorkoutPlan plan={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    );
};

export default WorkoutPlansTab;

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
