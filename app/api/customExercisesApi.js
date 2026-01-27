/**
 * Custom Exercises API - Backend-first with local cache fallback
 * Creates on backend when online, caches locally. Falls back to local-only when offline.
 */

import { storage } from '../../storage/StorageAdapter';
import { checkNetworkStatus } from '../../services/networkService';
import {
  fetchUserCustomExercises,
  fetchCustomExerciseById as fetchById,
  createCustomExerciseOnBackend,
  deleteCustomExerciseOnBackend,
  copyCustomExercisesOnBackend,
} from './customExercisesBackendApi';

/**
 * Get all custom exercises. If online, fetches from backend and refreshes local cache.
 * Always returns local cache (which includes synced + pending items).
 * @param {number} [userId] - User ID for backend fetch
 * @returns {Promise<Array>}
 */
export const getCustomExercises = async (userId) => {
  try {
    if (userId) {
      const isOnline = await checkNetworkStatus();
      if (isOnline) {
        try {
          const backendExercises = await fetchUserCustomExercises(userId);
          await storage.replaceCustomExercises(backendExercises);
        } catch (err) {
          console.warn('[CustomExercisesApi] Backend fetch failed, using local cache:', err.message);
        }
      }
    }
    return await storage.getCustomExercises();
  } catch (error) {
    console.error('Failed to fetch custom exercises:', error);
    return [];
  }
};

/**
 * Get a single custom exercise by ID. Checks local cache first, then backend on miss.
 * @param {string|number} exerciseId
 * @returns {Promise<Object|null>}
 */
export const getCustomExerciseById = async (exerciseId) => {
  try {
    // Check local cache first
    const local = await storage.getCustomExercise(exerciseId);
    if (local) return local;

    // Also check by backendId (numeric IDs from backend)
    const allLocal = await storage.getCustomExercises();
    const byBackendId = allLocal.find(e => e.backendId === exerciseId || String(e.backendId) === String(exerciseId));
    if (byBackendId) return byBackendId;

    // Cache miss - try backend
    const numericId = parseInt(exerciseId);
    if (!isNaN(numericId)) {
      const isOnline = await checkNetworkStatus();
      if (isOnline) {
        try {
          const backendExercise = await fetchById(numericId);
          if (backendExercise) {
            await storage.cacheCustomExercise(backendExercise);
            return backendExercise;
          }
        } catch (err) {
          console.warn('[CustomExercisesApi] Backend fetch by ID failed:', err.message);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch custom exercise:', error);
    return null;
  }
};

/**
 * Create a new custom exercise. If online, creates on backend first, then caches locally.
 * If offline, saves locally with pendingSync flag.
 * @param {Object} exerciseData - { name, category?, primaryMuscles?, secondaryMuscles?, equipment?, difficulty? }
 * @param {number} [userId] - User ID for backend creation
 * @returns {Promise<Object>}
 */
export const createCustomExercise = async (exerciseData, userId) => {
  try {
    if (!exerciseData.name?.trim()) {
      throw new Error('Exercise name is required');
    }

    const exercisePayload = {
      name: exerciseData.name.trim(),
      category: exerciseData.category || null,
      primaryMuscles: exerciseData.primaryMuscles || [],
      secondaryMuscles: exerciseData.secondaryMuscles || [],
      equipment: exerciseData.equipment || null,
      difficulty: exerciseData.difficulty || null,
    };

    const isOnline = userId ? await checkNetworkStatus() : false;

    if (isOnline && userId) {
      try {
        // Create on backend first
        const backendExercise = await createCustomExerciseOnBackend({
          ...exercisePayload,
          userId,
        });

        // Cache locally with backend ID
        const localExercise = await storage.createCustomExercise({
          ...exercisePayload,
          id: String(backendExercise.id),
          backendId: backendExercise.id,
          pendingSync: false,
        });

        return localExercise;
      } catch (err) {
        console.warn('[CustomExercisesApi] Backend create failed, saving locally:', err.message);
      }
    }

    // Offline fallback: save locally with pendingSync
    const customExercise = await storage.createCustomExercise(exercisePayload);
    return customExercise;
  } catch (error) {
    console.error('Failed to create custom exercise:', error);
    throw error;
  }
};

/**
 * Update a custom exercise
 * @param {string} exerciseId
 * @param {Object} updates
 * @returns {Promise<Object|null>}
 */
export const updateCustomExercise = async (exerciseId, updates) => {
  try {
    return await storage.updateCustomExercise(exerciseId, updates);
  } catch (error) {
    console.error('Failed to update custom exercise:', error);
    throw error;
  }
};

/**
 * Delete a custom exercise from both backend and local cache
 * @param {string} exerciseId
 * @returns {Promise<void>}
 */
export const deleteCustomExercise = async (exerciseId) => {
  try {
    // Try to delete from backend if it has a backend ID
    const exercise = await storage.getCustomExercise(exerciseId);
    if (exercise?.backendId) {
      const isOnline = await checkNetworkStatus();
      if (isOnline) {
        try {
          await deleteCustomExerciseOnBackend(exercise.backendId);
        } catch (err) {
          console.warn('[CustomExercisesApi] Backend delete failed:', err.message);
        }
      }
    }

    // Always delete locally
    await storage.deleteCustomExercise(exerciseId);
  } catch (error) {
    console.error('Failed to delete custom exercise:', error);
    throw error;
  }
};

/**
 * Copy custom exercises from a source user to a target user via backend
 * @param {number[]} sourceExerciseIds - Backend IDs of exercises to copy
 * @param {number} targetUserId - User ID to copy to
 * @returns {Promise<{idMapping: Object, exercises: Array}>}
 */
export const copyCustomExercises = async (sourceExerciseIds, targetUserId) => {
  try {
    const result = await copyCustomExercisesOnBackend(sourceExerciseIds, targetUserId);

    // Cache the new exercises locally
    for (const exercise of result.exercises) {
      await storage.cacheCustomExercise(exercise);
    }

    return result;
  } catch (error) {
    console.error('Failed to copy custom exercises:', error);
    throw error;
  }
};

export default function CustomExercisesApiPage() {
  return null;
}
