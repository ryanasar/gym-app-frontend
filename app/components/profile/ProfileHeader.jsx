import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import SettingsDropdown from './SettingsDropdown';

const ProfileHeader = ({
  username,
  name,
  bio,
  avatarUrl,
  followedBy,
  following,
  workouts,
  isOwnProfile,
  isFollowing,
  isPrivate,
  isVerified,
  onSignOut,
  onFollowToggle,
  isFollowLoading,
  onFollowersPress,
  onFollowingPress,
  onEditPress,
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {/* Combined Profile Section */}
      <View style={[styles.profileContainer, { backgroundColor: colors.cardBackground }]}>
        {/* Settings Dropdown - Top Right */}
        {isOwnProfile && (
          <View style={styles.settingsContainer}>
            <SettingsDropdown onSignOut={onSignOut} />
          </View>
        )}

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Profile Picture */}
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={[styles.profileImage, { shadowColor: colors.shadow }]}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.profileInitialContainer, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}>
                <Text style={[styles.profileInitial, { color: colors.onPrimary }]}>
                  {name ? name.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            {/* Username */}
            <View style={styles.usernameRow}>
              <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>@{username}</Text>
              {isVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#1D9BF0" style={styles.verifiedBadge} />
              )}
            </View>

            {/* Edit Profile Button / Follow Button */}
            {isOwnProfile ? (
              <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, shadowColor: colors.shadow }]} onPress={onEditPress}>
                <Text style={[styles.editButtonText, { color: colors.text }]}>Edit profile</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  { backgroundColor: colors.primary, shadowColor: colors.primary },
                  isFollowing && [styles.followingButton, { backgroundColor: colors.cardBackground, borderColor: colors.border, shadowColor: colors.shadow }],
                  isFollowLoading && styles.buttonLoading
                ]}
                onPress={onFollowToggle}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={isFollowing ? colors.text : colors.onPrimary}
                  />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: colors.onPrimary },
                      isFollowing && { color: colors.text }
                    ]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{workouts || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Posts</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <TouchableOpacity style={styles.statItem} onPress={onFollowersPress} activeOpacity={0.7}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{followedBy || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Followers</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
          <TouchableOpacity style={styles.statItem} onPress={onFollowingPress} activeOpacity={0.7}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{following || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Following</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />
        </View>
      </View>

      {/* Bio */}
      {bio ? (
        <>
          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={[styles.bioContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.bio, { color: colors.text }]} numberOfLines={2}>
              {bio}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  container: {
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    position: 'relative',
  },
  settingsContainer: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 14,
  },
  profileInitialContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  profileInitial: {
    fontSize: 26,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    marginLeft: 6,
  },
  editButton: {
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'flex-start',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  followingButton: {
    borderWidth: 1.5,
    shadowOpacity: 0.05,
  },
  followingButtonText: {
  },
  buttonLoading: {
    opacity: 0.7,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
  bioContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
});
