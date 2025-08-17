import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

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
}) => {
  const colorScheme = 'light'; // or dynamically from context/theme

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        {/* Profile Picture */}
        <View style={styles.profilePicture}>
          <View style={[styles.profileInitialContainer, { backgroundColor: Colors[colorScheme].tabIconDefault }]}>
            <Text style={[styles.profileInitial, { color: Colors[colorScheme].text }]}>
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
  container: {},
  profileSection: {
    flexDirection: 'row',
    padding: 16,
  },
  profilePicture: {
    marginRight: 16,
  },
  profileInitialContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
    marginBottom: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  editButtonText: {
    fontSize: 14,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
    marginRight: 4,
  },
  followButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  followButtonText: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
  },
  bioContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
});
