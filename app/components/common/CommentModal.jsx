import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { createComment, getComments } from '../../api/postsApi';
import { deleteComment } from '../../api/commentsApi';
import { createCommentNotification, deleteCommentNotification } from '../../api/notificationsApi';
import Avatar from '../ui/Avatar';
import LoadingSpinner from '../ui/LoadingSpinner';

const CommentModal = ({
  visible,
  onClose,
  postId,
  postAuthorId,
  currentUserId,
  comments,
  setComments,
  commentCount,
  onCommentCountChange,
}) => {
  const colors = useThemeColors();
  const router = useRouter();
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadComments = async () => {
    if (hasLoaded && comments.length > 0) return;
    setIsLoading(true);
    try {
      const fetched = await getComments(postId);
      setComments(fetched);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShow = () => {
    loadComments();
  };

  const handleClose = () => {
    setCommentText('');
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return minutes < 1 ? 'now' : `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    } else if (diffInDays < 365) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAuthorPress = (username) => {
    if (!username) return;
    handleClose();
    setTimeout(() => {
      router.push(`/user/${username}`);
    }, 100);
  };

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const newComment = await createComment(postId, {
        userId: currentUserId,
        content: commentText,
      });
      setCommentText('');
      setComments((prev) => [newComment, ...prev]);
      onCommentCountChange(commentCount + 1);

      if (postAuthorId && postAuthorId !== currentUserId && newComment?.id) {
        await createCommentNotification(postAuthorId, currentUserId, postId, newComment.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (comment) => {
    Alert.alert('Delete Comment?', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(comment.id);
            await deleteCommentNotification(currentUserId, postId, comment.id);
            setComments((prev) => prev.filter((c) => c.id !== comment.id));
            onCommentCountChange(commentCount - 1);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete comment');
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      onShow={handleShow}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.title, { color: colors.text }]}>Comments</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        {isLoading ? (
          <LoadingSpinner fullScreen />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={({ item: comment }) => (
              <View style={styles.commentItem}>
                <TouchableOpacity
                  onPress={() => handleAuthorPress(comment.author?.username)}
                  activeOpacity={0.7}
                >
                  <Avatar
                    uri={comment.author?.profile?.avatarUrl}
                    name={comment.author?.name || comment.author?.username}
                    size={40}
                  />
                </TouchableOpacity>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <TouchableOpacity
                      onPress={() => handleAuthorPress(comment.author?.username)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.commentAuthor, { color: colors.text }]}>
                        {comment.author?.name || comment.author?.username || 'Unknown User'}
                      </Text>
                    </TouchableOpacity>
                    {comment.author?.profile?.isVerified && (
                      <Ionicons name="checkmark-circle" size={14} color="#1D9BF0" style={{ marginLeft: -4 }} />
                    )}
                    <Text style={[styles.commentTimestamp, { color: colors.secondaryText }]}>
                      {formatDate(comment.timestamp)}
                    </Text>
                  </View>
                  <Text style={[styles.commentText, { color: colors.text }]}>{comment.content}</Text>
                </View>
                {(comment.userId === currentUserId || comment.author?.id === currentUserId) && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(comment)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.text }]}>No comments yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>Be the first to comment!</Text>
              </View>
            }
            contentContainerStyle={styles.commentsList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Comment Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderTopColor: colors.borderLight }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.borderLight + '30', color: colors.text }]}
            placeholder="Write a comment..."
            placeholderTextColor={colors.secondaryText}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            blurOnSubmit
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary + '15' },
              (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <LoadingSpinner size="small" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={commentText.trim() ? colors.primary : colors.secondaryText}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CommentModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  commentsList: {
    padding: 16,
    flexGrow: 1,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: '600',
  },
  commentTimestamp: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  deleteButton: {
    padding: 6,
    marginLeft: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
