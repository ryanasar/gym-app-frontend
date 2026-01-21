import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { exercises } from '../data/exercises/exerciseDatabase';
import { muscleGroups } from '../data/exercises/muscleGroups';
import { createSavedWorkout } from '../api/savedWorkoutsApi';
import { getSplitById } from '../api/splitsApi';
import { useAuth } from '../auth/auth';

const WorkoutDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingSplit, setLoadingSplit] = useState(false);

  // Parse workout data from params
  const workoutData = params.workoutData ? JSON.parse(params.workoutData) : null;
  const splitData = params.splitData ? JSON.parse(params.splitData) : null;

  // Check if this split is viewable (public and has an ID)
  const canViewFullSplit = splitData?.id && splitData?.isPublic;

  // Save workout to library
  const handleSaveWorkout = async () => {
    if (!workoutData?.exercises || workoutData.exercises.length === 0) {
      Alert.alert('Error', 'No exercises to save');
      return;
    }

    setSaving(true);
    try {
      // Convert workout session exercises to saved workout format
      const exercisesToSave = workoutData.exercises.map(exercise => {
        // If sets is an array (from completed workout), extract the template info
        if (Array.isArray(exercise.sets) && exercise.sets.length > 0) {
          return {
            ...exercise,
            sets: exercise.sets.length.toString(),
            reps: exercise.sets[0]?.reps?.toString() || '',
            weight: exercise.sets[0]?.weight?.toString() || '',
            restSeconds: '',
            notes: ''
          };
        }
        // Already in template format
        return {
          ...exercise,
          sets: exercise.sets?.toString() || '',
          reps: exercise.reps?.toString() || '',
          weight: exercise.weight?.toString() || '',
          restSeconds: exercise.restSeconds?.toString() || '',
          notes: exercise.notes || ''
        };
      });

      await createSavedWorkout({
        name: workoutData.dayName || 'Saved Workout',
        description: splitData?.name ? `From ${splitData.name}` : '',
        emoji: splitData?.emoji || '💪',
        workoutType: '',
        exercises: exercisesToSave
      });

      setSaved(true);
    } catch (error) {
      console.error('Failed to save workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  // Handle viewing the full split
  const handleViewFullSplit = async () => {
    if (!splitData?.id) return;

    // Check if it's the user's own split
    const isOwnSplit = user?.id && splitData.userId === user.id;

    // If split already has workoutDays, use it directly
    if (splitData.workoutDays && splitData.workoutDays.length > 0) {
      router.push({
        pathname: '/split/view',
        params: {
          splitData: JSON.stringify(splitData),
          canSave: (!isOwnSplit).toString(),
        }
      });
      return;
    }

    // Otherwise, fetch the full split data
    setLoadingSplit(true);
    try {
      const fullSplitData = await getSplitById(splitData.id, splitData.userId);

      router.push({
        pathname: '/split/view',
        params: {
          splitData: JSON.stringify(fullSplitData),
          canSave: (!isOwnSplit).toString(),
        }
      });
    } catch (error) {
      console.error('Failed to load split:', error);
      Alert.alert('Error', 'Failed to load split details');
    } finally {
      setLoadingSplit(false);
    }
  };

  if (!workoutData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.secondaryText }]}>Workout data not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (router.canDismiss()) {
                router.dismiss();
              } else if (router.canGoBack()) {
                router.back();
              }
            }}
          >
            <Text style={[styles.backButtonText, { color: colors.onPrimary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calculate workout stats
  const totalSets = workoutData.exercises?.reduce((acc, ex) => {
    return acc + (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 0);
  }, 0) || 0;

  // Get primary muscle groups from exercises
  const getPrimaryMuscles = () => {
    if (!workoutData?.exercises) return [];

    const muscleSet = new Set();
    workoutData.exercises.forEach(exercise => {
      const exerciseData = exercises.find(ex =>
        ex.name.toLowerCase() === exercise.name.toLowerCase()
      );
      if (exerciseData?.primaryMuscles) {
        exerciseData.primaryMuscles.forEach(muscle => muscleSet.add(muscle));
      }
    });

    return Array.from(muscleSet);
  };

  const primaryMuscles = getPrimaryMuscles();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => {
            if (router.canDismiss()) {
              router.dismiss();
            } else if (router.canGoBack()) {
              router.back();
            }
          }}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Workout Details</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary + '15' },
            saved && { backgroundColor: colors.accent + '15' }
          ]}
          onPress={handleSaveWorkout}
          disabled={saving || saved}
          activeOpacity={0.7}
        >
          <Ionicons
            name={saved ? "checkmark-circle" : "bookmark-outline"}
            size={18}
            color={saved ? colors.accent : colors.primary}
          />
          <Text style={[styles.saveButtonText, { color: saved ? colors.accent : colors.primary }]}>
            {saving ? '...' : saved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Name */}
        <Text style={[styles.workoutName, { color: colors.text }]}>{workoutData.dayName}</Text>

        {/* Program Name - Clickable when split is public */}
        {splitData?.name && (
          canViewFullSplit ? (
            <TouchableOpacity
              style={[styles.programSection, styles.programSectionClickable, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}
              onPress={handleViewFullSplit}
              disabled={loadingSplit}
              activeOpacity={0.7}
            >
              <View style={styles.programSectionContent}>
                <Text style={[styles.programName, { color: colors.accent }]}>
                  {splitData.emoji && `${splitData.emoji} `}{splitData.name}
                </Text>
                <Text style={[styles.viewSplitHint, { color: colors.accent }]}>View full split</Text>
              </View>
              {loadingSplit ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.programSection}>
              <Text style={[styles.programName, { color: colors.accent }]}>
                {splitData.emoji && `${splitData.emoji} `}{splitData.name}
              </Text>
            </View>
          )
        )}

        {/* Week and Day */}
        {workoutData.weekNumber && workoutData.dayNumber && (
          <View style={styles.metadataSection}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={18} color={colors.secondaryText} />
              <Text style={[styles.metadataText, { color: colors.secondaryText }]}>
                Week {workoutData.weekNumber}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="today-outline" size={18} color={colors.secondaryText} />
              <Text style={[styles.metadataText, { color: colors.secondaryText }]}>
                Day {workoutData.dayNumber}
              </Text>
            </View>
          </View>
        )}

        {/* Stats Summary */}
        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalSets}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Total Sets</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{workoutData.exercises?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Total Exercises</Text>
          </View>
        </View>

        {/* Muscle Groups */}
        {primaryMuscles.length > 0 && (
          <View style={styles.muscleGroupsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Muscle Groups</Text>
            <View style={styles.muscleGroupsList}>
              {primaryMuscles.map((muscleKey, index) => {
                const muscle = muscleGroups[muscleKey];
                return muscle ? (
                  <View key={index} style={[styles.muscleGroupChip, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
                    <Text style={[styles.muscleGroupText, { color: colors.accent }]}>{muscle.name}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Exercise List */}
        <View style={styles.exercisesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises</Text>
          <View style={styles.exerciseList}>
            {workoutData.exercises?.map((exercise, index) => (
              <View key={index} style={[styles.exerciseCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
                <View style={styles.exerciseHeader}>
                  <View style={[styles.exerciseNumber, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.exerciseNumberText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                </View>
                {exercise.sets && (
                  <View style={styles.exerciseDetails}>
                    {Array.isArray(exercise.sets) ? (
                      <>
                        <Text style={[styles.exerciseDetailSummary, { color: colors.secondaryText }]}>
                          {exercise.sets.length} sets × {exercise.sets[0]?.reps || '-'} reps
                        </Text>
                        {exercise.sets.map((set, setIndex) => (
                          <View key={setIndex} style={[styles.setRow, { backgroundColor: colors.borderLight + '30' }]}>
                            <Text style={[styles.setLabel, { color: colors.text }]}>Set {set.setNumber}</Text>
                            <Text style={[styles.setDetails, { color: colors.secondaryText }]}>
                              {set.weight ? `${set.weight} lbs` : '-'} × {set.reps || '-'} reps
                            </Text>
                          </View>
                        ))}
                      </>
                    ) : (
                      <View style={styles.templateExerciseInfo}>
                        <Text style={[styles.exerciseDetailSummary, { color: colors.secondaryText }]}>
                          {exercise.sets} sets
                          {exercise.reps && ` × ${exercise.reps} reps`}
                        </Text>
                        {exercise.weight && (
                          <Text style={[styles.exerciseDetailSummary, { color: colors.secondaryText }]}>
                            Weight: {exercise.weight}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default WorkoutDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 60,
    bottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    zIndex: 1,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Workout Name
  workoutName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 38,
  },

  // Program Section
  programSection: {
    marginBottom: 16,
  },
  programSectionClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  programSectionContent: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewSplitHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8,
  },

  // Metadata Section
  metadataSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
  },

  // Muscle Groups Section
  muscleGroupsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  muscleGroupsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleGroupChip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  muscleGroupText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Exercises Section
  exercisesSection: {
    marginBottom: 24,
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseDetails: {
    gap: 8,
  },
  templateExerciseInfo: {
    gap: 4,
  },
  exerciseDetailSummary: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  setLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  setDetails: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
