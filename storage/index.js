/**
 * Storage Module - Offline-First Data Layer
 *
 * This module provides the complete storage abstraction for Gymvy's offline-first architecture.
 *
 * Usage:
 *   import { storage, startWorkout, completeWorkout, initializeApp } from '../storage';
 */

// Core storage adapter
export { storage, AsyncStorageAdapter } from './StorageAdapter.js';

// Workout helpers
export {
  startWorkout,
  updateWorkoutSet,
  completeWorkout,
  getActiveWorkout,
  cancelWorkout,
  generateWorkoutId,
  buildWorkoutFromSplit,
  calculateStreakFromLocal,
} from './workoutHelpers.js';

// App initialization
export {
  initializeApp,
  migrateOldWorkoutData,
  isOnline,
} from './initializeApp.js';

// Sync service
export {
  syncPendingWorkouts,
  backgroundSync,
  getSyncStatus,
  checkNetworkStatus,
} from './syncService.js';

// Calendar storage
export {
  getCalendarData,
  markTodayCompleted,
  unmarkTodayCompleted,
  isTodayCompleted,
  getCalendarDataForDisplay,
  backfillCalendarFromBackend,
  clearCalendarData,
} from './calendarStorage.js';

// Types
export { STORAGE_KEYS } from '../types/storage.js';
