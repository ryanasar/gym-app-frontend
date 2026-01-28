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
import EmptyState from '../components/common/EmptyState';

export default function ProgressScreen() {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { activeSplit, exerciseDatabase } = useWorkout();

  const [bodyWeightData, setBodyWeightData] = useState([]);
  const [exerciseOneRMData, setExerciseOneRMData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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

      // Load 1RM data for active split exercises
      if (activeSplit?.days && Object.keys(exerciseDatabase).length > 0) {
        const completedHistory = await storage.getCompletedHistory();
        const exerciseIds = new Set();

        // Collect unique non-custom exercise IDs from active split
        for (const day of activeSplit.days) {
          if (day.isRest || !day.exercises) continue;
          for (const ex of day.exercises) {
            const id = String(ex.exerciseId || ex.id);
            if (id.startsWith('custom_')) continue;
            if (exerciseDatabase[id]) {
              exerciseIds.add(id);
            }
          }
        }

        // Fetch backend workout sessions for historical data
        let backendSessions = [];
        if (user?.id) {
          try {
            backendSessions = await getWorkoutSessionsByUserId(user.id) || [];
          } catch {
            // Backend unavailable, use local only
          }
        }

        // Calculate 1RM data for each exercise from both sources
        const oneRMResults = [];
        for (const exerciseId of exerciseIds) {
          const exerciseInfo = exerciseDatabase[exerciseId];
          if (!exerciseInfo) continue;

          const dataPointsByDate = {};

          // Local completed history (uses exerciseId)
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

          // Backend sessions (uses exerciseTemplateId)
          for (const session of backendSessions) {
            if (!session.exercises || !session.completedAt) continue;
            const match = session.exercises.find(
              e => String(e.exerciseTemplateId) === exerciseId
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

          const dataPoints = Object.entries(dataPointsByDate)
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => a.date.localeCompare(b.date));

          oneRMResults.push({
            exerciseId,
            exerciseName: exerciseInfo.name,
            data: dataPoints,
          });
        }

        setExerciseOneRMData(oneRMResults);
      } else {
        setExerciseOneRMData([]);
      }
    } catch (error) {
      console.error('[ProgressScreen] Error loading data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, activeSplit, exerciseDatabase]);

  // Reload data when tab is focused
  useFocusEffect(
    useCallback(() => {
      setRefreshing(true);
      loadData();
    }, [loadData])
  );

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

        {/* Strength Progress Section */}
        {activeSplit && exerciseOneRMData.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Strength Progress</Text>
            {exerciseOneRMData.map((exercise) => (
              <ExerciseOneRMCard
                key={exercise.exerciseId}
                exerciseName={exercise.exerciseName}
                data={exercise.data}
              />
            ))}
          </>
        )}

        {/* Empty state for no active split */}
        {!activeSplit && (
          <EmptyState
            icon="barbell-outline"
            title="No active split"
            message="Set up a workout split to track your strength progress"
          />
        )}
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
});
