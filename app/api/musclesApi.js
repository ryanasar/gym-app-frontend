import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

const BASE_URL = `${BACKEND_API_URL}/muscles`;

export const getAllMuscles = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch muscles:', error);
    throw error;
  }
};

export const getMuscleById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch muscle:', error);
    throw error;
  }
};

export const createMuscle = async (muscleData) => {
  try {
    const response = await axios.post(BASE_URL, muscleData);
    return response.data;
  } catch (error) {
    console.error('Failed to create muscle:', error);
    throw error;
  }
};

export const updateMuscle = async (id, muscleData) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, muscleData);
    return response.data;
  } catch (error) {
    console.error('Failed to update muscle:', error);
    throw error;
  }
};

export const deleteMuscle = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete muscle:', error);
    throw error;
  }
};

export default function MusclesApiPage() {
  return null;
}