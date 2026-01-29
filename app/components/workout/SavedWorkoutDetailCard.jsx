import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const SavedWorkoutDetailCard = ({
  workout,
  onBack,
  onEdit,
  onMarkComplete,
}) => {
  const colors = useThemeColors();
  const router = useRouter();
  const [isExercisesExpanded, setIsExercisesExpanded] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const exercises = workout?.exercises || [];
  const shouldCollapse = exercises.length > 5;
  const maxVisibleExercises = 5;
  const visibleExercises = isExercisesExpanded || !shouldCollapse
    ? exercises
    : exercises.slice(0, maxVisibleExercises);

  const handleMarkComplete = () => {
    setShowOptionsMenu(false);
    onMarkComplete?.(workout);
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
        <Text style={[styles.backButtonText, { color: colors.primary }]}>All Saved Workouts</Text>
      </TouchableOpacity>

      {/* Workout Card - matches SplitWorkoutCard styling */}
      <View style={[
        styles.workoutCard,
        { backgroundColor: colors.cardBackground, shadowColor: colors.shadow, borderColor: colors.borderLight }
      ]}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutInfo}>
            <View style={styles.workoutTitleRow}>
              <Text style={[styles.workoutTitle, { color: colors.text }]}>{workout.name}</Text>
              <View style={styles.headerActions}>
                <Text style={[styles.exerciseCount, { color: colors.secondaryText }]}>
                  {exercises.length} exercises
                </Text>
                <TouchableOpacity
                  style={styles.optionsButton}
                  onPress={() => setShowOptionsMenu(!showOptionsMenu)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.sourceLabel, { color: colors.primary }]}>
              {workout.emoji && `${workout.emoji} `}SAVED WORKOUT
            </Text>
          </View>
        </View>

        {/* Options Menu */}
        {showOptionsMenu && (
          <>
            <TouchableOpacity
              style={styles.optionsMenuBackdrop}
              activeOpacity={1}
              onPress={() => setShowOptionsMenu(false)}
            />
            <View style={[styles.optionsMenuOverlay, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onEdit?.(workout);
                }}
              >
                <Ionicons name="create-outline" size={18} color={colors.text} />
                <Text style={[styles.optionsMenuItemText, { color: colors.text }]}>Edit Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={handleMarkComplete}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                <Text style={[styles.optionsMenuItemText, { color: '#4CAF50' }]}>Mark as Complete</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Exercises List */}
        <View style={styles.exercisesList}>
          {visibleExercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={[styles.exerciseItem, { borderBottomColor: colors.borderLight + '40' }]}>
              <View style={styles.exerciseContent}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>
                  {exerciseIndex + 1}. {exercise.name}
                </Text>
                <Text style={[styles.exerciseDetailText, { color: colors.secondaryText }]}>
                  {exercise.sets && `${exercise.sets} sets`}
                  {exercise.sets && exercise.reps && ' · '}
                  {exercise.reps && `${exercise.reps} reps`}
                </Text>
              </View>
            </View>
          ))}

          {shouldCollapse && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setIsExercisesExpanded(!isExercisesExpanded)}
            >
              <Text style={[styles.showMoreText, { color: colors.primary }]}>
                {isExercisesExpanded
                  ? 'Show less'
                  : `Show ${exercises.length - maxVisibleExercises} more`}
              </Text>
              <Ionicons
                name={isExercisesExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {exercises.length === 0 ? (
            <View style={[styles.noExercisesWarning, { backgroundColor: colors.borderLight + '40' }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.secondaryText} />
              <Text style={[styles.noExercisesWarningText, { color: colors.secondaryText }]}>
                Add exercises to this workout to get started
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.startWorkoutButton,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
              exercises.length === 0 && styles.startWorkoutButtonDisabled
            ]}
            onPress={() => {
              router.push({
                pathname: '/workout/session',
                params: { source: 'saved', savedWorkoutId: workout.id }
              });
            }}
            disabled={exercises.length === 0}
            activeOpacity={exercises.length === 0 ? 1 : 0.7}
          >
            <Text style={[
              styles.startWorkoutText,
              { color: colors.onPrimary },
              exercises.length === 0 && styles.startWorkoutTextDisabled
            ]}>
              Start Workout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SavedWorkoutDetailCard;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  workoutCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.light.border,
    width: '100%',
  },
  workoutHeader: {
    marginBottom: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  sourceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsButton: {
    padding: 4,
    borderRadius: 8,
  },
  optionsMenuBackdrop: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    zIndex: 999,
  },
  optionsMenuOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 180,
    zIndex: 1000,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionsMenuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  exercisesList: {
    marginTop: 4,
  },
  exerciseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight + '40',
  },
  exerciseContent: {
    gap: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 20,
  },
  exerciseDetailText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    marginTop: 2,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  actionButtons: {
    marginTop: 20,
    gap: 10,
  },
  noExercisesWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  noExercisesWarningText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  startWorkoutButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startWorkoutButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  startWorkoutText: {
    color: Colors.light.onPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  startWorkoutTextDisabled: {
    opacity: 0.8,
  },
});
