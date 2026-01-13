/**
 * Workout Helper Functions
 * Local-first workout operations that work offline
 */

import { storage } from './StorageAdapter.js';

/**
 * Generates a unique ID for a workout session
 * @returns {string}
 */
export function generateWorkoutId() {
  return `workout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Builds a workout session from a split and day index
 * @param {import('../types/storage').Split} split
 * @param {number} dayIndex
 * @returns {import('../types/storage').WorkoutExercise[]}
 */
export function buildWorkoutFromSplit(split, dayIndex) {
  const day = split.days[dayIndex];

  if (!day || day.isRest) {
    console.log('[WorkoutHelpers] Day is rest or not found:', { dayIndex, isRest: day?.isRest });
    return [];
  }

  if (!day.exercises || day.exercises.length === 0) {
    console.warn('[WorkoutHelpers] Day has no exercises:', { dayIndex, dayName: day.name });
    return [];
  }

  const exercises = day.exercises.map(splitExercise => {
    const targetSets = splitExercise.targetSets || 0;
    const targetReps = splitExercise.targetReps || 0;

    if (targetSets === 0) {
      console.warn('[WorkoutHelpers] Exercise has 0 target sets:', {
        exerciseId: splitExercise.exerciseId,
        targetSets: splitExercise.targetSets,
        targetReps: splitExercise.targetReps
      });
    }

    return {
      exerciseId: splitExercise.exerciseId,
      sets: Array.from({ length: targetSets }, (_, i) => ({
        setIndex: i,
        reps: targetReps,
        weight: 0,
        completed: false,
      })),
    };
  });

  console.log('[WorkoutHelpers] Built workout:', {
    dayIndex,
    exerciseCount: exercises.length,
    totalSets: exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  });

  return exercises;
}

/**
 * Starts a new workout session (offline-safe)
 * @param {string} splitId
 * @param {number} dayIndex
 * @returns {Promise<import('../types/storage').WorkoutSession>}
 */
export async function startWorkout(splitId, dayIndex) {
  // Get the split from local storage
  const split = await storage.getSplit();

  if (!split) {
    throw new Error('No active split found. Please select a split first.');
  }

  if (split.id !== splitId) {
    throw new Error('Split ID mismatch');
  }

  // Check if there's already an active workout
  const existingWorkout = await storage.getActiveWorkout();
  if (existingWorkout) {
    return existingWorkout;
  }

  // Build the workout session
  const workout = {
    id: generateWorkoutId(),
    splitId,
    dayIndex,
    startedAt: Date.now(),
    exercises: buildWorkoutFromSplit(split, dayIndex),
    pendingSync: true,
  };

  // Save to local storage
  await storage.saveActiveWorkout(workout);

  return workout;
}

/**
 * Updates a set in the active workout
 * @param {string} workoutId
 * @param {string} exerciseId
 * @param {number} setIndex
 * @param {Partial<import('../types/storage').WorkoutSet>} data
 * @returns {Promise<void>}
 */
export async function updateWorkoutSet(workoutId, exerciseId, setIndex, data) {
  const workout = await storage.getActiveWorkout();

  if (!workout || workout.id !== workoutId) {
    throw new Error('No matching active workout found');
  }

  // Find the exercise
  const exercise = workout.exercises.find(e => e.exerciseId === exerciseId);
  if (!exercise) {
    throw new Error(`Exercise ${exerciseId} not found in workout`);
  }

  // Find the set
  const set = exercise.sets[setIndex];
  if (!set) {
    throw new Error(`Set ${setIndex} not found for exercise ${exerciseId}`);
  }

  // Update the set
  Object.assign(set, data);

  // Save immediately to local storage
  await storage.saveActiveWorkout(workout);
}

/**
 * Completes the active workout and moves it to pending sync
 * @param {string} workoutId
 * @returns {Promise<void>}
 */
export async function completeWorkout(workoutId) {
  await storage.completeWorkout(workoutId);
}

/**
 * Gets the current active workout
 * @returns {Promise<import('../types/storage').WorkoutSession | null>}
 */
export async function getActiveWorkout() {
  return storage.getActiveWorkout();
}

/**
 * Cancels/abandons the active workout without saving to history
 * IMPORTANT: This only clears the active workout session, not the split data
 * @param {string} workoutId
 * @returns {Promise<void>}
 */
export async function cancelWorkout(workoutId) {
  const workout = await storage.getActiveWorkout();

  if (!workout || workout.id !== workoutId) {
    return; // Don't throw, just return gracefully
  }

  // Only clear the active workout - split data remains untouched
  await storage.clearActiveWorkout();
}

/**
 * Calculates current workout streak from local calendar storage
 * Rest days preserve the streak but don't increase it
 * Only workout days increase the streak count
 * @returns {Promise<number>}
 */
export async function calculateStreakFromLocal() {
  try {
    // Import calendar storage functions
    const { getCalendarData } = await import('./calendarStorage.js');
    const calendarData = await getCalendarData();

    if (Object.keys(calendarData).length === 0) return 0;

    // Get today's date string
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Sort all dates in descending order (most recent first)
    const sortedDates = Object.keys(calendarData)
      .filter(dateStr => calendarData[dateStr].completed)
      .sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) return 0;

    // Check if the most recent activity is today or yesterday
    const mostRecentDate = new Date(sortedDates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);
    const daysSinceMostRecent = Math.floor((today - mostRecentDate) / (1000 * 60 * 60 * 24));

    // Streak is broken if there's a 2+ day gap
    if (daysSinceMostRecent >= 2) {
      return 0;
    }

    // Count consecutive workout days (rest days don't count but don't break streak)
    let streakCount = 0;
    let currentDate = mostRecentDate;

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));

      // If there's a gap of 2+ days, streak is broken
      if (dayDiff >= 2) {
        break;
      }

      // Only count workout days (not rest days) toward streak
      if (!calendarData[dateStr].isRestDay) {
        streakCount++;
      }

      currentDate = date;
    }

    return streakCount;
  } catch (error) {
    console.error('[Streak] Error calculating streak:', error);
    return 0;
  }
}
