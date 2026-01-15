import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { createComment, deletePost, likePost, unlikePost, getComments } from '../../api/postsApi';
import { createLikeNotification, deleteLikeNotification, createCommentNotification } from '../../api/notificationsApi';
import { Colors } from '../../constants/colors';

const Activity = ({ post, currentUserId, onPostUpdated, onPostDeleted }) => {
  const router = useRouter();
  const {
    id,
    type,
    title,
    description,
    imageUrl,
    createdAt,
    author,
    workoutSession,
    split,
    streak,
    _count,
    likes = [],
  } = post;

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localLikeCount, setLocalLikeCount] = useState(_count?.likes || 0);
  const [localCommentCount, setLocalCommentCount] = useState(_count?.comments || 0);
  const [isLiked, setIsLiked] = useState(
    likes?.some(like => like.userId === currentUserId) || false
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Sync like/comment state when post prop changes (e.g., when navigating between tabs)
  useEffect(() => {
    const likedFromServer = likes?.some(like => like.userId === currentUserId) || false;
    setIsLiked(likedFromServer);
    setLocalLikeCount(_count?.likes || 0);
    setLocalCommentCount(_count?.comments || 0);
  }, [likes, _count?.likes, _count?.comments, currentUserId]);

  const isOwnPost = currentUserId && author?.id === currentUserId;

  // Check if this is a rest day post by looking for "Recovery:" in description
  const isRestDay = type === 'rest_day' || (description && description.includes('Recovery:'));

  // Convert workoutSession to workoutData format for display
  const workoutData = workoutSession ? {
    dayName: workoutSession.dayName || workoutSession.workoutName || split?.name || 'Workout',
    weekNumber: workoutSession.weekNumber,
    dayNumber: workoutSession.dayNumber,
    exercises: workoutSession.exercises?.map(ex => ({
      name: ex.exerciseName || ex.name,
      sets: ex.sets || []
    })) || []
  } : null;

  // Calculate workout stats
  const totalSets = workoutData?.exercises?.reduce((acc, ex) => {
    return acc + (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 0);
  }, 0) || 0;

  // Debug log for troubleshooting
  if (workoutSession && (!workoutData?.exercises || workoutData.exercises.length === 0)) {
    console.log('[Activity] Post has workoutSession but no exercises:', {
      postId: id,
      hasWorkoutSession: !!workoutSession,
      exercisesCount: workoutSession?.exercises?.length
    });
  }

  // Parse rest activities from description
  const restActivities = isRestDay && description ? (() => {
    const match = description.match(/Recovery:\s*(.+?)(?:\n|$)/);
    if (match) {
      return match[1].split(',').map(activity => activity.trim());
    }
    return [];
  })() : [];

  // Extract muscles worked from workout exercises
  const musclesWorked = workoutData?.exercises ? (() => {
    const muscles = new Set();
    workoutData.exercises.forEach(exercise => {
      // Map exercise names to muscle groups
      const exerciseName = exercise.name.toLowerCase();
      if (exerciseName.includes('bench') || exerciseName.includes('press') || exerciseName.includes('chest')) {
        muscles.add('Chest');
      }
      if (exerciseName.includes('pull') || exerciseName.includes('row') || exerciseName.includes('back')) {
        muscles.add('Back');
      }
      if (exerciseName.includes('squat') || exerciseName.includes('leg') || exerciseName.includes('quad')) {
        muscles.add('Legs');
      }
      if (exerciseName.includes('shoulder') || exerciseName.includes('lateral') || exerciseName.includes('overhead')) {
        muscles.add('Shoulders');
      }
      if (exerciseName.includes('curl') || exerciseName.includes('bicep')) {
        muscles.add('Biceps');
      }
      if (exerciseName.includes('tricep') || exerciseName.includes('dip') || exerciseName.includes('extension')) {
        muscles.add('Triceps');
      }
      if (exerciseName.includes('deadlift')) {
        muscles.add('Back');
        muscles.add('Legs');
      }
    });
    return Array.from(muscles);
  })() : [];

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
      const hours = Math.floor(diffInHours);
      return `${hours}h`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days}d`;
    } else if (diffInDays < 365) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const handleCardPress = () => {
    // Don't navigate on rest day posts (they're not interactive)
    if (isRestDay) return;

    if (workoutData) {
      router.push({
        pathname: '../workout/workoutDetail',
        params: {
          postId: id.toString(),
          workoutData: JSON.stringify(workoutData),
          splitData: split ? JSON.stringify(split) : '',
        }
      });
    }
  };

  const handleProfilePress = () => {
    if (author?.username) {
      router.push(`/user/${author.username}`);
    }
  };

  const handleLike = async () => {
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLocalLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      if (wasLiked) {
        await unlikePost(id, currentUserId);
        // Delete the like notification
        await deleteLikeNotification(currentUserId, id);
      } else {
        await likePost(id, currentUserId);
        // Create a notification for the post author (if not self)
        if (author?.id && author.id !== currentUserId) {
          await createLikeNotification(author.id, currentUserId, id);
        }
      }

      if (onPostUpdated) {
        // Update both the likes array and count to keep state in sync
        const updatedLikes = wasLiked
          ? likes.filter(like => like.userId !== currentUserId)
          : [...likes, { userId: currentUserId }];
        onPostUpdated({
          ...post,
          likes: updatedLikes,
          _count: { ...post._count, likes: wasLiked ? localLikeCount - 1 : localLikeCount + 1 }
        });
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setLocalLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const fetchComments = async () => {
    if (isLoadingComments) return;

    setIsLoadingComments(true);
    try {
      const fetchedComments = await getComments(id);
      setComments(fetchedComments);
      setShowComments(true);
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (showComments) {
      setShowComments(false);
    } else {
      fetchComments();
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await createComment(id, {
        userId: currentUserId,
        content: commentText
      });

      setLocalCommentCount(prev => prev + 1);
      setCommentText('');
      setShowCommentInput(false);

      // Add the new comment to the comments list
      setComments(prev => [newComment, ...prev]);

      // Create a notification for the post author (if not self)
      if (author?.id && author.id !== currentUserId && newComment?.id) {
        await createCommentNotification(author.id, currentUserId, id, newComment.id);
      }

      if (onPostUpdated) {
        onPostUpdated({ ...post, _count: { ...post._count, comments: localCommentCount + 1 } });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditPost = () => {
    router.push({
      pathname: '/post/create',
      params: {
        postId: id.toString(),
        description: description || '',
        workoutData: workoutData ? JSON.stringify(workoutData) : '',
        workoutSessionId: post.workoutSessionId?.toString() || '',
        splitId: post.splitId?.toString() || '',
      },
    });
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(id);
              if (onPostDeleted) {
                onPostDeleted(id);
              }
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const [showMenu, setShowMenu] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && !isRestDay && styles.cardPressed
      ]}
      onPress={handleCardPress}
      android_ripple={{ color: Colors.light.borderLight }}
      disabled={isRestDay}
    >
      {/* Header Row: Avatar, Name, Timestamp, Menu */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.authorInfo}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          {author?.profile?.avatarUrl ? (
            <Image
              source={{ uri: author.profile.avatarUrl }}
              style={styles.authorAvatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.authorAvatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(author?.name || author?.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.authorTextContainer}>
            <View style={styles.nameTimestampRow}>
              <Text style={styles.authorName}>{author?.name || author?.username || 'Unknown User'}</Text>
              <Text style={styles.timestampInline}>· {formatDate(createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isOwnPost && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.light.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Overflow Menu */}
      {showMenu && isOwnPost && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              handleEditPost();
            }}
          >
            <Ionicons name="pencil" size={18} color={Colors.light.text} />
            <Text style={styles.menuItemText}>Edit Post</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={() => {
              setShowMenu(false);
              handleDeletePost();
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Post</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content Body */}
      <View style={styles.contentBody}>
        {/* Type Label + Workout Name */}
        <Text style={styles.typeLabel}>{isRestDay ? 'REST DAY' : 'WORKOUT'}</Text>
        {isRestDay ? (
          <Text style={styles.workoutName}>Rest & Recover</Text>
        ) : (
          <Text style={styles.workoutName}>
            {title || workoutData?.dayName || 'Workout'}
          </Text>
        )}

        {/* Description */}
        {description && (
          <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
            {isRestDay ? description.replace(/Recovery:\s*.+?(?:\n|$)/, '').trim() || 'Took a rest day' : description}
          </Text>
        )}
      </View>

      {/* Post Image - Full Width */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.postImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      )}

      {/* Metadata Section */}
      <View style={styles.metadataSection}>
        {/* Streak Badge */}
        {streak && streak > 1 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streak}-day streak</Text>
          </View>
        )}

        {/* Badges Row - Rest Activities or Muscles */}
        <View style={styles.badgesContainer}>
          {/* Rest Activities */}
          {isRestDay && restActivities && restActivities.length > 0 && restActivities.map((activity, index) => (
            <View key={index} style={styles.activityBadge}>
              <Text style={styles.activityBadgeText}>{activity}</Text>
            </View>
          ))}

          {/* Muscles Worked for Workout Days */}
          {!isRestDay && musclesWorked && musclesWorked.length > 0 && musclesWorked.map((muscle, index) => (
            <View key={index} style={styles.muscleBadge}>
              <Text style={styles.muscleBadgeText}>{muscle}</Text>
            </View>
          ))}
        </View>

        {/* Stats Row */}
        {workoutData && !isRestDay && (
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {totalSets} {totalSets === 1 ? 'set' : 'sets'} • {workoutData.exercises?.length || 0} {workoutData.exercises?.length === 1 ? 'exercise' : 'exercises'}
            </Text>
            <Text style={styles.tapHintText}>• Tap to view workout details</Text>
          </View>
        )}
      </View>

      {/* Social Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={handleLike}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? "#EF4444" : Colors.light.secondaryText}
          />
          {localLikeCount > 0 && (
            <Text style={[styles.actionCount, isLiked && styles.likedCount]}>
              {localLikeCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => setShowCommentInput(!showCommentInput)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chatbubble-outline" size={18} color={Colors.light.secondaryText} />
          {localCommentCount > 0 && (
            <Text style={styles.actionCount}>{localCommentCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* View Comments Link */}
      {localCommentCount > 0 && !showComments && (
        <TouchableOpacity
          style={styles.viewCommentsButton}
          onPress={handleToggleComments}
        >
          <Text style={styles.viewCommentsText}>
            View {localCommentCount === 1 ? 'comment' : `all ${localCommentCount} comments`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Comments List */}
      {showComments && (
        <View style={styles.commentsSection}>
          {isLoadingComments ? (
            <View style={styles.commentsLoading}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
            </View>
          ) : (
            <>
              <View style={styles.commentsSectionHeader}>
                <Text style={styles.commentsSectionTitle}>Comments</Text>
                <TouchableOpacity onPress={handleToggleComments}>
                  <Text style={styles.hideCommentsText}>Hide</Text>
                </TouchableOpacity>
              </View>
              {comments.length === 0 ? (
                <Text style={styles.noCommentsText}>No comments yet</Text>
              ) : (
                comments.map((comment, index) => (
                  <View key={comment.id || index} style={styles.commentItem}>
                    {comment.author?.profile?.avatarUrl ? (
                      <Image
                        source={{ uri: comment.author.profile.avatarUrl }}
                        style={styles.commentAvatarImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>
                          {(comment.author?.name || comment.author?.username || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                          {comment.author?.name || comment.author?.username || 'Unknown User'}
                        </Text>
                        <Text style={styles.commentTimestamp}>
                          {formatDate(comment.timestamp)}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      )}

      {/* Inline Comment Input */}
      {showCommentInput && (
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor={Colors.light.secondaryText}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.commentSubmitButton,
              (!commentText.trim() || isSubmittingComment) && styles.commentSubmitButtonDisabled
            ]}
            onPress={handleCommentSubmit}
            disabled={!commentText.trim() || isSubmittingComment}
          >
            <Ionicons
              name="send"
              size={18}
              color={commentText.trim() && !isSubmittingComment ? Colors.light.primary : Colors.light.secondaryText}
            />
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
};

export default Activity;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight + '80',
    overflow: 'hidden',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.96,
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.borderLight,
  },
  authorAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.light.onPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  authorTextContainer: {
    flex: 1,
  },
  nameTimestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 15,
    color: Colors.light.text,
  },
  timestampInline: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '400',
  },
  menuButton: {
    padding: 4,
  },

  // Overflow Menu
  menuOverlay: {
    position: 'absolute',
    top: 50,
    right: 14,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.borderLight + '30',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  menuItemTextDanger: {
    color: '#EF4444',
  },

  // Content Body
  contentBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.secondaryText,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.light.text,
    fontWeight: '400',
  },

  // Post Image - Full Width
  postImage: {
    width: '100%',
    height: 320,
    backgroundColor: Colors.light.borderLight + '20',
  },

  // Metadata Section
  metadataSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 10,
  },

  // Streak Badge
  streakBadge: {
    backgroundColor: '#FFF4ED',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },

  // Badges Container
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  // Rest Activity Badge
  activityBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // Muscle Badge
  muscleBadge: {
    backgroundColor: Colors.light.primary + '12',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  muscleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },

  // Stats Text
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  statsText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '600',
  },
  tapHintText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '500',
    opacity: 0.7,
    fontStyle: 'italic',
  },

  // Social Actions Row
  actionsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.borderLight + '30',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  actionCount: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  likedCount: {
    color: '#EF4444',
  },

  // View Comments Button
  viewCommentsButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewCommentsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },

  // Comments Section
  commentsSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.borderLight + '30',
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  hideCommentsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  commentsLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    paddingVertical: 12,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.primary + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.borderLight,
  },
  commentAvatarText: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  commentTimestamp: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '400',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },

  // Comment Input
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.borderLight + '30',
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.light.borderLight + '25',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    maxHeight: 100,
  },
  commentSubmitButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSubmitButtonDisabled: {
    opacity: 0.5,
  },
});
