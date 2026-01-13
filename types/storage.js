/**
 * Offline-First Storage Types for Gymvy
 * These types define the local-first data model for workouts
 */

/**
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {string} name
 * @property {string[]} primaryMuscles
 * @property {string[]} secondaryMuscles
 * @property {string} equipment
 */

/**
 * @typedef {Object} SplitExercise
 * @property {string} exerciseId
 * @property {number} targetSets
 * @property {number} targetReps
 */

/**
 * @typedef {Object} SplitDay
 * @property {number} dayIndex
 * @property {string} [name]
 * @property {string} [type]
 * @property {string} [emoji]
 * @property {boolean} [isRest]
 * @property {SplitExercise[]} exercises
 */

/**
 * @typedef {Object} Split
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string} [emoji]
 * @property {number} totalDays
 * @property {SplitDay[]} days
 * @property {number} lastSyncedAt
 */

/**
 * @typedef {Object} WorkoutSet
 * @property {number} setIndex
 * @property {number} reps
 * @property {number} weight
 * @property {boolean} completed
 */

/**
 * @typedef {Object} WorkoutExercise
 * @property {string} exerciseId
 * @property {WorkoutSet[]} sets
 */

/**
 * @typedef {Object} WorkoutSession
 * @property {string} id
 * @property {string} splitId
 * @property {number} dayIndex
 * @property {number} startedAt
 * @property {number} [completedAt]
 * @property {WorkoutExercise[]} exercises
 * @property {boolean} pendingSync
 */

// Storage Keys
export const STORAGE_KEYS = {
  ACTIVE_SPLIT: '@gymvy/active_split',
  ACTIVE_WORKOUT: '@gymvy/active_workout',
  PENDING_WORKOUTS: '@gymvy/pending_workouts',
  COMPLETED_WORKOUTS: '@gymvy/completed_workouts',
  EXERCISE_DATABASE: '@gymvy/exercise_database',
  LAST_SYNC: '@gymvy/last_sync',
  WORKOUT_ID_MAP: '@gymvy/workout_id_map',
};
