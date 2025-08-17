import axios from 'axios';

import { BACKEND_API_URL } from '@/constants';

/**
 * Get workout plans by userId
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export const getWorkoutPlansByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/workoutplans/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workout plans:', error);
    throw error;
  }
};

/**
 * Create a new workout plan
 * @param {Object} planData
 * @returns {Promise<Object>}
 */
export const createWorkoutPlan = async (planData) => {
  try {
    const response = await axios.post(BACKEND_API_URL, planData);
    return response.data;
  } catch (error) {
    console.error('Failed to create workout plan:', error);
    throw error;
  }
};

/**
 * Update a workout plan by planId
 * @param {number} planId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export const updateWorkoutPlan = async (planId, updates) => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/workoutplans/${planId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update workout plan:', error);
    throw error;
  }
};

/**
 * Delete a workout plan by planId
 * @param {number} planId
 * @returns {Promise<Object>}
 */
export const deleteWorkoutPlan = async (planId) => {
  try {
    const response = await axios.delete(`${BACKEND_API_URL}/workoutplans/${planId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete workout plan:', error);
    throw error;
  }
};
