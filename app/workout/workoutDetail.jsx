import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { exercises } from '../data/exercises/exerciseDatabase';
import { muscleGroups } from '../data/exercises/muscleGroups';

const WorkoutDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse workout data from params
  const workoutData = params.workoutData ? JSON.parse(params.workoutData) : null;
  const splitData = params.splitData ? JSON.parse(params.splitData) : null;

  if (!workoutData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Workout data not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canDismiss()) {
                router.dismiss();
              } else if (router.canGoBack()) {
                router.back();
              }
            }}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
          <Ionicons name="close" size={28} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Name */}
        <Text style={styles.workoutName}>{workoutData.dayName}</Text>

        {/* Program Name */}
        {splitData?.name && (
          <View style={styles.programSection}>
            <Text style={styles.programName}>
              {splitData.emoji && `${splitData.emoji} `}{splitData.name}
            </Text>
          </View>
        )}

        {/* Week and Day */}
        {workoutData.weekNumber && workoutData.dayNumber && (
          <View style={styles.metadataSection}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={18} color={Colors.light.secondaryText} />
              <Text style={styles.metadataText}>
                Week {workoutData.weekNumber}
              </Text>
            </View>
            <View style={styles.metadataItem}>
              <Ionicons name="today-outline" size={18} color={Colors.light.secondaryText} />
              <Text style={styles.metadataText}>
                Day {workoutData.dayNumber}
              </Text>
            </View>
          </View>
        )}

        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{workoutData.exercises?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Exercises</Text>
          </View>
        </View>

        {/* Muscle Groups */}
        {primaryMuscles.length > 0 && (
          <View style={styles.muscleGroupsSection}>
            <Text style={styles.sectionTitle}>Muscle Groups</Text>
            <View style={styles.muscleGroupsList}>
              {primaryMuscles.map((muscleKey, index) => {
                const muscle = muscleGroups[muscleKey];
                return muscle ? (
                  <View key={index} style={styles.muscleGroupChip}>
                    <Text style={styles.muscleGroupText}>{muscle.name}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Exercise List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <View style={styles.exerciseList}>
            {workoutData.exercises?.map((exercise, index) => (
              <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                </View>
                {exercise.sets && (
                  <View style={styles.exerciseDetails}>
                    {Array.isArray(exercise.sets) ? (
                      <>
                        <Text style={styles.exerciseDetailSummary}>
                          {exercise.sets.length} sets × {exercise.sets[0]?.reps || '-'} reps
                        </Text>
                        {exercise.sets.map((set, setIndex) => (
                          <View key={setIndex} style={styles.setRow}>
                            <Text style={styles.setLabel}>Set {set.setNumber}</Text>
                            <Text style={styles.setDetails}>
                              {set.weight ? `${set.weight} lbs` : '-'} × {set.reps || '-'} reps
                            </Text>
                          </View>
                        ))}
                      </>
                    ) : (
                      <View style={styles.templateExerciseInfo}>
                        <Text style={styles.exerciseDetailSummary}>
                          {exercise.sets} sets
                          {exercise.reps && ` × ${exercise.reps} reps`}
                        </Text>
                        {exercise.weight && (
                          <Text style={styles.exerciseDetailSummary}>
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

        {/* View Full Split Button */}
        <TouchableOpacity
          style={styles.viewSplitButton}
          disabled
          activeOpacity={0.7}
        >
          <Ionicons name="list-outline" size={20} color={Colors.light.secondaryText} />
          <Text style={styles.viewSplitButtonText}>View full split</Text>
          <Text style={styles.comingSoonBadge}>Coming soon</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default WorkoutDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 40,
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
    color: Colors.light.text,
    marginBottom: 16,
    lineHeight: 38,
  },

  // Program Section
  programSection: {
    marginBottom: 16,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
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
    color: Colors.light.secondaryText,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.light.shadow,
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
    color: Colors.light.primary,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.borderLight,
  },

  // Muscle Groups Section
  muscleGroupsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  muscleGroupsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleGroupChip: {
    backgroundColor: '#4CAF50' + '15',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#4CAF50' + '30',
  },
  muscleGroupText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },

  // Exercises Section
  exercisesSection: {
    marginBottom: 24,
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
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
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
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
    color: Colors.light.secondaryText,
    marginBottom: 4,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.borderLight + '20',
    borderRadius: 8,
  },
  setLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  setDetails: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },

  // View Split Button
  viewSplitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.borderLight + '20',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    gap: 8,
    marginTop: 8,
  },
  viewSplitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  comingSoonBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.secondaryText,
    backgroundColor: Colors.light.borderLight + '40',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    color: Colors.light.secondaryText,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.onPrimary,
  },
});
