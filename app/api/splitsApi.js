import axios from 'axios';

import { BACKEND_API_URL } from '@/constants';

/**
 * Get a split by ID (fetches from user's public splits)
 * @param {number} splitId
 * @param {number} userId - The user ID who owns the split
 * @returns {Promise<Object>}
 */
export const getSplitById = async (splitId, userId) => {
  try {
    // Fetch user's public splits and find the one we need
    const publicSplits = await getPublicSplitsByUserId(userId);
    const split = publicSplits.find(s => s.id === splitId);
    if (!split) {
      throw new Error('Split not found');
    }
    return split;
  } catch (error) {
    console.error('Failed to fetch split:', error);
    throw error;
  }
};

/**
 * Get splits by userId
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export const getSplitsByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/splits/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch splits:', error);
    throw error;
  }
};

/**
 * Get public splits by userId
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export const getPublicSplitsByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/splits/user/${userId}/public`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch public splits:', error);
    throw error;
  }
};

/**
 * Create a new split
 * @param {Object} splitData
 * @returns {Promise<Object>}
 */
export const createSplit = async (splitData) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/splits`, splitData);
    return response.data;
  } catch (error) {
    console.error('Failed to create split:', error);
    throw error;
  }
};

/**
 * Update a split by splitId
 * @param {number} splitId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export const updateSplit = async (splitId, updates) => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/splits/${splitId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Failed to update split:', error);
    throw error;
  }
};

/**
 * Delete a split by splitId
 * @param {number} splitId
 * @returns {Promise<Object>}
 */
export const deleteSplit = async (splitId) => {
  try {
    const response = await axios.delete(`${BACKEND_API_URL}/splits/${splitId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete split:', error);
    throw error;
  }
};

export default function SplitsApiPage() {
  return null;
}