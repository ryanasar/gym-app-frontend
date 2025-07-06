import axios from 'axios';
import { BACKEND_API_URL } from '@env';

export const getUserByUsername = async (username) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/${username}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};
