import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

const BASE_URL = `${BACKEND_API_URL}/likes`;

export const getLikesByPostId = async (postId) => {
  try {
    const response = await axios.get(`${BASE_URL}/post/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch likes:', error);
    throw error;
  }
};

export const getLikesByWorkoutPlanId = async (workoutPlanId) => {
  try {
    const response = await axios.get(`${BASE_URL}/workoutplan/${workoutPlanId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch likes:', error);
    throw error;
  }
};

export const getLikesByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch likes:', error);
    throw error;
  }
};

export const createLike = async (likeData) => {
  try {
    const response = await axios.post(BASE_URL, likeData);
    return response.data;
  } catch (error) {
    console.error('Failed to create like:', error);
    throw error;
  }
};

export const deleteLike = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete like:', error);
    throw error;
  }
};

export const toggleLike = async (likeData) => {
  try {
    const response = await axios.post(`${BASE_URL}/toggle`, likeData);
    return response.data;
  } catch (error) {
    console.error('Failed to toggle like:', error);
    throw error;
  }
};

export default function LikesApiPage() {
  return null;
}