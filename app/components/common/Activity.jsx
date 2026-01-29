import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Pressable, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { deletePost, likePost, unlikePost } from '../../api/postsApi';
import { createLikeNotification, deleteLikeNotification } from '../../api/notificationsApi';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import CommentModal from './CommentModal';
import SocialActions from './SocialActions';

const SCREEN_WIDTH = Dimensions.get('window').width;

const Activity = ({ post, currentUserId, onPostUpdated, onPostDeleted, initialOpenComments = false }) => {
  const colors = useThemeColors();
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
    isSplitCompleted,
    _count,
    likes = [],
    taggedUsers = [],
  } = post;

  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [localLikeCount, setLocalLikeCount] = useState(_count?.likes || 0);
  const [localCommentCount, setLocalCommentCount] = useState(_count?.comments || 0);
  const [isLiked, setIsLiked] = useState(
    likes?.some(like => like.userId === currentUserId) || false
  );
  const isLikingRef = useRef(false);

  useEffect(() => {
    const likedFromServer = likes?.some(like => like.userId === currentUserId) || false;
    setIsLiked(likedFromServer);
    setLocalLikeCount(_count?.likes || 0);
    setLocalCommentCount(_count?.comments || 0);
  }, [likes, _count?.likes, _count?.comments, currentUserId]);

  useEffect(() => {
    if (initialOpenComments) {
      setShowCommentsModal(true);
    }
  }, [initialOpenComments]);

  const isOwnPost = currentUserId && author?.id === currentUserId;
  const isRestDay = type === 'rest_day' || (!workoutSession && description && description.includes('Recovery:'));

  const workoutData = workoutSession ? {
    dayName: workoutSession.dayName || workoutSession.workoutName || split?.name || 'Workout',
    weekNumber: workoutSession.weekNumber,
    dayNumber: workoutSession.dayNumber,
    exercises: workoutSession.exercises?.map(ex => ({
      name: ex.exerciseName || ex.name,
      sets: ex.sets || []
    })) || []
  } : null;

  const totalSets = workoutData?.exercises?.reduce((acc, ex) => {
    return acc + (Array.isArray(ex.sets) ? ex.sets.length : parseInt(ex.sets) || 0);
  }, 0) || 0;

  const restActivities = isRestDay && description ? (() => {
    const match = description.match(/Recovery:\s*(.+?)(?:\n|$)/);
    if (match) {
      return match[1].split(',').map(activity => activity.trim());
    }
    return [];
  })() : [];

  const musclesWorked = workoutData?.exercises ? (() => {
    const muscles = new Set();
    workoutData.exercises.forEach(exercise => {
      const exerciseName = (exercise.name || '').toLowerCase();
      if (exerciseName.includes('bench') || exerciseName.includes('press') || exerciseName.includes('chest')) muscles.add('Chest');
      if (exerciseName.includes('pull') || exerciseName.includes('row') || exerciseName.includes('back')) muscles.add('Back');
      if (exerciseName.includes('squat') || exerciseName.includes('leg') || exerciseName.includes('quad')) muscles.add('Legs');
      if (exerciseName.includes('shoulder') || exerciseName.includes('lateral') || exerciseName.includes('overhead')) muscles.add('Shoulders');
      if (exerciseName.includes('curl') || exerciseName.includes('bicep')) muscles.add('Biceps');
      if (exerciseName.includes('tricep') || exerciseName.includes('dip') || exerciseName.includes('extension')) muscles.add('Triceps');
      if (exerciseName.includes('deadlift')) { muscles.add('Back'); muscles.add('Legs'); }
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
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    } else if (diffInDays < 365) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCardPress = () => {
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
    if (isLikingRef.current) return;
    isLikingRef.current = true;
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLocalLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    try {
      if (wasLiked) {
        await unlikePost(id, currentUserId);
        await deleteLikeNotification(currentUserId, id);
      } else {
        await likePost(id, currentUserId);
        if (author?.id && author.id !== currentUserId) {
          await createLikeNotification(author.id, currentUserId, id);
        }
      }
      if (onPostUpdated) {
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
      setIsLiked(wasLiked);
      setLocalLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      Alert.alert('Error', 'Failed to update like');
    } finally {
      isLikingRef.current = false;
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
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(id);
            if (onPostDeleted) onPostDeleted(id);
            Alert.alert('Success', 'Post deleted successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete post');
          }
        },
      },
    ]);
  };

  const handleCommentCountChange = (newCount) => {
    setLocalCommentCount(newCount);
    if (onPostUpdated) {
      onPostUpdated({ ...post, _count: { ...post._count, comments: newCount } });
    }
  };

  const [showMenu, setShowMenu] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [descriptionNeedsTruncation, setDescriptionNeedsTruncation] = useState(false);
  const [showExpandedImage, setShowExpandedImage] = useState(false);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, shadowColor: colors.shadow },
        pressed && !isRestDay && styles.cardPressed
      ]}
      onPress={handleCardPress}
      android_ripple={{ color: colors.borderLight }}
      disabled={isRestDay}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.authorInfo} onPress={handleProfilePress} activeOpacity={0.7}>
          <Avatar
            uri={author?.profile?.avatarUrl}
            name={author?.name || author?.username}
            size={38}
          />
          <View style={styles.authorTextContainer}>
            <View style={styles.nameTimestampRow}>
              <Text style={[styles.authorName, { color: colors.text }]}>{author?.name || author?.username || 'Unknown User'}</Text>
              {author?.profile?.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" style={styles.verifiedBadge} />
              )}
              <Text style={[styles.timestampInline, { color: colors.secondaryText }]}>· {formatDate(createdAt)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isOwnPost && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Overflow Menu */}
      {showMenu && isOwnPost && (
        <View style={[styles.menuOverlay, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { setShowMenu(false); handleEditPost(); }}
          >
            <Ionicons name="pencil" size={18} color={colors.text} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Post</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={() => { setShowMenu(false); handleDeletePost(); }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>Delete Post</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content Body */}
      <View style={[styles.contentBody, !imageUrl && styles.contentBodyNoImage]}>
        <Text style={[styles.typeLabel, { color: isRestDay ? colors.accent : colors.primary }]}>{isRestDay ? 'REST DAY' : 'WORKOUT'}</Text>
        {isRestDay ? (
          <Text style={[styles.workoutName, { color: colors.text }]}>Rest & Recover</Text>
        ) : (
          <Text style={[styles.workoutName, { color: colors.text }]}>
            {title || workoutData?.dayName || 'Workout'}
          </Text>
        )}
        {description && (
          <View>
            <Text
              style={[styles.description, { color: colors.secondaryText }]}
              numberOfLines={isDescriptionExpanded ? undefined : 4}
              ellipsizeMode="tail"
              onTextLayout={(e) => {
                if (!isDescriptionExpanded && e.nativeEvent.lines.length > 4) {
                  setDescriptionNeedsTruncation(true);
                }
              }}
            >
              {isRestDay ? description.replace(/Recovery:\s*.+?(?:\n|$)/, '').trim() || 'Took a rest day' : description}
            </Text>
            {descriptionNeedsTruncation && (
              <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)} activeOpacity={0.7}>
                <Text style={[styles.showMoreText, { color: colors.primary }]}>
                  {isDescriptionExpanded ? 'show less' : 'show more'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Post Image */}
      {imageUrl && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowExpandedImage(true)}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.postImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        </TouchableOpacity>
      )}

      {/* Metadata Section */}
      <View style={[styles.metadataSection, !imageUrl && styles.metadataSectionNoImage]}>
        {(streak > 1 || isSplitCompleted) && (
          <View style={styles.topBadgesRow}>
            {streak && streak > 1 && (
              <Badge label={`🔥 ${streak}-day streak`} color={colors.warning} />
            )}
            {isSplitCompleted && (
              <Badge label="🎉 Split Completed" color="#8B5CF6" />
            )}
          </View>
        )}

        {taggedUsers && taggedUsers.length > 0 && (
          <View style={styles.taggedBadgesContainer}>
            {taggedUsers.map((taggedUser) => (
              <Badge
                key={taggedUser.id}
                label={`🏋️ @${taggedUser.username}`}
                color={colors.primary}
                onPress={() => router.push(`/user/${taggedUser.username}`)}
              />
            ))}
          </View>
        )}

        <View style={styles.badgesContainer}>
          {isRestDay && restActivities && restActivities.length > 0 && restActivities.map((activity, index) => (
            <Badge key={index} label={activity} color={colors.accent} />
          ))}
          {!isRestDay && musclesWorked && musclesWorked.length > 0 && musclesWorked.map((muscle, index) => (
            <Badge key={index} label={muscle} color={colors.primary} />
          ))}
        </View>

        {workoutData && !isRestDay && (
          <View style={styles.statsRow}>
            <Text style={[styles.statsText, { color: colors.secondaryText }]}>
              {totalSets} {totalSets === 1 ? 'set' : 'sets'} • {workoutData.exercises?.length || 0} {workoutData.exercises?.length === 1 ? 'exercise' : 'exercises'}
            </Text>
            <Text style={[styles.tapHintText, { color: colors.secondaryText }]}>• Tap to view...</Text>
          </View>
        )}
      </View>

      {/* Social Actions */}
      <SocialActions
        isLiked={isLiked}
        likeCount={localLikeCount}
        commentCount={localCommentCount}
        onLike={handleLike}
        onComment={() => setShowCommentsModal(true)}
      />

      {/* Comments Modal */}
      <CommentModal
        visible={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        postId={id}
        postAuthorId={author?.id}
        currentUserId={currentUserId}
        comments={comments}
        setComments={setComments}
        commentCount={localCommentCount}
        onCommentCountChange={handleCommentCountChange}
      />

      {/* Expanded Image Modal */}
      <Modal
        visible={showExpandedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExpandedImage(false)}
      >
        <TouchableOpacity
          style={styles.expandedImageOverlay}
          activeOpacity={1}
          onPress={() => setShowExpandedImage(false)}
        >
          <View style={styles.expandedImageContainer}>
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.expandedImage}
                contentFit="contain"
                transition={200}
              />
            )}
          </View>
          <TouchableOpacity
            style={styles.expandedImageCloseButton}
            onPress={() => setShowExpandedImage(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    borderColor: Colors.light.border,
    overflow: 'hidden',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardPressed: {
    opacity: 0.96,
  },
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
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  timestampInline: {
    fontSize: 13,
    fontWeight: '400',
  },
  menuButton: {
    padding: 4,
  },
  menuOverlay: {
    position: 'absolute',
    top: 50,
    right: 14,
    borderRadius: 12,
    borderWidth: 1,
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
  },
  contentBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  contentBodyNoImage: {
    paddingBottom: 0,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  postImage: {
    width: '100%',
    height: 320,
    backgroundColor: Colors.light.borderLight + '20',
  },
  metadataSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 10,
  },
  metadataSectionNoImage: {
    paddingTop: 6,
  },
  topBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  taggedBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  statsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  expandedImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  expandedImage: {
    width: '100%',
    height: '100%',
  },
  expandedImageCloseButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
