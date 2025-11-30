import React, { useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

const WorkoutItem = ({ workout }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

  return (
    <View style={styles.workoutItem}>
      <TouchableOpacity
        style={styles.workoutContent}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.workoutHeader}>
          <Text style={styles.workoutTitle}>{workout.title}</Text>
          <Text style={styles.workoutDate}>
            {formatDate(workout.createdAt)}
          </Text>
        </View>
        {workout.notes && (
          <Text style={styles.workoutNotes}>{workout.notes}</Text>
        )}
        <View style={styles.workoutStats}>
          <Text style={styles.statText}>
            {workout.exercises?.length || 0} exercises
          </Text>
          <Text style={styles.expandIndicator}>
            {expanded ? '▲' : '▼'}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.exercisesList}>
            {workout.exercises && workout.exercises.length > 0 ? (
              workout.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>
                      {exercise.exerciseTemplate?.name || exercise.name || 'Unknown Exercise'}
                    </Text>
                    {exercise.exerciseTemplate?.difficulty && (
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.exerciseTemplate.difficulty) }]}>
                        <Text style={styles.difficultyText}>{exercise.exerciseTemplate.difficulty}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.exerciseDetails}>
                    {exercise.sets && (
                      <Text style={styles.exerciseDetail}>Sets: {exercise.sets}</Text>
                    )}
                    {exercise.reps && (
                      <Text style={styles.exerciseDetail}>Reps: {exercise.reps}</Text>
                    )}
                    {exercise.weight && (
                      <Text style={styles.exerciseDetail}>Weight: {exercise.weight}lbs</Text>
                    )}
                  </View>

                  {exercise.exerciseTemplate?.equipment && (
                    <Text style={styles.exerciseEquipment}>
                      Equipment: {exercise.exerciseTemplate.equipment}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noExercisesText}>No exercises in this workout</Text>
            )}
          </View>

          <TouchableOpacity style={styles.startWorkoutButton} activeOpacity={0.8}>
            <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return '#4CAF50';
    case 'intermediate': return '#FF9800';
    case 'advanced': return '#F44336';
    default: return Colors.light.secondary;
  }
};

const WorkoutsTab = ({ workouts }) => {
  const handleCreateWorkout = () => {
    router.push('/workout/make-workout');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateWorkout}>
          <Text style={styles.createButtonText}>+ Create Workout</Text>
        </TouchableOpacity>
      </View>

      {!workouts || workouts.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>Create your first workout to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <WorkoutItem workout={item} />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default WorkoutsTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
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
  workoutItem: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  workoutContent: {
    padding: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  workoutDate: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  workoutNotes: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 8,
    lineHeight: 20,
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  expandIndicator: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '600',
  },
  expandedContent: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseItem: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  exerciseDetail: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
  },
  exerciseEquipment: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
  },
  noExercisesText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    padding: 20,
  },
  startWorkoutButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startWorkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
