/**
 * Sync Service - Background sync for pending workouts
 * Handles uploading local workouts to the backend when online
 */

import { storage } from './StorageAdapter.js';
import { createWorkoutSession } from '../app/api/workoutSessionsApi.js';

/**
 * Network status check
 * @returns {Promise<boolean>}
 */
export async function checkNetworkStatus() {
  // In React Native, we could use @react-native-community/netinfo
  // For now, we'll try a simple fetch to detect connectivity
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Converts local workout format to API format
 * @param {import('../types/storage').WorkoutSession} workout
 * @param {string} userId
 * @returns {object}
 */
function convertWorkoutToApiFormat(workout, userId) {
  // Filter out exercises that don't have a name or have no sets
  const validExercises = workout.exercises
    .filter(exercise => {
      const hasName = exercise.exerciseName || exercise.exerciseId;
      const hasSets = exercise.sets && exercise.sets.length > 0;

      if (!hasName || !hasSets) {
        console.warn('[Sync] Filtering out invalid exercise:', {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          setCount: exercise.sets?.length || 0
        });
        return false;
      }
      return true;
    })
    .map((exercise) => ({
      name: exercise.exerciseName || exercise.exerciseId,
      templateId: null,
      notes: null,
      sets: exercise.sets.map(set => ({
        setNumber: set.setIndex + 1,
        weight: set.weight || null,
        reps: set.reps || null,
        completed: set.completed
      }))
    }));

  return {
    userId: userId,
    splitId: workout.splitId || null,
    dayName: workout.dayName || 'Workout',
    weekNumber: null,
    dayNumber: workout.dayIndex + 1,
    notes: null,
    completedAt: workout.completedAt,
    exercises: validExercises
  };
}

/**
 * Syncs a single workout to the backend
 * @param {import('../types/storage').WorkoutSession} workout
 * @param {string} userId
 * @returns {Promise<{success: boolean, error?: any, shouldRetry?: boolean}>}
 */
async function syncWorkout(workout, userId) {
  try {
    // Load exercise database to get exercise names
    const exercises = await storage.getExercises();

    if (!exercises || exercises.length === 0) {
      console.warn('[Sync] Exercise database is empty! Cannot enrich workout with names.');
    }

    const exerciseMap = {};
    exercises.forEach(ex => {
      exerciseMap[ex.id] = ex;
    });

    // Enrich workout with exercise names
    const enrichedWorkout = {
      ...workout,
      exercises: workout.exercises.map(ex => {
        const exerciseName = exerciseMap[ex.exerciseId]?.name || ex.exerciseId;

        // Log if exercise ID is not found in database
        if (!exerciseMap[ex.exerciseId] && ex.exerciseId) {
          console.warn('[Sync] Exercise not found in database:', {
            exerciseId: ex.exerciseId,
            availableExercises: exercises.length,
            fallbackName: exerciseName
          });
        }

        return {
          ...ex,
          exerciseName
        };
      })
    };

    const apiData = convertWorkoutToApiFormat(enrichedWorkout, userId);

    // Log the data being sent for debugging
    console.log('[Sync] Syncing workout:', {
      id: workout.id,
      dayName: workout.dayName,
      originalExerciseCount: workout.exercises.length,
      validExerciseCount: apiData.exercises.length
    });

    // Don't sync workouts with no valid exercises
    if (apiData.exercises.length === 0) {
      console.warn('[Sync] Skipping workout with no valid exercises:', workout.id);
      return {
        success: false,
        error: new Error('Workout has no valid exercises'),
        shouldRetry: false
      };
    }

    const result = await createWorkoutSession(apiData);

    // Store the database ID mapping
    if (result && result.id) {
      await storage.setWorkoutDatabaseId(workout.id, result.id);
    }

    return { success: true, result };
  } catch (error) {
    // Check if it's a server error (5xx) - don't retry these
    const statusCode = error.response?.status;
    const shouldRetry = !statusCode || statusCode < 500 || statusCode >= 600;

    console.error('[Sync] Failed to sync workout:', {
      workoutId: workout.id,
      statusCode,
      message: error.response?.data?.error || error.message,
      shouldRetry
    });

    return { success: false, error, shouldRetry };
  }
}

/**
 * Syncs all pending workouts to the backend
 * @param {string} userId
 * @returns {Promise<{synced: number, failed: number, errors: any[]}>}
 */
export async function syncPendingWorkouts(userId) {
  if (!userId) {
    return { synced: 0, failed: 0, errors: [] };
  }

  // Check network status first
  const isOnline = await checkNetworkStatus();
  if (!isOnline) {
    return { synced: 0, failed: 0, errors: [] };
  }

  const pendingWorkouts = await storage.getPendingWorkouts();

  if (pendingWorkouts.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (const workout of pendingWorkouts) {
    // Skip rest days - they're already posted via RestDayPostModal
    if (workout.type === 'rest_day' || workout.id?.startsWith('rest-')) {
      console.log('[Sync] Skipping rest day, marking as synced:', workout.id);
      await storage.markWorkoutSynced(workout.id);
      synced++;
      continue;
    }

    const result = await syncWorkout(workout, userId);

    if (result.success) {
      // Mark as synced and remove from pending queue
      await storage.markWorkoutSynced(workout.id);
      synced++;
    } else {
      // If this is a server error (5xx) that shouldn't be retried,
      // mark it as synced to prevent infinite retry loop
      if (result.shouldRetry === false) {
        console.warn('[Sync] Marking workout as synced to prevent infinite retry:', workout.id);
        await storage.markWorkoutSynced(workout.id);
      }

      failed++;
      errors.push({
        workoutId: workout.id,
        error: result.error,
        statusCode: result.error?.response?.status
      });
    }
  }

  return { synced, failed, errors };
}

/**
 * Attempts to sync in the background (non-blocking)
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function backgroundSync(userId) {
  try {
    await syncPendingWorkouts(userId);
  } catch (error) {
    // Don't throw - background sync should fail silently
  }
}

/**
 * Gets sync status info
 * @returns {Promise<{pendingCount: number, hasInternet: boolean}>}
 */
export async function getSyncStatus() {
  try {
    const pending = await storage.getPendingWorkouts();
    const isOnline = await checkNetworkStatus();

    return {
      pendingCount: pending.length,
      hasInternet: isOnline
    };
  } catch (error) {
    return {
      pendingCount: 0,
      hasInternet: false
    };
  }
}
