import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const SocialActions = ({ isLiked, likeCount, commentCount, onLike, onComment }) => {
  const colors = useThemeColors();

  return (
    <>
      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={onLike}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? colors.error : colors.secondaryText}
          />
          {likeCount > 0 && (
            <Text style={[styles.actionCount, { color: colors.secondaryText }, isLiked && { color: colors.error }]}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionItem}
          onPress={onComment}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.secondaryText} />
          {commentCount > 0 && (
            <Text style={[styles.actionCount, { color: colors.secondaryText }]}>{commentCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* View Comments Link */}
      {commentCount > 0 && (
        <TouchableOpacity style={styles.viewCommentsButton} onPress={onComment}>
          <Text style={[styles.viewCommentsText, { color: colors.secondaryText }]}>
            View {commentCount === 1 ? 'comment' : `all ${commentCount} comments`}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
};

export default SocialActions;

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewCommentsButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewCommentsText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
