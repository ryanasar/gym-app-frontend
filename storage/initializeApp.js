/**
 * App Initialization Logic
 * Handles offline-first startup and data hydration
 */

import { storage } from './StorageAdapter.js';
import { exercises as exerciseDatabase } from '../app/data/exercises/exerciseDatabase.js';

/**
 * Network status check (synchronous version for backward compatibility)
 * @returns {boolean}
 */
export function isOnline() {
  // For backward compatibility, assume online
  // Use checkNetworkStatus() from syncService for actual checks
  return true;
}

/**
 * Converts the existing exercise database to the new format
 * @returns {import('../types/storage').Exercise[]}
 */
function convertExercisesToStorageFormat() {
  return exerciseDatabase.map(exercise => ({
    id: exercise.id.toString(),
    name: exercise.name,
    primaryMuscles: exercise.primaryMuscles || [],
    secondaryMuscles: exercise.secondaryMuscles || [],
    equipment: exercise.equipment || 'unknown',
  }));
}

/**
 * Initializes the exercise database in local storage
 * @returns {Promise<void>}
 */
async function initializeExerciseDatabase() {
  // Always load from bundled database to ensure consistency
  // This ensures the app uses the local exerciseDatabase.js instead of backend data
  const exercises = convertExercisesToStorageFormat();
  await storage.saveExercises(exercises);
}

/**
 * @typedef {Object} AppState
 * @property {import('../types/storage').Split | null} split
 * @property {import('../types/storage').WorkoutSession | null} activeWorkout
 * @property {number} pendingWorkoutsCount
 * @property {boolean} isInitialized
 */

/**
 * Main app initialization function
 * Loads data from local storage first, syncs with backend when online
 * @returns {Promise<AppState>}
 */
export async function initializeApp() {
  try {
    // Initialize exercise database first
    await initializeExerciseDatabase();

    // Load split from local storage
    const localSplit = await storage.getSplit();

    // Load active workout
    const activeWorkout = await storage.getActiveWorkout();

    // Get pending workouts count
    const pendingWorkouts = await storage.getPendingWorkouts();

    return {
      split: localSplit,
      activeWorkout,
      pendingWorkoutsCount: pendingWorkouts.length,
      isInitialized: true,
    };
  } catch (error) {
    // Return safe defaults even if initialization fails
    return {
      split: null,
      activeWorkout: null,
      pendingWorkoutsCount: 0,
      isInitialized: false,
    };
  }
}

/**
 * Migrates old WorkoutContext data to new storage format
 * @param {any} oldSplit - Old split data from WorkoutContext
 * @returns {Promise<void>}
 */
export async function migrateOldWorkoutData(oldSplit) {
  try {
    // Check if we already have a split in new storage
    const existingSplit = await storage.getSplit();
    if (existingSplit) {
      return;
    }

    if (!oldSplit) {
      return;
    }

    // Convert old split format to new format
    const newSplit = {
      id: oldSplit.id?.toString() || 'migrated_split',
      name: oldSplit.name || 'My Split',
      description: oldSplit.description,
      emoji: oldSplit.emoji,
      totalDays: oldSplit.totalDays || oldSplit.workoutDays?.length || 0,
      days: (oldSplit.workoutDays || []).map((day, index) => ({
        dayIndex: index,
        name: day.name || day.workoutName,
        type: day.type || day.workoutType,
        emoji: day.emoji,
        isRest: day.isRest || false,
        exercises: (day.exercises || []).map((exercise) => ({
          exerciseId: exercise.id?.toString() || exercise.name,
          targetSets: parseInt(exercise.sets) || 3,
          targetReps: parseInt(exercise.reps) || 10,
        })),
      })),
      lastSyncedAt: Date.now(),
    };

    await storage.saveSplit(newSplit);
  } catch (error) {
    // Silent fail
  }
}
