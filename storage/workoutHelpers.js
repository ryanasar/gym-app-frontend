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
    return [];
  }

  if (!day.exercises || day.exercises.length === 0) {
    return [];
  }

  const exercises = day.exercises.map(splitExercise => {
    const targetSets = parseInt(splitExercise.targetSets) || parseInt(splitExercise.sets) || 3;
    const targetReps = parseInt(splitExercise.targetReps) || parseInt(splitExercise.reps) || 10;
    const restSeconds = parseInt(splitExercise.restSeconds) || 0;

    // Ensure exerciseId is a number to match the local database (fall back to id if exerciseId not present)
    const rawId = splitExercise.exerciseId || splitExercise.id;
    const exerciseId = parseInt(rawId) || rawId;

    return {
      exerciseId: exerciseId,
      restSeconds: restSeconds,
      sets: Array.from({ length: targetSets }, (_, i) => ({
        setIndex: i,
        reps: targetReps,
        weight: 0,
        completed: false,
      })),
    };
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

  // Validate day exists and has exercises
  const day = split.days?.[dayIndex];
  if (!day) {
    throw new Error(`Day ${dayIndex} not found in split`);
  }

  if (day.isRest) {
    throw new Error('Cannot start workout on a rest day');
  }

  // Validate exercises have required fields and fix if needed
  let needsUpdate = false;
  const validatedExercises = (day.exercises || []).map(ex => {
    const targetSets = parseInt(ex.targetSets) || parseInt(ex.sets) || 3;
    const targetReps = parseInt(ex.targetReps) || parseInt(ex.reps) || 10;
    const restSeconds = parseInt(ex.restSeconds) || 0;

    // Handle both exerciseId and id field names
    const rawId = ex.exerciseId || ex.id;
    const exerciseId = parseInt(rawId) || rawId;

    if (targetSets !== ex.targetSets || targetReps !== ex.targetReps || exerciseId !== ex.exerciseId) {
      needsUpdate = true;
    }

    return {
      ...ex,
      exerciseId,
      targetSets,
      targetReps,
      restSeconds
    };
  });

  // If we fixed the data, update the split in memory and save it
  let workingSplit = split;
  if (needsUpdate) {
    const updatedDays = [...split.days];
    updatedDays[dayIndex] = { ...day, exercises: validatedExercises };
    workingSplit = { ...split, days: updatedDays };
    await storage.saveSplit(workingSplit);
  }

  // Build the workout session
  const exercises = buildWorkoutFromSplit(workingSplit, dayIndex);

  // Validate the built workout has exercises with sets
  if (exercises.length === 0) {
    throw new Error('No exercises found for this workout day');
  }

  const hasInvalidExercises = exercises.some(ex => !ex.sets || ex.sets.length === 0);
  if (hasInvalidExercises) {
    throw new Error('Failed to build workout - exercises missing sets. Please check your split configuration.');
  }

  const workout = {
    id: generateWorkoutId(),
    splitId,
    dayIndex,
    startedAt: Date.now(),
    exercises,
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

  // Find the exercise - try multiple matching strategies
  // Convert exerciseId to both string and number for flexible matching
  const exerciseIdStr = String(exerciseId);
  const exerciseIdNum = parseInt(exerciseId);

  const exercise = workout.exercises.find(e => {
    const eIdStr = String(e.exerciseId);
    const eIdNum = parseInt(e.exerciseId);

    // Match if either string or numeric form matches
    return e.exerciseId === exerciseId ||
           eIdStr === exerciseIdStr ||
           (exerciseIdNum && eIdNum === exerciseIdNum);
  });

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
 * Starts a new freestyle workout session (no split, empty exercises)
 * @param {string} [workoutName] - Optional custom name for the workout
 * @returns {Promise<import('../types/storage').WorkoutSession>}
 */
export async function startFreestyleWorkout(workoutName = 'Freestyle Workout') {
  // Check if there's already an active workout
  const existingWorkout = await storage.getActiveWorkout();
  if (existingWorkout) {
    return existingWorkout;
  }

  const workout = {
    id: generateWorkoutId(),
    splitId: null,
    dayIndex: null,
    source: 'freestyle',
    workoutName: workoutName,
    startedAt: Date.now(),
    exercises: [],
    pendingSync: true,
  };

  // Save to local storage
  await storage.saveActiveWorkout(workout);

  return workout;
}

/**
 * Starts a workout session from a saved workout
 * @param {string} savedWorkoutId - The ID of the saved workout to start
 * @returns {Promise<import('../types/storage').WorkoutSession>}
 */
export async function startSavedWorkout(savedWorkoutId) {
  // Check if there's already an active workout
  const existingWorkout = await storage.getActiveWorkout();
  if (existingWorkout) {
    return existingWorkout;
  }

  // Get the saved workout from storage
  const savedWorkout = await storage.getSavedWorkout(savedWorkoutId);
  if (!savedWorkout) {
    throw new Error('Saved workout not found');
  }

  // Convert saved workout exercises to session format
  const exercises = (savedWorkout.exercises || []).map(savedExercise => {
    const targetSets = parseInt(savedExercise.targetSets) || parseInt(savedExercise.sets) || 3;
    const targetReps = parseInt(savedExercise.targetReps) || parseInt(savedExercise.reps) || 10;
    const restSeconds = parseInt(savedExercise.restSeconds) || 0;

    // Ensure exerciseId is a number to match the local database
    const rawId = savedExercise.exerciseId || savedExercise.id;
    const exerciseId = parseInt(rawId) || rawId;

    return {
      exerciseId: exerciseId,
      restSeconds: restSeconds,
      sets: Array.from({ length: targetSets }, (_, i) => ({
        setIndex: i,
        reps: targetReps,
        weight: 0,
        completed: false,
      })),
    };
  });

  const workout = {
    id: generateWorkoutId(),
    splitId: null,
    dayIndex: null,
    source: 'saved',
    savedWorkoutId: savedWorkoutId,
    workoutName: savedWorkout.name || 'Saved Workout',
    startedAt: Date.now(),
    exercises: exercises,
    pendingSync: true,
  };

  // Save to local storage
  await storage.saveActiveWorkout(workout);

  return workout;
}

/**
 * Creates and immediately completes a workout session from exercise data
 * Used for "Mark Complete" without going through the workout session screen
 * @param {Object} options - The workout options
 * @param {string} options.workoutName - Name of the workout
 * @param {Array} options.exercises - Array of exercises with name, sets, reps, exerciseId
 * @param {'saved' | 'freestyle'} options.source - Source of the workout
 * @param {string} [options.savedWorkoutId] - ID of the saved workout if source is 'saved'
 * @returns {Promise<string>} - The workout session ID
 */
export async function createCompletedWorkoutSession({ workoutName, exercises, source, savedWorkoutId }) {
  const workoutId = generateWorkoutId();

  // Convert exercises to session format with all sets marked as completed
  const sessionExercises = (exercises || []).map(exercise => {
    const targetSets = parseInt(exercise.sets) || parseInt(exercise.targetSets) || 3;
    const targetReps = parseInt(exercise.reps) || parseInt(exercise.targetReps) || 10;
    const exerciseId = exercise.exerciseId || exercise.id || exercise.name;
    // Include exercise name directly for syncing
    const exerciseName = exercise.name || exercise.exerciseName || exerciseId;

    return {
      exerciseId: exerciseId,
      exerciseName: exerciseName, // Include name for sync
      restSeconds: parseInt(exercise.restSeconds) || 0,
      sets: Array.from({ length: targetSets }, (_, i) => ({
        setIndex: i,
        reps: targetReps,
        weight: 0,
        completed: true, // Mark all sets as completed
      })),
    };
  });

  const workout = {
    id: workoutId,
    splitId: null,
    dayIndex: null,
    source: source || 'saved',
    savedWorkoutId: savedWorkoutId || null,
    workoutName: workoutName || 'Workout',
    dayName: workoutName || 'Workout', // Include dayName for sync compatibility
    startedAt: Date.now(),
    completedAt: Date.now(),
    exercises: sessionExercises,
    pendingSync: true,
  };

  // Add directly to pending workouts for sync (skip active workout step)
  await storage.addToPendingWorkouts(workout);

  // Add to completed history
  await storage.addToCompletedHistory(workout);

  return workoutId;
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

    // Get today's date string in local timezone (same format as calendarStorage)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

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
