/**
 * StorageAdapter - Abstraction layer for local storage
 * This adapter ensures the app never depends on live network calls for workouts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types/storage.js';

/**
 * AsyncStorageAdapter - Implementation using React Native AsyncStorage
 */
export class AsyncStorageAdapter {
  // ==================== Split Operations ====================

  /**
   * Get the active split from storage
   * @returns {Promise<import('../types/storage').Split | null>}
   */
  async getSplit() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SPLIT);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[StorageAdapter] Failed to get split:', error);
      return null;
    }
  }

  /**
   * Save a split to storage
   * @param {import('../types/storage').Split} split
   * @returns {Promise<void>}
   */
  async saveSplit(split) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SPLIT, JSON.stringify(split));
    } catch (error) {
      console.error('[StorageAdapter] Failed to save split:', error);
      throw error;
    }
  }

  // ==================== Active Workout Operations ====================

  /**
   * Get the active workout from storage
   * @returns {Promise<import('../types/storage').WorkoutSession | null>}
   */
  async getActiveWorkout() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('[StorageAdapter] Failed to get active workout:', error);
      return null;
    }
  }

  /**
   * Save an active workout to storage
   * @param {import('../types/storage').WorkoutSession} workout
   * @returns {Promise<void>}
   */
  async saveActiveWorkout(workout) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(workout));
    } catch (error) {
      console.error('[StorageAdapter] Failed to save active workout:', error);
      throw error;
    }
  }

  /**
   * Clear the active workout from storage
   * @returns {Promise<void>}
   */
  async clearActiveWorkout() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    } catch (error) {
      console.error('[StorageAdapter] Failed to clear active workout:', error);
      throw error;
    }
  }

  /**
   * Complete a workout and move it to pending sync
   * @param {string} workoutId
   * @returns {Promise<void>}
   */
  async completeWorkout(workoutId) {
    try {
      // Get active workout
      const activeWorkout = await this.getActiveWorkout();

      if (!activeWorkout || activeWorkout.id !== workoutId) {
        console.warn('[StorageAdapter] No matching active workout found');
        return;
      }

      // Mark as completed
      activeWorkout.completedAt = Date.now();
      activeWorkout.pendingSync = true;

      // Add to pending workouts for sync
      await this.addToPendingWorkouts(activeWorkout);

      // Add to completed workouts history (persists after sync)
      await this.addToCompletedHistory(activeWorkout);

      // Clear active workout
      await this.clearActiveWorkout();
    } catch (error) {
      console.error('[StorageAdapter] Failed to complete workout:', error);
      throw error;
    }
  }

  // ==================== Pending Workout Operations ====================

  /**
   * Get all pending workouts
   * @returns {Promise<import('../types/storage').WorkoutSession[]>}
   */
  async getPendingWorkouts() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_WORKOUTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[StorageAdapter] Failed to get pending workouts:', error);
      return [];
    }
  }

  /**
   * Add a workout to the pending sync queue
   * @param {import('../types/storage').WorkoutSession} workout
   * @returns {Promise<void>}
   * @private
   */
  async addToPendingWorkouts(workout) {
    try {
      const pending = await this.getPendingWorkouts();
      pending.push(workout);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_WORKOUTS, JSON.stringify(pending));
    } catch (error) {
      console.error('[StorageAdapter] Failed to add to pending workouts:', error);
      throw error;
    }
  }

  /**
   * Mark a workout as synced and remove from pending queue
   * @param {string} workoutId
   * @returns {Promise<void>}
   */
  async markWorkoutSynced(workoutId) {
    try {
      const pending = await this.getPendingWorkouts();
      const filtered = pending.filter(w => w.id !== workoutId);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_WORKOUTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('[StorageAdapter] Failed to mark workout synced:', error);
      throw error;
    }
  }

  /**
   * Get all completed workouts (from pending sync queue)
   * @returns {Promise<import('../types/storage').WorkoutSession[]>}
   */
  async getCompletedWorkouts() {
    try {
      const pending = await this.getPendingWorkouts();
      return pending.filter(w => w.completedAt);
    } catch (error) {
      console.error('[StorageAdapter] Failed to get completed workouts:', error);
      return [];
    }
  }

  // ==================== Completed Workouts History ====================

  /**
   * Get completed workouts history (persists after sync)
   * @returns {Promise<import('../types/storage').WorkoutSession[]>}
   */
  async getCompletedHistory() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_WORKOUTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[StorageAdapter] Failed to get completed history:', error);
      return [];
    }
  }

  /**
   * Remove a workout from the completed history
   * @param {string} workoutId
   * @returns {Promise<void>}
   */
  async removeFromCompletedHistory(workoutId) {
    try {
      const history = await this.getCompletedHistory();
      const filtered = history.filter(w => w.id !== workoutId);
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_WORKOUTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('[StorageAdapter] Failed to remove from completed history:', error);
      throw error;
    }
  }

  /**
   * Add a workout to the completed history
   * @param {import('../types/storage').WorkoutSession} workout
   * @returns {Promise<void>}
   * @private
   */
  async addToCompletedHistory(workout) {
    try {
      const history = await this.getCompletedHistory();

      // Check if this workout is already in history (avoid duplicates)
      const exists = history.some(w => w.id === workout.id);
      if (exists) {
        return;
      }

      // Add workout to history
      history.push(workout);

      // Keep only last 90 days of workouts
      const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
      const filtered = history.filter(w => w.completedAt && w.completedAt >= ninetyDaysAgo);

      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_WORKOUTS, JSON.stringify(filtered));
    } catch (error) {
      console.error('[StorageAdapter] Failed to add to completed history:', error);
      throw error;
    }
  }

  /**
   * Check if a specific workout day is completed today
   * @param {string} splitId
   * @param {number} dayIndex
   * @returns {Promise<import('../types/storage').WorkoutSession | null>}
   */
  async getTodaysCompletedWorkout(splitId, dayIndex) {
    try {
      // Check completed history instead of pending queue
      // This persists even after workouts are synced
      const completed = await this.getCompletedHistory();

      // Get today's date in local timezone as YYYY-MM-DD
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Find workout completed today that matches split and day
      return completed.find(workout => {
        if (workout.splitId !== splitId || workout.dayIndex !== dayIndex) {
          return false;
        }

        // Convert completedAt to local date string
        const completedDate = new Date(workout.completedAt);
        const completedStr = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}-${String(completedDate.getDate()).padStart(2, '0')}`;

        return completedStr === todayStr;
      }) || null;
    } catch (error) {
      console.error('[StorageAdapter] Failed to check today\'s workout:', error);
      return null;
    }
  }

  // ==================== Exercise Database Operations ====================

  /**
   * Get all exercises from storage
   * @returns {Promise<import('../types/storage').Exercise[]>}
   */
  async getExercises() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_DATABASE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[StorageAdapter] Failed to get exercises:', error);
      return [];
    }
  }

  /**
   * Save exercises to storage
   * @param {import('../types/storage').Exercise[]} exercises
   * @returns {Promise<void>}
   */
  async saveExercises(exercises) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EXERCISE_DATABASE, JSON.stringify(exercises));
    } catch (error) {
      console.error('[StorageAdapter] Failed to save exercises:', error);
      throw error;
    }
  }

  // ==================== Workout ID Mapping ====================

  /**
   * Store mapping between local workout ID and database workout session ID
   * @param {string} localId - Local workout ID (e.g., "workout_123_abc")
   * @param {number} databaseId - Database workout session ID
   * @returns {Promise<void>}
   */
  async setWorkoutDatabaseId(localId, databaseId) {
    try {
      const key = `${STORAGE_KEYS.WORKOUT_ID_MAP}:${localId}`;
      await AsyncStorage.setItem(key, databaseId.toString());
    } catch (error) {
      console.error('[StorageAdapter] Failed to set workout database ID:', error);
      throw error;
    }
  }

  /**
   * Get database workout session ID from local workout ID
   * @param {string} localId - Local workout ID
   * @returns {Promise<number | null>}
   */
  async getWorkoutDatabaseId(localId) {
    try {
      const key = `${STORAGE_KEYS.WORKOUT_ID_MAP}:${localId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? parseInt(data, 10) : null;
    } catch (error) {
      console.error('[StorageAdapter] Failed to get workout database ID:', error);
      return null;
    }
  }

  /**
   * Delete database workout session ID mapping
   * @param {string} localId - Local workout ID
   * @returns {Promise<void>}
   */
  async deleteWorkoutDatabaseId(localId) {
    try {
      const key = `${STORAGE_KEYS.WORKOUT_ID_MAP}:${localId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[StorageAdapter] Failed to delete workout database ID:', error);
      throw error;
    }
  }

  // ==================== Rest Day Operations ====================

  /**
   * Save a rest day completion
   * @param {Object} restDayData - Rest day data including date, activities, caption
   * @returns {Promise<void>}
   */
  async saveRestDayCompletion(restDayData) {
    try {
      const restDayWithId = {
        ...restDayData,
        id: `rest-${Date.now()}`,
        type: 'rest_day',
        pendingSync: true,
      };

      // Add to pending workouts for sync (treat as a workout completion)
      const pending = await this.getPendingWorkouts();
      pending.push(restDayWithId);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_WORKOUTS, JSON.stringify(pending));
    } catch (error) {
      console.error('[StorageAdapter] Failed to save rest day completion:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storage = new AsyncStorageAdapter();
