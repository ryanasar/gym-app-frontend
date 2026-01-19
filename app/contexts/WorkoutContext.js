import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { initializeApp, storage } from '../../storage/index.js';

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  // State from storage layer
  const [activeSplit, setActiveSplit] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(3);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [lastWorkoutCompleted, setLastWorkoutCompleted] = useState(null);
  const [lastCompletionDate, setLastCompletionDate] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [todaysWorkoutCompleted, setTodaysWorkoutCompleted] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState(null);
  const [exerciseDatabase, setExerciseDatabase] = useState({});

  // Helper function to validate and fix exerciseIds in split
  const validateAndFixSplitExercises = (split, exerciseMap) => {
    // Create a name-to-id map for fallback matching
    const nameToIdMap = {};
    Object.values(exerciseMap).forEach(ex => {
      nameToIdMap[ex.name.toLowerCase()] = ex.id;
    });

    let needsUpdate = false;
    const updatedDays = split.days?.map(day => {
      if (day.isRest || !day.exercises) return day;

      const validatedExercises = day.exercises.map(ex => {
        // Normalize exerciseId - handle both exerciseId and id field names
        const rawId = ex.exerciseId || ex.id;
        const exerciseIdStr = String(rawId);
        const exerciseIdNum = parseInt(rawId);

        // Ensure targetSets, targetReps, and restSeconds have valid values
        const targetSets = parseInt(ex.targetSets) || parseInt(ex.sets) || 3;
        const targetReps = parseInt(ex.targetReps) || parseInt(ex.reps) || 10;
        const restSeconds = parseInt(ex.restSeconds) || 0;

        // Check if values were missing and need fixing
        if (!ex.targetSets || !ex.targetReps || !ex.exerciseId) {
          needsUpdate = true;
        }

        // Check if this exerciseId exists in local database (try both string and number)
        if (exerciseMap[exerciseIdStr] || exerciseMap[exerciseIdNum]) {
          return { ...ex, exerciseId: exerciseIdStr, targetSets, targetReps, restSeconds };
        }

        // Exercise ID not found - try to match by name
        if (ex.name) {
          const matchedId = nameToIdMap[ex.name.toLowerCase()];
          if (matchedId) {
            needsUpdate = true;
            return { ...ex, exerciseId: String(matchedId), targetSets, targetReps, restSeconds };
          }
        }

        // Could not match - keep original but flag for update
        needsUpdate = true;
        return { ...ex, exerciseId: exerciseIdStr, targetSets, targetReps, restSeconds };
      }).filter(ex => {
        // Filter out exercises that couldn't be matched and don't exist
        const idStr = String(ex.exerciseId);
        const idNum = parseInt(ex.exerciseId);
        return exerciseMap[idStr] || exerciseMap[idNum];
      });

      return { ...day, exercises: validatedExercises };
    });

    if (needsUpdate) {
      return { ...split, days: updatedDays, needsSave: true };
    }
    return split;
  };

  // Initialize app with storage layer
  useEffect(() => {
    const initializeWorkoutContext = async () => {
      try {

        // Initialize the storage layer
        const appState = await initializeApp();

        // Load exercise database for mapping IDs to names
        const exercises = await storage.getExercises();
        const exerciseMap = {};
        exercises.forEach(ex => {
          exerciseMap[ex.id] = ex;
        });
        setExerciseDatabase(exerciseMap);

        if (appState.split) {
          // Use split from storage

          // Check if split needs migration from old format
          if (appState.split.workoutDays && !appState.split.days) {
            const migratedSplit = {
              ...appState.split,
              days: appState.split.workoutDays.map((day, index) => ({
                dayIndex: index,
                name: day.name || day.workoutName,
                type: day.type || day.workoutType,
                emoji: day.emoji,
                isRest: day.isRest || false,
                exercises: (day.exercises || [])
                  .map(ex => {
                    // Normalize exerciseId to a number to match local database
                    const rawId = ex.id || ex.exerciseId || ex.name;
                    const exerciseId = parseInt(rawId) || rawId;
                    return {
                      exerciseId: exerciseId,
                      targetSets: parseInt(ex.sets || ex.targetSets) || 3,
                      targetReps: parseInt(ex.reps || ex.targetReps) || 10,
                      restSeconds: parseInt(ex.restSeconds) || 0,
                    };
                  })
                  .filter(ex => ex.exerciseId && ex.exerciseId !== 'undefined'), // Filter out invalid exercises
              })),
            };
            delete migratedSplit.workoutDays;

            // Validate and fix exercise IDs
            const validatedSplit = validateAndFixSplitExercises(migratedSplit, exerciseMap);
            if (validatedSplit.needsSave) {
              await storage.saveSplit(validatedSplit);
            } else {
              await storage.saveSplit(migratedSplit);
            }
            setActiveSplit(validatedSplit);
          } else {
            // Validate exercise IDs match local database
            const validatedSplit = validateAndFixSplitExercises(appState.split, exerciseMap);

            if (validatedSplit.needsSave) {
              await storage.saveSplit(validatedSplit);
            }

            // Check if the split is corrupted (has invalid exercises)
            const hasCorruptedExercises = validatedSplit.days?.some(day =>
              day.exercises?.some(ex => !ex.exerciseId || ex.exerciseId === 'undefined' || ex.targetSets === undefined)
            );

            if (hasCorruptedExercises && validatedSplit.userId) {
              try {
                const { reloadSplitFromBackend } = await import('../utils/clearLocalSplit');
                const reloadedSplit = await reloadSplitFromBackend(validatedSplit.id, validatedSplit.userId);

                if (reloadedSplit) {
                  // Validate the reloaded split too
                  const revalidatedSplit = validateAndFixSplitExercises(reloadedSplit, exerciseMap);
                  if (revalidatedSplit.needsSave) {
                    await storage.saveSplit(revalidatedSplit);
                  }
                  setActiveSplit(revalidatedSplit);
                } else {
                  setActiveSplit(validatedSplit);
                }
              } catch (error) {
                setActiveSplit(validatedSplit);
              }
            } else {
              setActiveSplit(validatedSplit);
            }
          }
        } else {
          // No split in storage - leave as null
          setActiveSplit(null);
        }

        // Only load progress if we have an active split
        if (appState.split) {
          const savedWeek = await AsyncStorage.getItem('currentWeek');
          const savedDayIndex = await AsyncStorage.getItem('currentDayIndex');
          const savedCompletionDate = await AsyncStorage.getItem('lastCompletionDate');
          const savedLastCheckDate = await AsyncStorage.getItem('lastCheckDate');
          const savedSessionId = await AsyncStorage.getItem('completedSessionId');

          let currentWeekValue = savedWeek ? parseInt(savedWeek) : 1;
          let currentDayValue = savedDayIndex ? parseInt(savedDayIndex) : 0;

          setCurrentWeek(currentWeekValue);
          setCurrentDayIndex(currentDayValue);
          if (savedCompletionDate) setLastCompletionDate(savedCompletionDate);

          // Check if we need to advance to next day (existing logic)
          const today = getLocalDateString();

          // MIGRATION: Fix any UTC dates stored before the timezone fix
          // If stored date is in the future (UTC vs local timezone issue), reset to today
          let dateToCheck = savedLastCheckDate;
          const hadFutureDateBug = dateToCheck && dateToCheck > today;

          if (hadFutureDateBug) {
            dateToCheck = today;
            await AsyncStorage.setItem('lastCheckDate', today);

            // If completion date is also in future, it means the workout might have been
            // incorrectly advanced. Reset completion date to today.
            if (savedCompletionDate && savedCompletionDate > today) {
              await AsyncStorage.setItem('lastCompletionDate', today);
              setLastCompletionDate(today);

              // If today's workout was marked complete but day index advanced incorrectly,
              // go back one day to fix it
              if (currentDayValue > 0) {
                currentDayValue = currentDayValue - 1;
                setCurrentDayIndex(currentDayValue);
                await AsyncStorage.setItem('currentDayIndex', currentDayValue.toString());
              } else if (currentDayValue === 0 && currentWeekValue > 1) {
                // If we're on day 0, go back to last day of previous week
                const totalDays = appState.split?.totalDays || 6;
                currentDayValue = totalDays - 1;
                currentWeekValue = currentWeekValue - 1;
                setCurrentDayIndex(currentDayValue);
                setCurrentWeek(currentWeekValue);
                await AsyncStorage.setItem('currentDayIndex', currentDayValue.toString());
                await AsyncStorage.setItem('currentWeek', currentWeekValue.toString());
              }
            }
          }

          if (!dateToCheck && savedCompletionDate) {
            dateToCheck = savedCompletionDate;
          }

          if (dateToCheck && dateToCheck < today) {
            const daysSinceLastCheck = calculateDaysBetween(dateToCheck, today);

            for (let i = 0; i < daysSinceLastCheck; i++) {
              const nextDayIndex = (currentDayValue + 1) % appState.split.totalDays;
              currentDayValue = nextDayIndex;

              if (nextDayIndex === 0) {
                currentWeekValue = currentWeekValue + 1;
              }
            }

            setCurrentDayIndex(currentDayValue);
            setCurrentWeek(currentWeekValue);
            await AsyncStorage.setItem('currentDayIndex', currentDayValue.toString());
            await AsyncStorage.setItem('currentWeek', currentWeekValue.toString());

            setTodaysWorkoutCompleted(false);
            setCompletedSessionId(null);
            await AsyncStorage.removeItem('completedSessionId');
          } else if (savedCompletionDate === today && savedLastCheckDate === today && savedSessionId) {
            // Restore today's completion state if workout was completed today
            setTodaysWorkoutCompleted(true);
            setCompletedSessionId(parseInt(savedSessionId));
          }

          await AsyncStorage.setItem('lastCheckDate', today);
        }

        setIsInitialized(true);

      } catch (error) {
        console.error('[WorkoutContext] Failed to initialize:', error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking UI
      }
    };

    initializeWorkoutContext();
  }, []);

  // Helper to get today's date in local timezone (YYYY-MM-DD format)
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to calculate days between dates
  const calculateDaysBetween = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check for date changes while app is open
  useEffect(() => {
    if (!isInitialized || !activeSplit) return;

    const checkDateChange = async () => {
      try {
        const savedLastCheckDate = await AsyncStorage.getItem('lastCheckDate');
        const today = getLocalDateString();

        if (savedLastCheckDate && savedLastCheckDate < today) {
          const daysSinceLastCheck = calculateDaysBetween(savedLastCheckDate, today);

          for (let i = 0; i < daysSinceLastCheck; i++) {
            await advanceToNextDay();
          }

          setTodaysWorkoutCompleted(false);
          setCompletedSessionId(null);
          await AsyncStorage.removeItem('completedSessionId');
          await AsyncStorage.setItem('lastCheckDate', today);
        }
      } catch (error) {
        console.error('[WorkoutContext] Error checking date change:', error);
      }
    };

    checkDateChange();
    const interval = setInterval(checkDateChange, 60000);

    return () => clearInterval(interval);
  }, [isInitialized, activeSplit, currentDayIndex]);

  // Calculate today's workout
  const getTodaysWorkout = useCallback(() => {
    // Return null if no active split - show empty state in UI
    if (!activeSplit || !activeSplit.days) {
      return null;
    }

    const todaysDayIndex = currentDayIndex % activeSplit.totalDays;
    const todaysWorkoutDay = activeSplit.days[todaysDayIndex];

    if (!todaysWorkoutDay) return null;

    // Handle rest days
    if (todaysWorkoutDay.isRest) {
      return {
        title: `Rest Day — Week ${currentWeek} Day ${todaysDayIndex + 1}`,
        dayName: 'Rest Day',
        type: 'rest',
        isRest: true,
        exercises: [],
        weekNumber: currentWeek,
        dayNumber: todaysDayIndex + 1,
        totalDays: activeSplit.totalDays,
        splitId: activeSplit.id,
      };
    }

    const workoutName = todaysWorkoutDay.name || todaysWorkoutDay.workoutName || `Day ${todaysDayIndex + 1}`;
    const workoutType = todaysWorkoutDay.type || todaysWorkoutDay.workoutType;

    // Convert new storage format (exerciseId, targetSets, targetReps) to UI format (name, sets, reps)
    const exercises = (todaysWorkoutDay.exercises || []).map(exercise => {
      // If it's already in the old format (has 'name' property), return as-is
      if (exercise.name) {
        return exercise;
      }

      // New format: has exerciseId, targetSets, targetReps
      // Look up the exercise name from the exercise database
      // Convert exerciseId to string for consistent lookup (database stores IDs as strings)
      const exerciseIdStr = String(exercise.exerciseId);
      const exerciseData = exerciseDatabase[exerciseIdStr] || exerciseDatabase[exercise.exerciseId];
      const exerciseName = exerciseData?.name || `Exercise ${exercise.exerciseId}`;

      return {
        name: exerciseName,
        sets: exercise.targetSets?.toString() || '3',
        reps: exercise.targetReps?.toString() || '10',
        restSeconds: exercise.restSeconds || 0,
        id: exercise.exerciseId,
      };
    });

    return {
      title: `${workoutName} — Week ${currentWeek} Day ${todaysDayIndex + 1}`,
      dayName: workoutName,
      type: workoutType,
      exercises,
      weekNumber: currentWeek,
      dayNumber: todaysDayIndex + 1,
      totalDays: activeSplit.totalDays,
      splitId: activeSplit.id,
      emoji: todaysWorkoutDay.emoji,
    };
  }, [activeSplit, currentWeek, currentDayIndex, exerciseDatabase]);

  // Advance to next workout day
  const advanceToNextDay = async (splitToUse = null) => {
    const split = splitToUse || activeSplit;
    if (!split || !split.totalDays) {
      console.error('[WorkoutContext] Cannot advance day - no active split');
      return;
    }

    const nextDayIndex = (currentDayIndex + 1) % split.totalDays;
    setCurrentDayIndex(nextDayIndex);

    let newWeek = currentWeek;
    if (nextDayIndex === 0) {
      newWeek = currentWeek + 1;
      setCurrentWeek(newWeek);
    }

    try {
      await AsyncStorage.setItem('currentDayIndex', nextDayIndex.toString());
      await AsyncStorage.setItem('currentWeek', newWeek.toString());
    } catch (error) {
      console.error('[WorkoutContext] Failed to save workout progress:', error);
    }
  };

  // Set specific day
  const setCurrentDay = async (dayIndex, weekNumber = currentWeek) => {
    setCurrentDayIndex(dayIndex);
    setCurrentWeek(weekNumber);

    try {
      await AsyncStorage.setItem('currentDayIndex', dayIndex.toString());
      await AsyncStorage.setItem('currentWeek', weekNumber.toString());
    } catch (error) {
      console.error('[WorkoutContext] Failed to save workout progress:', error);
    }
  };

  // Change active split
  const changeActiveSplit = async (newSplit) => {
    try {
      // Reset the previous split's started status
      if (activeSplit && activeSplit.id) {
        try {
          const { updateSplit } = await import('../api/splitsApi');
          await updateSplit(activeSplit.id, { started: false });
        } catch (error) {
          console.error('[WorkoutContext] Failed to reset previous split started status:', error);
          // Continue anyway - this is not critical
        }
      }

      setActiveSplit(newSplit);
      setCurrentDayIndex(0);
      setCurrentWeek(1);

      if (newSplit) {
        await storage.saveSplit(newSplit);
        await AsyncStorage.setItem('currentDayIndex', '0');
        await AsyncStorage.setItem('currentWeek', '1');
      } else {
        // Clear split data when null
        await AsyncStorage.removeItem('@gymvy_active_split');
        await AsyncStorage.removeItem('currentDayIndex');
        await AsyncStorage.removeItem('currentWeek');
      }
      await AsyncStorage.removeItem('lastCompletionDate');
    } catch (error) {
      console.error('[WorkoutContext] Failed to change split:', error);
    }
  };

  // Update active split
  const updateActiveSplit = async (updatedSplit) => {
    setActiveSplit(updatedSplit);

    try {
      await storage.saveSplit(updatedSplit);
    } catch (error) {
      console.error('[WorkoutContext] Failed to update active split:', error);
    }
  };

  // Mark workout as completed
  const markWorkoutCompleted = async (workoutSessionId, isRestDay = false) => {
    const today = getLocalDateString();

    try {
      // First, complete all storage operations
      await AsyncStorage.setItem('lastCompletionDate', today);
      await AsyncStorage.setItem('lastCheckDate', today);
      if (workoutSessionId) {
        await AsyncStorage.setItem('completedSessionId', workoutSessionId.toString());

        // Mark today as completed in calendar
        const { markTodayCompleted } = await import('../../storage/calendarStorage.js');
        await markTodayCompleted(isRestDay);
      } else {
        await AsyncStorage.removeItem('completedSessionId');

        // Unmark today in calendar (uncomplete)
        const { unmarkTodayCompleted } = await import('../../storage/calendarStorage.js');
        await unmarkTodayCompleted();
      }

      // Then update state (triggers ProgressTab refresh after calendar is updated)
      setLastWorkoutCompleted({
        sessionId: workoutSessionId,
        timestamp: new Date().toISOString(),
      });

      setLastCompletionDate(today);
      setTodaysWorkoutCompleted(workoutSessionId !== null);
      setCompletedSessionId(workoutSessionId);
    } catch (error) {
      console.error('[WorkoutContext] Failed to save completion date:', error);
    }
  };

  // Check today's workout status
  const checkTodaysWorkoutStatus = async (userId) => {
    if (!userId) return;

    try {
      const savedCompletionDate = await AsyncStorage.getItem('lastCompletionDate');
      const savedSessionId = await AsyncStorage.getItem('completedSessionId');
      const savedLastCheckDate = await AsyncStorage.getItem('lastCheckDate');
      const today = getLocalDateString();

      if (savedCompletionDate === today && savedLastCheckDate === today && savedSessionId) {
        setTodaysWorkoutCompleted(true);
        setCompletedSessionId(parseInt(savedSessionId));
        return true;
      } else {
        setTodaysWorkoutCompleted(false);
        setCompletedSessionId(null);
        return false;
      }
    } catch (error) {
      console.error('[WorkoutContext] Failed to check workout status:', error);
      return false;
    }
  };

  // Memoize today's workout to prevent unnecessary recalculations
  const todaysWorkout = useMemo(() => {
    return getTodaysWorkout();
  }, [getTodaysWorkout]);

  // Refresh today's workout from local storage
  const refreshTodaysWorkout = useCallback(async () => {
    try {
      // Re-read split from local storage
      const localSplit = await storage.getSplit();
      setActiveSplit(localSplit); // Set to null if no split found

      if (localSplit) {
        // Re-read progress from local storage
        const savedWeek = await AsyncStorage.getItem('currentWeek');
        const savedDayIndex = await AsyncStorage.getItem('currentDayIndex');

        if (savedWeek) {
          setCurrentWeek(parseInt(savedWeek, 10));
        }
        if (savedDayIndex) {
          setCurrentDayIndex(parseInt(savedDayIndex, 10));
        }

        // Re-check today's workout status
        await checkTodaysWorkoutStatus();
      }
    } catch (error) {
      console.error('[WorkoutContext] Error refreshing from local storage:', error);
    }
  }, [checkTodaysWorkoutStatus]);

  const value = {
    activeSplit,
    setActiveSplit,
    currentWeek,
    currentDayIndex,
    getTodaysWorkout,
    advanceToNextDay,
    setCurrentDay,
    changeActiveSplit,
    updateActiveSplit,
    todaysWorkout,
    lastWorkoutCompleted,
    markWorkoutCompleted,
    todaysWorkoutCompleted,
    completedSessionId,
    checkTodaysWorkoutStatus,
    refreshTodaysWorkout,
    isInitialized,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};

export default WorkoutProvider;
