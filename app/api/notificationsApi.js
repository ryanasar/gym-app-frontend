import { supabase } from '../../supabase';

/**
 * Fetch notifications for a user
 */
export const getNotifications = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('Notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('Notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
};

/**
 * Create a notification for a like action
 */
export const createLikeNotification = async (recipientId, actorId, postId) => {
  // Don't notify yourself
  if (recipientId === actorId) return null;

  try {
    const { data, error } = await supabase
      .from('Notifications')
      .insert({
        recipient_id: recipientId,
        actor_id: actorId,
        type: 'like',
        post_id: postId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating like notification:', error);
    return null;
  }
};

/**
 * Create a notification for a comment action
 */
export const createCommentNotification = async (recipientId, actorId, postId, commentId) => {
  // Don't notify yourself
  if (recipientId === actorId) return null;

  try {
    const { data, error } = await supabase
      .from('Notifications')
      .insert({
        recipient_id: recipientId,
        actor_id: actorId,
        type: 'comment',
        post_id: postId,
        comment_id: commentId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating comment notification:', error);
    return null;
  }
};

/**
 * Create a notification for a follow action
 */
export const createFollowNotification = async (recipientId, actorId) => {
  // Don't notify yourself
  if (recipientId === actorId) return null;

  try {
    const { data, error } = await supabase
      .from('Notifications')
      .insert({
        recipient_id: recipientId,
        actor_id: actorId,
        type: 'follow',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating follow notification:', error);
    return null;
  }
};

/**
 * Create a notification for a tag action
 */
export const createTagNotification = async (recipientId, actorId, postId) => {
  // Don't notify yourself
  if (recipientId === actorId) return null;

  try {
    const { data, error } = await supabase
      .from('Notifications')
      .insert({
        recipient_id: recipientId,
        actor_id: actorId,
        type: 'tag',
        post_id: postId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating tag notification:', error);
    return null;
  }
};

/**
 * Delete a like notification (when unliking)
 */
export const deleteLikeNotification = async (actorId, postId) => {
  try {
    const { error } = await supabase
      .from('Notifications')
      .delete()
      .eq('actor_id', actorId)
      .eq('post_id', postId)
      .eq('type', 'like');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting like notification:', error);
    return false;
  }
};

/**
 * Delete a follow notification (when unfollowing)
 */
export const deleteFollowNotification = async (actorId, recipientId) => {
  try {
    const { error } = await supabase
      .from('Notifications')
      .delete()
      .eq('actor_id', actorId)
      .eq('recipient_id', recipientId)
      .eq('type', 'follow');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting follow notification:', error);
    return false;
  }
};

export default function NotificationsApiPage() {
  return null;
}
