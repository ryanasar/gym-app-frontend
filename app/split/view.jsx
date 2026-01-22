import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../hooks/useThemeColors';
import EmptyState from '../components/common/EmptyState';
import { createSplit } from '../api/splitsApi';
import { useAuth } from '../auth/auth';
import { getCustomExerciseById, createCustomExercise } from '../api/customExercisesApi';

const ViewSplitScreen = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const splitData = params.splitData ? JSON.parse(params.splitData) : null;

  // Check if this is the user's own split - prevent saving your own split
  const isOwnSplit = user?.id && splitData?.userId === user.id;
  const canSave = params.canSave === 'true' && !isOwnSplit;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Handle saving the split to user's own splits
  const handleSaveSplit = async () => {
    if (!user?.id || !splitData) return;

    setSaving(true);
    try {
      // First, find and copy any custom exercises
      const customExerciseIdMap = {}; // Maps old custom exercise ID to new ID
      const allExercises = (splitData.workoutDays || []).flatMap(day => day.exercises || []);

      // Find unique custom exercise IDs (those starting with 'custom_')
      const customExerciseIds = [...new Set(
        allExercises
          .filter(ex => ex.id && String(ex.id).startsWith('custom_'))
          .map(ex => ex.id)
      )];

      // Copy each custom exercise with a new ID
      for (const oldId of customExerciseIds) {
        const originalExercise = await getCustomExerciseById(oldId);
        if (originalExercise) {
          // Create a copy with new ID
          const newExercise = await createCustomExercise({
            name: originalExercise.name,
            category: originalExercise.category,
            primaryMuscles: originalExercise.primaryMuscles,
            secondaryMuscles: originalExercise.secondaryMuscles,
            equipment: originalExercise.equipment,
            difficulty: originalExercise.difficulty,
          });
          customExerciseIdMap[oldId] = newExercise.id;
        }
      }

      // Create a copy of the split for the current user
      const splitToSave = {
        userId: user.id,
        name: splitData.name,
        description: splitData.description || '',
        emoji: splitData.emoji || '💪',
        numDays: splitData.totalDays || splitData.numDays || splitData.workoutDays?.length || 0,
        isPublic: false, // Make the copy private by default
        workoutDays: (splitData.workoutDays || []).map((day, index) => ({
          dayNumber: index + 1,
          workoutName: day.name || day.workoutName || `Day ${index + 1}`,
          workoutType: day.type || day.workoutType || '',
          workoutDescription: day.description || day.workoutDescription || '',
          emoji: day.emoji || '',
          isRestDay: day.isRest || day.isRestDay || (!day.exercises || day.exercises.length === 0),
          exercises: (day.exercises || []).map(ex => {
            // If this exercise has a custom ID, update to the new copied ID
            const exerciseId = ex.id && String(ex.id).startsWith('custom_')
              ? customExerciseIdMap[ex.id] || ex.id
              : ex.id;

            return {
              id: exerciseId,
              name: ex.name,
              sets: ex.sets?.toString() || '3',
              reps: ex.reps?.toString() || '10',
              restSeconds: ex.restTime || ex.restSeconds || '',
              notes: ex.notes || '',
              // Copy custom exercise metadata if available
              ...(ex.isCustom && {
                isCustom: true,
                category: ex.category,
                primaryMuscles: ex.primaryMuscles,
                secondaryMuscles: ex.secondaryMuscles,
                equipment: ex.equipment,
                difficulty: ex.difficulty,
              }),
            };
          }),
        })),
      };

      await createSplit(splitToSave);
      setSaved(true);
    } catch (error) {
      console.error('Failed to save split:', error);
      Alert.alert('Error', 'Failed to save split. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!splitData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Split Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.secondaryText }]}>Split not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Split Details</Text>
        </View>
        {canSave ? (
          <TouchableOpacity
            style={[
              styles.saveHeaderButton,
              { backgroundColor: saved ? colors.accent + '15' : colors.primary + '15' }
            ]}
            onPress={handleSaveSplit}
            disabled={saving || saved}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={saved ? "checkmark-circle" : "bookmark-outline"}
                  size={18}
                  color={saved ? colors.accent : colors.primary}
                />
                <Text style={[styles.saveHeaderButtonText, { color: saved ? colors.accent : colors.primary }]}>
                  {saved ? 'Saved' : 'Save'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Split Header Card */}
          <View style={[styles.splitHeaderCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow, borderColor: colors.primary }]}>
            <View style={styles.splitHeaderContent}>
              <Text style={styles.splitEmoji}>{splitData.emoji}</Text>
              <View style={styles.splitHeaderText}>
                <Text style={[styles.splitName, { color: colors.text }]}>{splitData.name}</Text>
                <Text style={[styles.splitDescription, { color: colors.secondaryText }]}>
                  {splitData.totalDays || splitData.numDays || splitData.workoutDays?.length || 0} day split
                </Text>
                {splitData.workoutDays && splitData.workoutDays.length > 0 && (
                  <Text style={[styles.workoutNamesList, { color: colors.secondaryText }]}>
                    {splitData.workoutDays.map(day => day.name || day.workoutName).filter(Boolean).join(' • ')}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Workout Days */}
          <View style={styles.workoutsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Workouts</Text>

            {splitData.workoutDays && splitData.workoutDays.length > 0 ? (
              splitData.workoutDays.map((day, index) => (
                <View key={index} style={[styles.workoutDayCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow, borderColor: colors.borderLight }]}>
                  {/* Day Header */}
                  <View style={[
                    styles.workoutDayHeader,
                    (day.isRest || day.isRestDay || !day.exercises || day.exercises.length === 0) && styles.workoutDayHeaderNoMargin
                  ]}>
                    <View style={[styles.dayNumberBadge, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.dayNumberText, { color: colors.onPrimary }]}>Day {index + 1}</Text>
                    </View>
                    <Text style={[styles.workoutDayName, { color: colors.text }]}>
                      {day.isRest || day.isRestDay || (!(day.name || day.workoutName) && (!day.exercises || day.exercises.length === 0))
                        ? 'Rest Day'
                        : day.name || day.workoutName || 'Workout'}
                    </Text>
                  </View>

                  {/* Exercises List */}
                  {day.exercises && day.exercises.length > 0 && (
                    <View style={styles.exercisesList}>
                      <Text style={[styles.exercisesTitle, { color: colors.secondaryText }]}>
                        Exercises ({day.exercises.length})
                      </Text>
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <View key={exerciseIndex} style={[styles.exerciseItem, { borderBottomColor: colors.borderLight + '40' }]}>
                          <Text style={[styles.exerciseName, { color: colors.text }]}>
                            {exerciseIndex + 1}. {exercise.name}
                          </Text>
                          <View style={styles.exerciseDetails}>
                            {exercise.sets && (
                              <Text style={[styles.exerciseDetail, { color: colors.secondaryText, backgroundColor: colors.borderLight + '60' }]}>
                                {exercise.sets} sets
                              </Text>
                            )}
                            {exercise.reps && (
                              <Text style={[styles.exerciseDetail, { color: colors.secondaryText, backgroundColor: colors.borderLight + '60' }]}>
                                {exercise.reps} reps
                              </Text>
                            )}
                            {exercise.restTime && (
                              <Text style={[styles.exerciseDetail, { color: colors.secondaryText, backgroundColor: colors.borderLight + '60' }]}>
                                {exercise.restTime} rest
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <EmptyState
                emoji="📋"
                title="No workouts"
                message="No workouts in this split"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewSplitScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 28,
    color: Colors.light.text,
    fontWeight: '300',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 60,
    bottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
    zIndex: 1,
  },
  saveHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 40,
    justifyContent: 'center',
    zIndex: 1,
  },
  saveHeaderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // Split Header Card
  splitHeaderCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  splitHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  splitHeaderText: {
    flex: 1,
  },
  splitName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  splitDescription: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '500',
    marginBottom: 4,
  },
  workoutNamesList: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },

  // Workouts Section
  workoutsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  workoutDayCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  workoutDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutDayHeaderNoMargin: {
    marginBottom: 0,
  },
  dayNumberBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.onPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutDayName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  exercisesList: {
    marginTop: 4,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight + '40',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  exerciseDetail: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    backgroundColor: Colors.light.borderLight + '60',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
});
