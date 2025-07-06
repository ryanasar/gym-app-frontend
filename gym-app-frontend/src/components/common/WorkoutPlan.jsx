import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const WorkoutPlan = ({ plan }) => {
  const {
    id,
    user,
    isPublic,
    numDays,
    workoutDays,
    likes,
    comments,
  } = plan;

  const colorScheme = 'light'; // Replace with useColorScheme() if using dynamic theming

  return (
    <View style={[styles.card, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].tabIconDefault }]}>
      {/* Author Info */}
      <View style={styles.authorSection}>
        <Text style={[styles.authorName, { color: Colors[colorScheme].text }]}>{user?.name || user?.username}</Text>
        <Text style={[styles.visibility, { color: Colors[colorScheme].secondaryText }]}>{isPublic ? 'Public' : 'Private'}</Text>
      </View>

      {/* Plan Info */}
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>Workout Plan #{id}</Text>
      <Text style={[styles.numDays, { color: Colors[colorScheme].text }]}>Number of Days: {numDays}</Text>

      {/* Workout Days */}
      {workoutDays && workoutDays.length > 0 && (
        <View style={styles.workoutDaysSection}>
          {workoutDays.map((day) => (
            <View key={day.id} style={styles.dayItem}>
              <Text style={[styles.dayTitle, { color: Colors[colorScheme].text }]}>Day {day.dayIndex + 1}</Text>
              {day.isRest ? (
                <Text style={[styles.restDay, { color: Colors[colorScheme].icon }]}>Rest Day</Text>
              ) : (
                <>
                  <Text style={[styles.workoutTitle, { color: Colors[colorScheme].text }]}>Workout: {day.workout?.title}</Text>
                  {day.workout?.exercises && day.workout.exercises.length > 0 && (
                    <View style={styles.exerciseList}>
                      {day.workout.exercises.map((exercise) => (
                        <View key={exercise.id} style={styles.exerciseItem}>
                          <Text style={[styles.exerciseName, { color: Colors[colorScheme].text }]}>{exercise.name}</Text>
                          <Text style={[styles.exerciseDetails, { color: Colors[colorScheme].secondaryText }]}>
                            Sets: {exercise.sets || '-'} | Reps: {exercise.reps || '-'} | Weight: {exercise.weight || '-'} lbs
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {day.workout?.notes && (
                    <Text style={[styles.workoutNotes, { color: Colors[colorScheme].secondaryText }]}>Notes: {day.workout.notes}</Text>
                  )}
                </>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Likes and Comments */}
      <View style={styles.statsSection}>
        <Text style={[styles.stat, { color: Colors[colorScheme].secondaryText }]}>{likes.length} Likes</Text>
        <Text style={[styles.stat, { color: Colors[colorScheme].secondaryText }]}>{comments.length} Comments</Text>
      </View>
    </View>
  );
};

export default WorkoutPlan;

const styles = StyleSheet.create({
  card: {
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 1,
  },
  authorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  visibility: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 4,
  },
  numDays: {
    fontSize: 14,
    marginBottom: 8,
  },
  workoutDaysSection: {
    marginTop: 8,
  },
  dayItem: {
    marginBottom: 12,
  },
  dayTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  restDay: {
    fontStyle: 'italic',
    fontSize: 13,
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  exerciseList: {
    marginLeft: 8,
    marginTop: 4,
  },
  exerciseItem: {
    marginBottom: 4,
  },
  exerciseName: {
    fontWeight: '500',
  },
  exerciseDetails: {
    fontSize: 12,
  },
  workoutNotes: {
    marginTop: 4,
    fontStyle: 'italic',
    fontSize: 12,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stat: {
    fontSize: 12,
  },
});
