import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

export const getBodyWeightEntries = async (userId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/body-weights/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch body weight entries:', error);
    throw error;
  }
};

export const createBodyWeightEntry = async (userId, weight, date) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/body-weights`, {
      userId,
      weight,
      date,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create body weight entry:', error);
    throw error;
  }
};

export const deleteBodyWeightEntry = async (id) => {
  try {
    const response = await axios.delete(`${BACKEND_API_URL}/body-weights/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete body weight entry:', error);
    throw error;
  }
};

// Expo Router requires a default export for files in app/
export default null;
