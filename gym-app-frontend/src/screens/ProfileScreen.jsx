// frontend/screens/ProfileScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';

const ProfileScreen = ({ route }) => {
  const { username } = route.params; // Passed in navigation
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/users/${username}`);
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>User not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.username}>@{user.username}</Text>
      <Text style={styles.name}>{user.name}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Bio:</Text>
        <Text style={styles.value}>{user.Profile?.bio || 'No bio set.'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Private Profile:</Text>
        <Text style={styles.value}>{user.Profile?.isPrivate ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Followers:</Text>
        <Text style={styles.value}>{user.followedBy?.length || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Following:</Text>
        <Text style={styles.value}>{user.following?.length || 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Joined:</Text>
        <Text style={styles.value}>{new Date(user.createdAt).toLocaleDateString()}</Text>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    color: 'gray',
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
  value: {
    fontSize: 16,
  },
});
