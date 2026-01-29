import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Colors } from '../../constants/colors';

const IndividualWorkoutCompletedCard = ({ workoutData, onPostWorkout, onUncomplete }) => {
  const colors = useThemeColors();
  const [isExercisesExpanded, setIsExercisesExpanded] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const exercises = workoutData?.exercises || [];
  const workoutName = workoutData?.workoutName || 'Workout';
  const sourceLabel = workoutData?.source === 'freestyle' ? 'Freestyle Workout' : 'Saved Workout';

  // Collapse exercises if more than 5
  const shouldCollapse = exercises.length > 5;
  const maxVisibleExercises = 5;
  const visibleExercises = isExercisesExpanded || !shouldCollapse
    ? exercises
    : exercises.slice(0, maxVisibleExercises);

  const handleUncomplete = () => {
    setShowOptionsMenu(false);
    Alert.alert(
      'Un-complete Workout?',
      'This will erase your workout progress and you will need to complete it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Un-complete',
          style: 'destructive',
          onPress: onUncomplete,
        },
      ]
    );
  };

  return (
    <View style={[
      styles.workoutCard,
      { backgroundColor: colors.cardBackground, shadowColor: colors.shadow, borderColor: colors.borderLight },
      styles.workoutCardCompleted
    ]}>
      {/* Header */}
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <View style={styles.workoutTitleRow}>
            <Text style={[styles.workoutTitle, { color: colors.text }]}>{workoutName}</Text>
            <View style={styles.headerActions}>
              <Text style={[styles.exerciseCount, { color: colors.secondaryText }]}>
                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
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
            {sourceLabel}
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
              onPress={handleUncomplete}
            >
              <Ionicons name="arrow-undo-outline" size={18} color="#EF4444" />
              <Text style={[styles.optionsMenuItemText, { color: '#EF4444' }]}>Un-complete Workout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Exercises List */}
      {exercises.length > 0 && (
        <View style={styles.exercisesList}>
          {visibleExercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={[styles.exerciseItem, { borderBottomColor: colors.borderLight + '40' }]}>
              <View style={styles.exerciseContent}>
                <Text style={[styles.exerciseName, { color: colors.text }]}>
                  {exerciseIndex + 1}. {exercise.name}
                </Text>
                <Text style={[styles.exerciseDetailText, { color: colors.secondaryText }]}>
                  {exercise.completedSets !== undefined && exercise.totalSets !== undefined
                    ? `${exercise.completedSets}/${exercise.totalSets} sets`
                    : exercise.sets && `${exercise.sets} sets`}
                  {((exercise.completedSets !== undefined && exercise.totalSets !== undefined) || exercise.sets) && exercise.reps && ' · '}
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
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Post Workout Button */}
        <TouchableOpacity
          style={styles.postWorkoutButton}
          onPress={onPostWorkout}
          activeOpacity={0.7}
        >
          <View style={styles.postWorkoutContent}>
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
            <Text style={styles.postWorkoutText}>Post Workout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default IndividualWorkoutCompletedCard;

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
    minWidth: 200,
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
  sourceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
});
