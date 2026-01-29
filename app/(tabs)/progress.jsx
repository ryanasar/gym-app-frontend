import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../auth/auth';
import { useWorkout } from '../contexts/WorkoutContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { storage } from '../../storage';
import { getBodyWeightLog, addBodyWeightEntry } from '../../storage/bodyWeightStorage';
import { getBodyWeightEntries, createBodyWeightEntry } from '../api/bodyWeightApi';
import { getWorkoutSessionsByUserId } from '../api/workoutSessionsApi';
import { getBestOneRMFromSets } from '../utils/oneRMCalculator';
import BodyWeightCard from '../components/progress/BodyWeightCard';
import ExerciseOneRMCard from '../components/progress/ExerciseOneRMCard';
import ExercisePickerDropdown from '../components/progress/ExercisePickerDropdown';

const BIG_THREE = ['Bench Press', 'Squat', 'Deadlift'];

export default function ProgressScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { exerciseDatabase } = useWorkout();

  const [bodyWeightData, setBodyWeightData] = useState([]);
  const [bigThreeData, setBigThreeData] = useState([]);
  const [otherExercises, setOtherExercises] = useState([]);
  const [selectedOtherExercise, setSelectedOtherExercise] = useState(null);
  const [selectedExerciseData, setSelectedExerciseData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Helper to find exercise ID by name (case-insensitive)
  const findExerciseIdByName = useCallback((name) => {
    const nameLower = name.toLowerCase();
    for (const [id, info] of Object.entries(exerciseDatabase)) {
      if (info.name?.toLowerCase() === nameLower) {
        return id;
      }
    }
    return null;
  }, [exerciseDatabase]);

  // Helper to calculate 1RM data for an exercise name
  const calculate1RMDataForExercise = useCallback((exerciseName, completedHistory, backendSessions) => {
    const dataPointsByDate = {};
    const exerciseNameLower = exerciseName.toLowerCase();

    // Find the exercise ID for local history matching
    const exerciseId = findExerciseIdByName(exerciseName);

    // Local completed history (uses exerciseId)
    if (exerciseId) {
      for (const workout of completedHistory) {
        if (!workout.exercises) continue;
        const match = workout.exercises.find(
          e => String(e.exerciseId) === exerciseId
        );
        if (match?.sets) {
          const bestOneRM = getBestOneRMFromSets(match.sets);
          if (bestOneRM > 0) {
            const d = workout.completedAt ? new Date(workout.completedAt) : new Date(workout.startedAt);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!dataPointsByDate[dateStr] || bestOneRM > dataPointsByDate[dateStr]) {
              dataPointsByDate[dateStr] = bestOneRM;
            }
          }
        }
      }
    }

    // Backend sessions (match by exercise name)
    for (const session of backendSessions) {
      if (!session.exercises || !session.completedAt) continue;
      const match = session.exercises.find(
        e => e.exerciseName?.toLowerCase() === exerciseNameLower
      );
      if (match?.sets) {
        const bestOneRM = getBestOneRMFromSets(match.sets);
        if (bestOneRM > 0) {
          const d = new Date(session.completedAt);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!dataPointsByDate[dateStr] || bestOneRM > dataPointsByDate[dateStr]) {
            dataPointsByDate[dateStr] = bestOneRM;
          }
        }
      }
    }

    return Object.entries(dataPointsByDate)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [findExerciseIdByName]);

  const loadData = useCallback(async () => {
    try {
      // Load body weight data
      let localEntries = await getBodyWeightLog();

      // Try to fetch and merge backend entries
      if (user?.id) {
        try {
          const backendEntries = await getBodyWeightEntries(user.id);
          if (backendEntries && backendEntries.length > 0) {
            const localDates = new Set(localEntries.map(e => e.date));
            for (const be of backendEntries) {
              const dateStr = be.date.split('T')[0];
              if (!localDates.has(dateStr)) {
                localEntries.push({
                  date: dateStr,
                  weight: be.weight,
                  timestamp: be.createdAt,
                });
              }
            }
            localEntries.sort((a, b) => a.date.localeCompare(b.date));
          }
        } catch {
          // Backend fetch failed, use local data only
        }
      }

      setBodyWeightData(localEntries);

      // Load exercise data if we have the exercise database
      if (Object.keys(exerciseDatabase).length > 0) {
        const completedHistory = await storage.getCompletedHistory();

        // Fetch backend workout sessions
        let backendSessions = [];
        if (user?.id) {
          try {
            backendSessions = await getWorkoutSessionsByUserId(user.id) || [];
          } catch {
            // Backend unavailable, use local only
          }
        }

        // Calculate 1RM data for Big 3
        const bigThreeResults = BIG_THREE.map((exerciseName) => ({
          exerciseName,
          data: calculate1RMDataForExercise(exerciseName, completedHistory, backendSessions),
        }));
        setBigThreeData(bigThreeResults);

        // Collect all unique exercise names from workout history
        const allExerciseNames = new Set();
        const bigThreeLower = new Set(BIG_THREE.map(n => n.toLowerCase()));

        // From local history
        for (const workout of completedHistory) {
          if (!workout.exercises) continue;
          for (const ex of workout.exercises) {
            const id = String(ex.exerciseId || ex.id);
            // Skip custom exercises
            if (id.startsWith('custom_')) continue;
            const info = exerciseDatabase[id];
            if (info?.name) {
              // Skip Big 3
              if (!bigThreeLower.has(info.name.toLowerCase())) {
                allExerciseNames.add(info.name);
              }
            }
          }
        }

        // From backend sessions
        for (const session of backendSessions) {
          if (!session.exercises) continue;
          for (const ex of session.exercises) {
            if (ex.exerciseName) {
              // Skip Big 3
              if (!bigThreeLower.has(ex.exerciseName.toLowerCase())) {
                allExerciseNames.add(ex.exerciseName);
              }
            }
          }
        }

        // Filter to only include exercises that have 1RM data
        const exercisesWithData = Array.from(allExerciseNames).filter(name => {
          const data = calculate1RMDataForExercise(name, completedHistory, backendSessions);
          return data && data.length > 0;
        });

        setOtherExercises(exercisesWithData);

        // If we have a selected exercise, recalculate its data
        if (selectedOtherExercise) {
          const data = calculate1RMDataForExercise(selectedOtherExercise, completedHistory, backendSessions);
          setSelectedExerciseData(data);
        }
      } else {
        setBigThreeData([]);
        setOtherExercises([]);
      }
    } catch (error) {
      console.error('[ProgressScreen] Error loading data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, exerciseDatabase, calculate1RMDataForExercise, selectedOtherExercise]);

  // Reload data when tab is focused (without showing refresh indicator)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Handle selecting an exercise from the picker
  const handleSelectExercise = useCallback(async (exerciseName) => {
    setSelectedOtherExercise(exerciseName);

    // Calculate 1RM data for the selected exercise
    const completedHistory = await storage.getCompletedHistory();
    let backendSessions = [];
    if (user?.id) {
      try {
        backendSessions = await getWorkoutSessionsByUserId(user.id) || [];
      } catch {
        // Backend unavailable
      }
    }

    const data = calculate1RMDataForExercise(exerciseName, completedHistory, backendSessions);
    setSelectedExerciseData(data);
  }, [user?.id, calculate1RMDataForExercise]);

  const handleLogWeight = async (weight) => {
    // Save locally
    await addBodyWeightEntry(weight);

    // Fire-and-forget backend save
    if (user?.id) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      createBodyWeightEntry(user.id, weight, dateStr).catch(() => {});
    }

    // Reload data
    loadData();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Body Weight Card */}
        <BodyWeightCard data={bodyWeightData} onLogWeight={handleLogWeight} />

        {/* Primary Lifts Section - only show exercises with data */}
        {bigThreeData.some(ex => ex.data && ex.data.length > 0) && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Primary Lifts</Text>
            {bigThreeData
              .filter(exercise => exercise.data && exercise.data.length > 0)
              .map((exercise) => (
                <ExerciseOneRMCard
                  key={exercise.exerciseName}
                  exerciseName={exercise.exerciseName}
                  data={exercise.data}
                />
              ))}
          </>
        )}

        {/* Other Exercises Section */}
        {otherExercises.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Other Exercises</Text>
            <ExercisePickerDropdown
              exercises={otherExercises}
              selectedExercise={selectedOtherExercise}
              onSelect={handleSelectExercise}
            />
            {selectedOtherExercise && selectedExerciseData && selectedExerciseData.length > 0 && (
              <View style={styles.selectedExerciseCard}>
                <ExerciseOneRMCard
                  exerciseName={selectedOtherExercise}
                  data={selectedExerciseData}
                />
              </View>
            )}
          </>
        )}

        {/* Hint note */}
        <Text style={[styles.hintText, { color: colors.secondaryText }]}>
          Record weight and reps during workouts to track your estimated 1RM progress.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  selectedExerciseCard: {
    marginTop: 16,
  },
  hintText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    lineHeight: 18,
  },
});
