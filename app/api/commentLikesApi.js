import axios from 'axios';
import { BACKEND_API_URL } from '@/constants';

export const toggleCommentLike = async (commentId, userId) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/comment-likes/toggle`, {
      commentId,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to toggle comment like:', error);
    throw error;
  }
};

export default function CommentLikesApiPage() {
  return null;
}
