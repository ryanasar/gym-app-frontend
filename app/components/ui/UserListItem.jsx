import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';
import Avatar from './Avatar';

const UserListItem = ({ user, onPress, rightAction, style }) => {
  const colors = useThemeColors();
  const displayName = user.name || user.username || 'Unknown';
  const avatarUrl = user.avatarUrl || user.profile?.avatarUrl;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.cardBackground }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar uri={avatarUrl} name={displayName} size={44} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          {user.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.verifiedIcon} />
          )}
        </View>
        {user.username && (
          <Text style={[styles.username, { color: colors.secondaryText }]} numberOfLines={1}>
            @{user.username}
          </Text>
        )}
        {user.bio && (
          <Text style={[styles.bio, { color: colors.secondaryText }]} numberOfLines={1}>
            {user.bio}
          </Text>
        )}
      </View>
      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  verifiedIcon: {
    marginLeft: Spacing.xs,
  },
  username: {
    fontSize: FontSize.body,
    marginTop: 1,
  },
  bio: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  rightAction: {
    marginLeft: Spacing.md,
  },
});

export default UserListItem;
