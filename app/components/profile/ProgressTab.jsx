import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { getWorkoutSessionsByUserId } from '../../api/workoutSessionsApi';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useWorkout } from '../../contexts/WorkoutContext';
import { useAuth } from '../../auth/auth';
import { getCalendarDataForDisplay, backfillCalendarFromBackend } from '../../../storage/calendarStorage';
import WorkoutCalendar from '../progress/WorkoutCalendar';

const ProgressTab = ({ userId }) => {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [workoutsByDay, setWorkoutsByDay] = useState([]);
  const { lastWorkoutCompleted, todaysWorkout } = useWorkout();
  const { user: currentUser } = useAuth();
  const isInitialMount = useRef(true);
  const isFetching = useRef(false);
  const hasBackfilled = useRef(false);

  // Determine if viewing own profile or another user's profile
  const isOwnProfile = currentUser?.id === userId;

  // Initial load - only fetch once with backend backfill
  useEffect(() => {
    if (userId && !hasBackfilled.current) {
      fetchProgressData(true);
    }
  }, [userId]);

  // Refresh data when workout is completed or uncompleted (skip initial mount)
  // Only refresh for OWN profile, not when viewing other users
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only refresh when viewing own profile and workout status changes
    if (userId && isOwnProfile) {
      // Only refresh from local storage, don't fetch from backend again
      fetchProgressData(false);
    }
  }, [lastWorkoutCompleted, isOwnProfile]);

  const fetchProgressData = async (includeBackend = false) => {
    // Prevent concurrent fetches
    if (isFetching.current) {
      return;
    }

    try {
      isFetching.current = true;
      setLoading(true);

      // Check if userId is valid
      if (!userId) {
        setWorkoutsByDay([]);
        return;
      }

      // For OTHER users' profiles: ONLY fetch from backend, never use local storage
      if (!isOwnProfile) {
        try {
          const sessions = await getWorkoutSessionsByUserId(userId);

          if (sessions && Array.isArray(sessions)) {
            // Convert backend sessions to calendar format
            const calendarData = sessions
              .filter(session => session.completedAt)
              .map(session => {
                const date = new Date(session.completedAt).toISOString().split('T')[0];
                const isRestDay = session.type === 'rest_day' ||
                                (session.exercises?.length === 0 && session.dayName === 'Rest Day');

                return {
                  date,
                  volume: isRestDay ? 0 : 1,
                  isRestDay: isRestDay
                };
              });

            setWorkoutsByDay(calendarData);
          } else {
            setWorkoutsByDay([]);
          }
        } catch (backendError) {
          console.error('[ProgressTab] Error fetching other user calendar:', backendError);
          setWorkoutsByDay([]);
        }
        return;
      }

      // For OWN profile: Use local storage + backend backfill (existing behavior)
      // Load calendar data from local storage first (instant)
      const localCalendarData = await getCalendarDataForDisplay();
      setWorkoutsByDay(localCalendarData);

      // Only fetch from backend on initial load
      if (includeBackend && !hasBackfilled.current) {
        try {
          const sessions = await getWorkoutSessionsByUserId(userId);

          if (sessions && Array.isArray(sessions)) {
            // Backfill calendar with backend data (doesn't overwrite today)
            await backfillCalendarFromBackend(sessions);
            hasBackfilled.current = true;

            // Reload calendar data after backfill
            const updatedCalendarData = await getCalendarDataForDisplay();
            setWorkoutsByDay(updatedCalendarData);
          }
        } catch (backendError) {
          // Continue with local data only
        }
      }

    } catch (error) {
      // Set empty data on error
      setWorkoutsByDay([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading progress data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Workout Calendar Section */}
      {/* Only show todaysWorkout for own profile, not for other users */}
      <WorkoutCalendar
        workoutsByDay={workoutsByDay}
        todaysWorkout={isOwnProfile ? todaysWorkout : null}
      />
    </ScrollView>
  );
};

export default ProgressTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
});
