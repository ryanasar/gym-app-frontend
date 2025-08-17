import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

export const getOrCreateUserBySupabaseId = async (supabaseId, email) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/users/auth/${supabaseId}`, {
      email,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch or create user:', error.response?.data || error.message);
    throw error;
  }
};

export const getUserByUsername = async (username) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/${username}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user by username:', error.response?.data || error.message);
    throw error;
  }
};

export const checkUsernameAvailability = async (username) => {
  if (!username.trim()) return false;
  
  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/check-username/${username}`);
    return response.data.available;
  } catch (error) {
    console.error('Error checking username:', error.response?.data || error.message);
    return false;
  }
};

export const updateUserProfile = async (supabaseId, userData) => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/users/create-profile/${supabaseId}`, userData);

    return response.data;
  } catch (error) {
    console.error('Failed to update user profile:', error.response?.data || error.message);
    throw error;
  }
};

export const completeUserOnboarding = async (supabaseId) => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/users/complete-onboarding/${supabaseId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to complete onboarding:', error.response?.data || error.message);
    throw error;
  }
};