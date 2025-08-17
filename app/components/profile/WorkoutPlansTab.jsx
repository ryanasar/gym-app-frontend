import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import WorkoutPlan from '../common/WorkoutPlan'; // your WorkoutPlan component

const WorkoutPlansTab = ({ workoutPlans }) => {
  if (!workoutPlans || workoutPlans.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No workout plans</Text>
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
  center: {
    alignItems: 'center',
    marginTop: 20,
  },
});
