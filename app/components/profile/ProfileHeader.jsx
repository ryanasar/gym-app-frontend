import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import SettingsDropdown from './SettingsDropdown';

const ProfileHeader = ({
  username,
  name,
  bio,
  followedBy,
  following,
  workouts,
  isOwnProfile,
  isFollowing,
  isPrivate,
  onSignOut,
}) => {
  const colorScheme = 'light'; // or dynamically from context/theme

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {/* Settings Dropdown - Top Right */}
      {isOwnProfile && (
        <View style={styles.settingsContainer}>
          <SettingsDropdown onSignOut={onSignOut} colorScheme={colorScheme} />
        </View>
      )}

      {/* Profile Section */}
      <View style={styles.profileSection}>
        {/* Profile Picture */}
        <View style={styles.profilePicture}>
          <View style={[styles.profileInitialContainer, { backgroundColor: Colors[colorScheme].primary }]}>
            <Text style={[styles.profileInitial, { color: Colors[colorScheme].onPrimary }]}>
              {name ? name.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {/* Username and Actions */}
          <Text style={[styles.username, { color: Colors[colorScheme].text }]}>@{username}</Text>
          <View style={styles.actionsContainer}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: Colors[colorScheme].tabIconDefault }]}>
                  <Text style={[styles.editButtonText, { color: Colors[colorScheme].text }]}>Edit profile</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing
                      ? { backgroundColor: Colors[colorScheme].tabIconDefault }
                      : { backgroundColor: Colors[colorScheme].tint },
                  ]}
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      { color: isFollowing ? Colors[colorScheme].text : Colors[colorScheme].background },
                    ]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editButton, { backgroundColor: Colors[colorScheme].tabIconDefault }]}>
                  <Text style={[styles.editButtonText, { color: Colors[colorScheme].text }]}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconButton, { backgroundColor: Colors[colorScheme].tabIconDefault }]}>
                  <Text>➕</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconButton, { backgroundColor: Colors[colorScheme].tabIconDefault }]}>
                  <Text>⋯</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>{workouts || 0}</Text>
              <Text style={[styles.statLabel, { color: Colors[colorScheme].secondaryText }]}>Activities</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>{followedBy || 0}</Text>
              <Text style={[styles.statLabel, { color: Colors[colorScheme].secondaryText }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors[colorScheme].text }]}>{following || 0}</Text>
              <Text style={[styles.statLabel, { color: Colors[colorScheme].secondaryText }]}>Following</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bio */}
      {bio ? (
        <View style={styles.bioContainer}>
          <Text style={[styles.bio, { color: Colors[colorScheme].text }]}>{bio}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    marginBottom: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    padding: 20,
  },
  profilePicture: {
    marginRight: 20,
  },
  profileInitialContainer: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInitial: {
    fontSize: 34,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.borderLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.light.borderLight,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  followButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  bioContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    marginTop: 4,
    paddingTop: 16,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
});
