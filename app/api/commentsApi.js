import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

const BASE_URL = `${BACKEND_API_URL}/comments`;

export const getCommentsByPostId = async (postId) => {
  try {
    const response = await axios.get(`${BASE_URL}/post/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    throw error;
  }
};

export const getCommentsByWorkoutPlanId = async (workoutPlanId) => {
  try {
    const response = await axios.get(`${BASE_URL}/workoutplan/${workoutPlanId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    throw error;
  }
};

export const getCommentsByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    throw error;
  }
};

export const getCommentById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch comment:', error);
    throw error;
  }
};

export const createComment = async (commentData) => {
  try {
    const response = await axios.post(BASE_URL, commentData);
    return response.data;
  } catch (error) {
    console.error('Failed to create comment:', error);
    throw error;
  }
};

export const updateComment = async (id, commentData) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, commentData);
    return response.data;
  } catch (error) {
    console.error('Failed to update comment:', error);
    throw error;
  }
};

export const deleteComment = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
};

export default function CommentsApiPage() {
  return null;
}