import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../../constants/colors';
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
  onSignOut,
  onFollowToggle,
  isFollowLoading,
  onFollowersPress,
  onFollowingPress,
  onEditPress,
}) => {
  const colorScheme = 'light'; // or dynamically from context/theme

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {/* Combined Profile Section */}
      <View style={styles.profileContainer}>
        {/* Settings Dropdown - Top Right */}
        {isOwnProfile && (
          <View style={styles.settingsContainer}>
            <SettingsDropdown onSignOut={onSignOut} colorScheme={colorScheme} />
          </View>
        )}

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Profile Picture */}
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.profileImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.profileInitialContainer, { backgroundColor: Colors[colorScheme].primary }]}>
                <Text style={[styles.profileInitial, { color: Colors[colorScheme].onPrimary }]}>
                  {name ? name.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            {/* Username */}
            <Text style={[styles.username, { color: Colors[colorScheme].text }]} numberOfLines={1}>@{username}</Text>

            {/* Edit Profile Button / Follow Button */}
            {isOwnProfile ? (
              <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
                <Text style={styles.editButtonText}>Edit profile</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                  isFollowLoading && styles.buttonLoading
                ]}
                onPress={onFollowToggle}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={isFollowing ? Colors.light.text : '#FFFFFF'}
                  />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText
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
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>{workouts || 0}</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme].secondaryText }]}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={onFollowersPress} activeOpacity={0.7}>
            <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>{followedBy || 0}</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme].secondaryText }]}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={onFollowingPress} activeOpacity={0.7}>
            <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>{following || 0}</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme].secondaryText }]}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
        </View>
      </View>

      {/* Bio */}
      {bio ? (
        <>
          {/* Divider */}
          <View style={styles.divider} />

          <View style={styles.bioContainer}>
            <Text style={[styles.bio, { color: Colors[colorScheme].text }]} numberOfLines={2}>
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
    backgroundColor: Colors.light.cardBackground,
  },
  profileContainer: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 0,
    position: 'relative',
  },
  settingsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  profileInitialContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  profileInitial: {
    fontSize: 30,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  editButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  followButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  followingButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOpacity: 0.05,
  },
  followingButtonText: {
    color: Colors.light.text,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.borderLight,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
  bioContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.light.cardBackground,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
});
