import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

const BASE_URL = `${BACKEND_API_URL}/workouts`;

export const getWorkoutsByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workouts:', error);
    throw error;
  }
};

export const getWorkoutById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workout:', error);
    throw error;
  }
};

export const createWorkout = async (workoutData) => {
  try {
    const response = await axios.post(BASE_URL, workoutData);
    return response.data;
  } catch (error) {
    console.error('Failed to create workout:', error);
    throw error;
  }
};

export const updateWorkout = async (id, workoutData) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, workoutData);
    return response.data;
  } catch (error) {
    console.error('Failed to update workout:', error);
    throw error;
  }
};

export const deleteWorkout = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete workout:', error);
    throw error;
  }
};

export default function WorkoutsApiPage() {
  return null;
}