import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import IndividualWorkoutCompletedCard from './IndividualWorkoutCompletedCard';
import SavedWorkoutPicker from './SavedWorkoutPicker';
import SavedWorkoutDetailCard from './SavedWorkoutDetailCard';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const IndividualWorkoutView = ({
  individualWorkoutCompleted,
  completedIndividualWorkout,
  savedWorkouts,
  selectedSavedWorkout,
  onUncomplete,
  onEditWorkout,
  onSelectWorkout,
  onBackFromWorkout,
  onMarkComplete
}) => {
  const colors = useThemeColors();
  const router = useRouter();

  // Show completed card if workout is completed
  if (individualWorkoutCompleted && completedIndividualWorkout) {
    return (
      <View style={styles.contentContainer}>
        <IndividualWorkoutCompletedCard
          workoutData={completedIndividualWorkout}
          onPostWorkout={() => {
            // Format workout data like split workouts for consistent post creation
            const workoutDataForPost = {
              dayName: completedIndividualWorkout.workoutName || 'Workout',
              exercises: completedIndividualWorkout.exercises || [],
              source: completedIndividualWorkout.source || 'freestyle',
            };
            router.push({
              pathname: '/post/create',
              params: {
                workoutData: JSON.stringify(workoutDataForPost),
                workoutSessionId: completedIndividualWorkout.workoutSessionId?.toString() || '',
              },
            });
          }}
          onUncomplete={onUncomplete}
        />
      </View>
    );
  }

  // Show selected workout detail view
  if (selectedSavedWorkout) {
    return (
      <SavedWorkoutDetailCard
        workout={selectedSavedWorkout}
        onBack={onBackFromWorkout}
        onEdit={onEditWorkout}
        onMarkComplete={onMarkComplete}
      />
    );
  }

  // Show workout selection view
  return (
    <View style={styles.noSplitScrollContent}>
      {/* Freestyle Workout Option */}
      <TouchableOpacity
        style={[styles.freestyleCard, { backgroundColor: colors.cardBackground, borderColor: colors.primary + '30' }]}
        onPress={() => router.push({ pathname: '/workout/session', params: { source: 'freestyle' } })}
        activeOpacity={0.8}
      >
        <View style={[styles.freestyleIconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="flash" size={22} color={colors.primary} />
        </View>
        <View style={styles.freestyleContent}>
          <Text style={[styles.freestyleTitle, { color: colors.text }]}>Freestyle Workout</Text>
          <Text style={[styles.freestyleSubtitle, { color: colors.secondaryText }]}>
            Add exercises as you go
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
      </TouchableOpacity>

      {/* Saved Workouts Section */}
      {savedWorkouts.length > 0 && (
        <View style={styles.savedWorkoutsSection}>
          <Text style={[styles.savedWorkoutsSectionTitle, { color: colors.text }]}>
            Saved Workouts
          </Text>
          <SavedWorkoutPicker
            workouts={savedWorkouts}
            onSelect={onSelectWorkout}
          />
        </View>
      )}
    </View>
  );
};

export default IndividualWorkoutView;

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20,
    flex: 1,
    alignItems: 'stretch',
  },
  noSplitScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  freestyleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  freestyleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  freestyleContent: {
    flex: 1,
  },
  freestyleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  freestyleSubtitle: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  savedWorkoutsSection: {
    marginTop: 28,
  },
  savedWorkoutsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
