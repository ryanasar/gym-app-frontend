/**
 * Custom Exercises Backend API - Axios wrapper for backend custom exercise endpoints
 */

import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

const BASE_URL = `${BACKEND_API_URL}/custom-exercises`;

export const fetchUserCustomExercises = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user custom exercises:', error);
    throw error;
  }
};

export const fetchCustomExerciseById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch custom exercise:', error);
    throw error;
  }
};

export const fetchCustomExercisesByIds = async (ids) => {
  try {
    const response = await axios.post(`${BASE_URL}/batch`, { ids });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch custom exercises by IDs:', error);
    throw error;
  }
};

export const createCustomExerciseOnBackend = async (data) => {
  try {
    const response = await axios.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error('Failed to create custom exercise on backend:', error);
    throw error;
  }
};

export const updateCustomExerciseOnBackend = async (id, data) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Failed to update custom exercise on backend:', error);
    throw error;
  }
};

export const deleteCustomExerciseOnBackend = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete custom exercise on backend:', error);
    throw error;
  }
};

export const copyCustomExercisesOnBackend = async (sourceExerciseIds, targetUserId) => {
  try {
    const response = await axios.post(`${BASE_URL}/copy`, { sourceExerciseIds, targetUserId });
    return response.data;
  } catch (error) {
    console.error('Failed to copy custom exercises:', error);
    throw error;
  }
};

export default function CustomExercisesBackendApiPage() {
  return null;
}
