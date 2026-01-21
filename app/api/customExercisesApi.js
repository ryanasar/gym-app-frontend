/**
 * Custom Exercises API - Local-first storage with optional backend sync
 * Uses the same pattern as savedWorkoutsApi: local storage first, backend sync in background
 */

import { storage } from '../../storage/StorageAdapter';

/**
 * Get all custom exercises from local storage
 * @returns {Promise<Array>}
 */
export const getCustomExercises = async () => {
  try {
    return await storage.getCustomExercises();
  } catch (error) {
    console.error('Failed to fetch custom exercises:', error);
    return [];
  }
};

/**
 * Get a single custom exercise by ID from local storage
 * @param {string} exerciseId
 * @returns {Promise<Object|null>}
 */
export const getCustomExerciseById = async (exerciseId) => {
  try {
    return await storage.getCustomExercise(exerciseId);
  } catch (error) {
    console.error('Failed to fetch custom exercise:', error);
    return null;
  }
};

/**
 * Create a new custom exercise in local storage
 * @param {Object} exerciseData - { name, category?, primaryMuscles?, secondaryMuscles?, equipment?, difficulty? }
 * @returns {Promise<Object>}
 */
export const createCustomExercise = async (exerciseData) => {
  try {
    if (!exerciseData.name?.trim()) {
      throw new Error('Exercise name is required');
    }

    const customExercise = await storage.createCustomExercise({
      name: exerciseData.name.trim(),
      category: exerciseData.category || null,
      primaryMuscles: exerciseData.primaryMuscles || [],
      secondaryMuscles: exerciseData.secondaryMuscles || [],
      equipment: exerciseData.equipment || null,
      difficulty: exerciseData.difficulty || null,
    });

    return customExercise;
  } catch (error) {
    console.error('Failed to create custom exercise:', error);
    throw error;
  }
};

/**
 * Update a custom exercise in local storage
 * @param {string} exerciseId
 * @param {Object} updates - { name?, category?, primaryMuscles?, secondaryMuscles?, equipment?, difficulty? }
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
 * Delete a custom exercise from local storage
 * @param {string} exerciseId
 * @returns {Promise<void>}
 */
export const deleteCustomExercise = async (exerciseId) => {
  try {
    await storage.deleteCustomExercise(exerciseId);
  } catch (error) {
    console.error('Failed to delete custom exercise:', error);
    throw error;
  }
};

export default function CustomExercisesApiPage() {
  return null;
}
