import axios from 'axios';

const BASE_URL = `${process.env.BACKEND_API_URL}/workoutplans`;

/**
 * Get workout plans by userId
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export const getWorkoutPlansByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}`);
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
    const response = await axios.post(BASE_URL, planData);
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
    const response = await axios.put(`${BASE_URL}/${planId}`, updates);
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
    const response = await axios.delete(`${BASE_URL}/${planId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete workout plan:', error);
    throw error;
  }
};
