import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

const BASE_URL = `${BACKEND_API_URL}/workout-sessions`;

/**
 * Get workout sessions by userId
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export const getWorkoutSessionsByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workout sessions:', error);
    throw error;
  }
};

/**
 * Get today's completed workout session
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD format
 * @returns {Promise<Object|null>}
 */
export const getTodaysWorkoutSession = async (userId, date) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}/today?date=${date}`);
    return response.data;
  } catch (error) {
    // 404 means no session found, which is normal
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Failed to fetch today\'s workout session:', error);
    throw error;
  }
};

/**
 * Get a specific workout session by id
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getWorkoutSessionById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workout session:', error);
    throw error;
  }
};

/**
 * Create a new workout session
 * @param {Object} sessionData
 * @returns {Promise<Object>}
 */
export const createWorkoutSession = async (sessionData) => {
  try {
    const response = await axios.post(BASE_URL, sessionData);
    return response.data;
  } catch (error) {
    console.error('Failed to create workout session:', error);
    console.error('Session data:', JSON.stringify(sessionData, null, 2));
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

/**
 * Update a workout session by id
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export const updateWorkoutSession = async (id, updates) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update workout session:', error);
    throw error;
  }
};

/**
 * Delete a workout session by id
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteWorkoutSession = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete workout session:', error);
    throw error;
  }
};

/**
 * Get exercise history for a user
 * @param {number} userId
 * @param {string} exerciseName
 * @returns {Promise<Array>}
 */
export const getExerciseHistory = async (userId, exerciseName) => {
  try {
    const response = await axios.get(`${BASE_URL}/exercise-history/${userId}/${encodeURIComponent(exerciseName)}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch exercise history:', error);
    throw error;
  }
};

/**
 * Get workout statistics for a user
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export const getUserWorkoutStats = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workout stats:', error);
    throw error;
  }
};

export default function WorkoutSessionsApiPage() {
  return null;
}
