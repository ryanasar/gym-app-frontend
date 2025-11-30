import axios from "axios";

import { BACKEND_API_URL } from "@/constants";

// Get profile by user ID
export const getProfileByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/profiles/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch profile by userId:', error);
    throw error;
  }
};

// Create a new profile
export const createProfile = async (profileData) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/profiles`, profileData);
    return response.data;
  } catch (error) {
    console.error('Failed to create profile:', error);
    throw error;
  }
};

// Update profile by user ID
export const updateProfile = async (userId, profileData) => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/profiles/user/${userId}`, profileData);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

// Delete profile by user ID
export const deleteProfile = async (userId) => {
  try {
    const response = await axios.delete(`${BACKEND_API_URL}/profiles/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete profile:', error);
    throw error;
  }
};

// Get all public profiles with optional search and pagination
export const getPublicProfiles = async (params = {}) => {
  try {
    const { page = 1, limit = 20, search } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });
    
    const response = await axios.get(`${BACKEND_API_URL}/profiles/public?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch public profiles:', error);
    throw error;
  }
};

// Search public profiles (convenience function)
export const searchPublicProfiles = async (searchTerm, page = 1, limit = 20) => {
  return getPublicProfiles({ search: searchTerm, page, limit });
};

// Check if profile exists for user
export const checkProfileExists = async (userId) => {
  try {
    await getProfileByUserId(userId);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
};

// Get profile with error handling for privacy
export const getProfileSafely = async (identifier, type = 'userId') => {
  try {
    if (type === 'username') {
      return await getProfileByUsername(identifier);
    } else {
      return await getProfileByUserId(identifier);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      return { error: 'Profile is private', isPrivate: true };
    } else if (error.response?.status === 404) {
      return { error: 'Profile not found', notFound: true };
    }
    throw error;
  }
};

export default function ProfileApiPage() {
  return null;
}