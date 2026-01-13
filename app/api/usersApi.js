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
    const response = await axios.get(`${BACKEND_API_URL}/profiles/user/${userId}`);
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
    const response = await axios.get(`${BACKEND_API_URL}/posts/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};

/**
 * Search users by username or name
 */
export const searchUsers = async (query, currentUserId) => {
  try {
    const params = { query };
    if (currentUserId) {
      params.currentUserId = currentUserId;
    }
    const response = await axios.get(`${BACKEND_API_URL}/users/search`, { params });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Follow a user
 */
export const followUser = async (username, followerId) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/users/${username}/follow`, {
      followerId
    });
    return response.data;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (username, followerId) => {
  try {
    const response = await axios.delete(`${BACKEND_API_URL}/users/${username}/unfollow`, {
      data: { followerId }
    });
    return response.data;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

/**
 * Get followers list for a user
 */
export const getFollowers = async (username) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/${username}/followers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching followers:', error);
    return [];
  }
};

/**
 * Get following list for a user
 */
export const getFollowing = async (username) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/users/${username}/following`);
    return response.data;
  } catch (error) {
    console.error('Error fetching following:', error);
    return [];
  }
};

export default function UsersApiPage() {
  return null;
}