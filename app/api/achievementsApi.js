import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

const BASE_URL = `${BACKEND_API_URL}/achievements`;

export const getAllAchievements = async () => {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    throw error;
  }
};

export const getAchievementsByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    throw error;
  }
};

export const getAchievementById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch achievement:', error);
    throw error;
  }
};

export const createAchievement = async (achievementData) => {
  try {
    const response = await axios.post(BASE_URL, achievementData);
    return response.data;
  } catch (error) {
    console.error('Failed to create achievement:', error);
    throw error;
  }
};

export const deleteAchievement = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete achievement:', error);
    throw error;
  }
};

export default function AchievementsApiPage() {
  return null;
}