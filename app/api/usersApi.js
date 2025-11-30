import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

export const getOrCreateUserBySupabaseId = async (supabaseId, email) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/users/auth/${supabaseId}`, {
      email,
    }, {
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserByUsername = async (username) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/${username}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkUsernameAvailability = async (username) => {
  if (!username.trim()) return false;

  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/check-username/${username}`);
    return response.data.available;
  } catch (error) {
    return false;
  }
};

export const updateUserProfile = async (supabaseId, userData) => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/users/create-profile/${supabaseId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeUserOnboarding = async (supabaseId) => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/users/complete-onboarding/${supabaseId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/${userId}/profile`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getUserWorkoutPlans = async (userId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/${userId}/workout-plans`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getUserPosts = async (userId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/${userId}/posts`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export default function UsersApiPage() {
  return null;
}