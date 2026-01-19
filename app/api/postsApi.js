import axios from 'axios';
import { BACKEND_API_URL } from "@/constants";


export const getPostById = async (postId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch post by id:', error);
    throw error;
  }
};

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

export const createPost = async (postData) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/posts`, postData);
    return response.data;
  } catch (error) {
    console.error('Failed to create post:', error);
    throw error;
  }
};

export const updatePost = async (postId, postData) => {
  try {
    const response = await axios.put(`${BACKEND_API_URL}/posts/${postId}`, postData);
    return response.data;
  } catch (error) {
    console.error('Failed to update post:', error);
    throw error;
  }
};

export const deletePost = async (postId) => {
  try {
    const response = await axios.delete(`${BACKEND_API_URL}/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete post:', error);
    throw error;
  }
};

export const likePost = async (postId, userId) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/posts/${postId}/like`, { userId });
    return response.data;
  } catch (error) {
    console.error('Failed to like post:', error);
    throw error;
  }
};

export const unlikePost = async (postId, userId) => {
  try {
    const response = await axios.delete(`${BACKEND_API_URL}/posts/${postId}/like/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to unlike post:', error);
    throw error;
  }
};

export const getComments = async (postId) => {
  try {
    const response = await axios.get(`${BACKEND_API_URL}/posts/${postId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    throw error;
  }
};

export const createComment = async (postId, commentData) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/posts/${postId}/comments`, commentData);
    return response.data;
  } catch (error) {
    console.error('Failed to create comment:', error);
    throw error;
  }
};

/**
 * Get posts from users that the current user is following (with pagination)
 */
export const getFollowingPosts = async (userId, cursor = null, limit = 10) => {
  try {
    const params = { limit };
    if (cursor) {
      params.cursor = cursor;
    }

    const response = await axios.get(`${BACKEND_API_URL}/posts/following/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching following posts:', error);
    return { posts: [], nextCursor: null, hasMore: false };
  }
};

export default function PostsApiPage() {
  return null;
}
