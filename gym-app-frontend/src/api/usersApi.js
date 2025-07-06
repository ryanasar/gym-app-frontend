// src/api/userApi.js

import axios from 'axios';

export const getUserProfile = async (username) => {
  try {
    const response = await axios.get(`${process.env.BACKENED_API_URL}/${username}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};
