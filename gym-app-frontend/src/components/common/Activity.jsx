import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const Activity = ({ post }) => {
  const {
    title,
    description,
    createdAt,
    author,
    workout,
    likes,
    comments,
  } = post;

  const colorScheme = 'light'; // Replace with dynamic useColorScheme() if desired

  return (
    <View style={[styles.card, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].tabIconDefault }]}>
      {/* Author Info */}
      <View style={styles.authorSection}>
        <Text style={[styles.authorName, { color: Colors[colorScheme].text }]}>{author.name || author.username}</Text>
        <Text style={[styles.date, { color: Colors[colorScheme].secondaryText }]}>{new Date(createdAt).toLocaleDateString()}</Text>
      </View>

      {/* Post Title */}
      <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{title}</Text>

      {/* Post Description */}
      <Text style={[styles.description, { color: Colors[colorScheme].text }]}>{description}</Text>

      {/* Workout Details */}
      {workout && (
        <View style={[styles.workoutSection, { backgroundColor: Colors[colorScheme].tabIconDefault }]}>
          <Text style={[styles.workoutTitle, { color: Colors[colorScheme].text }]}>Workout: {workout.title}</Text>
          {workout.exercises && workout.exercises.length > 0 && (
            <View style={styles.exerciseList}>
              {workout.exercises.map((exercise) => (
                <View key={exercise.id} style={styles.exerciseItem}>
                  <Text style={[styles.exerciseName, { color: Colors[colorScheme].text }]}>{exercise.name}</Text>
                  <Text style={[styles.exerciseDetails, { color: Colors[colorScheme].icon }]}>
                    Sets: {exercise.sets || '-'} | Reps: {exercise.reps || '-'} | Weight: {exercise.weight || '-'} lbs
                  </Text>
                </View>
              ))}
            </View>
          )}
          {workout.notes && <Text style={[styles.workoutNotes, { color: Colors[colorScheme].icon }]}>Notes: {workout.notes}</Text>}
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

export default Activity;

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
  date: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  workoutSection: {
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  workoutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  exerciseList: {
    marginLeft: 8,
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
