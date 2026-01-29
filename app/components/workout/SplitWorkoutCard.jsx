import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const SplitWorkoutCard = ({
  todaysWorkout,
  activeSplit,
  isCompleted,
  isToggling,
  hasExercises,
  hasActiveWorkout,
  hasPosted,
  currentStreak,
  completedSessionId,
  shouldCollapse,
  maxVisibleExercises,
  freeRestDayAvailable,
  onToggleCompletion,
  onOptionsMenuToggle,
  onChangeDayPress,
  onEditWorkoutPress,
  onFreeRestDayPress,
  skipAutoResumeRef
}) => {
  const colors = useThemeColors();
  const router = useRouter();
  const [isExercisesExpanded, setIsExercisesExpanded] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const handleOptionsMenuToggle = () => {
    const newValue = !showOptionsMenu;
    setShowOptionsMenu(newValue);
    if (onOptionsMenuToggle) onOptionsMenuToggle(newValue);
  };

  const visibleExercises = isExercisesExpanded || !shouldCollapse
    ? todaysWorkout.exercises
    : todaysWorkout.exercises.slice(0, maxVisibleExercises);

  return (
    <View style={[
      styles.workoutCard,
      { backgroundColor: colors.cardBackground, shadowColor: colors.shadow, borderColor: colors.borderLight },
      isCompleted && styles.workoutCardCompleted
    ]}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <View style={styles.workoutTitleRow}>
            <Text style={[styles.workoutTitle, { color: colors.text }]}>{todaysWorkout.dayName}</Text>
            <View style={styles.headerActions}>
              <Text style={[styles.exerciseCount, { color: colors.secondaryText }]}>
                {todaysWorkout.exercises.length} exercises
              </Text>
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={handleOptionsMenuToggle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>
          {activeSplit?.name && (
            <Text style={[styles.splitName, { color: colors.primary }]}>
              {activeSplit.emoji && `${activeSplit.emoji} `}{activeSplit.name}
            </Text>
          )}
          <Text style={[styles.cycleInfo, { color: colors.secondaryText }]}>
            Cycle {todaysWorkout.weekNumber} · Day {todaysWorkout.dayNumber}
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
            {isCompleted ? (
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  Alert.alert(
                    'Un-complete Workout?',
                    'This will erase your workout progress and you will need to complete it again.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Un-complete',
                        style: 'destructive',
                        onPress: onToggleCompletion,
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="arrow-undo-outline" size={18} color="#EF4444" />
                <Text style={[styles.optionsMenuItemText, { color: '#EF4444' }]}>Un-complete Workout</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.optionsMenuItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    onChangeDayPress();
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.text} />
                  <Text style={[styles.optionsMenuItemText, { color: colors.text }]}>Change Today's Workout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionsMenuItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    onEditWorkoutPress();
                  }}
                >
                  <Ionicons name="create-outline" size={18} color={colors.text} />
                  <Text style={[styles.optionsMenuItemText, { color: colors.text }]}>Edit Workout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionsMenuItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    onToggleCompletion();
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                  <Text style={[styles.optionsMenuItemText, { color: '#4CAF50' }]}>Mark as Completed</Text>
                </TouchableOpacity>
                {freeRestDayAvailable && (
                  <TouchableOpacity
                    style={styles.optionsMenuItem}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      onFreeRestDayPress();
                    }}
                  >
                    <Ionicons name="bed-outline" size={18} color={colors.warning} />
                    <Text style={[styles.optionsMenuItemText, { color: colors.warning }]}>Take Free Rest Day</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
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
                : `Show ${todaysWorkout.exercises.length - maxVisibleExercises} more`}
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
        {!isCompleted && (
          <>
            {!hasExercises && (
              <View style={[styles.noExercisesWarning, { backgroundColor: colors.borderLight + '40' }]}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.secondaryText} />
                <Text style={[styles.noExercisesWarningText, { color: colors.secondaryText }]}>
                  Add exercises to this workout to get started
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.startWorkoutButton,
                { backgroundColor: colors.primary, shadowColor: colors.primary },
                !hasExercises && styles.startWorkoutButtonDisabled
              ]}
              onPress={() => {
                skipAutoResumeRef.current = false;
                router.push({
                  pathname: '/workout/session',
                  params: {
                    workoutData: JSON.stringify(todaysWorkout)
                  }
                });
              }}
              disabled={!hasExercises}
              activeOpacity={!hasExercises ? 1 : 0.7}
            >
              <Text style={[
                styles.startWorkoutText,
                { color: colors.onPrimary },
                !hasExercises && styles.startWorkoutTextDisabled
              ]}>
                {hasActiveWorkout ? 'Resume Workout' : 'Start Workout'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {isCompleted && (
          <>
            {hasPosted ? (
              <View style={styles.workoutCompletedContainer}>
                <View style={styles.workoutCompletedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={[styles.workoutCompletedText, { color: colors.text }]}>Workout Completed</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.postWorkoutButton,
                  isToggling && styles.postWorkoutButtonDisabled
                ]}
                onPress={() => {
                  const isSplitCompleted = require('../../utils/workout/workoutCalculations').checkIfSplitCompleted(activeSplit, todaysWorkout);

                  router.push({
                    pathname: '/post/create',
                    params: {
                      workoutData: JSON.stringify(todaysWorkout),
                      workoutSessionId: completedSessionId?.toString() || '',
                      splitId: activeSplit?.id?.toString() || '',
                      streak: currentStreak.toString(),
                      isSplitCompleted: isSplitCompleted.toString(),
                    },
                  });
                }}
                disabled={isToggling}
                activeOpacity={isToggling ? 1 : 0.7}
              >
                <View style={styles.postWorkoutContent}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.postWorkoutText}>Post Workout</Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default SplitWorkoutCard;

const styles = StyleSheet.create({
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
  workoutCardCompleted: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50' + '08',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.15,
  },
  workoutHeader: {
    marginBottom: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  splitName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 4,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  exerciseCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  cycleInfo: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.secondaryText,
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
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryActionButtonDisabled: {
    opacity: 0.5,
  },
  secondaryActionText: {
    color: Colors.light.secondaryText,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  postWorkoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postWorkoutButtonDisabled: {
    opacity: 0.5,
  },
  postWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postWorkoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  workoutCompletedContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  workoutCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutCompletedText: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    minWidth: 220,
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
});
