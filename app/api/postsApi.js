import axios from 'axios';
import { BACKEND_API_URL } from "@/constants";


export const getPostsByUserId = async (userId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/posts/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch posts by userId:', error);
    throw error;
  }
};

export const getPostsByUserIds = async (userIds) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/posts/multiple`, { userIds });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch posts by userIds:', error);
    throw error;
  }
};
