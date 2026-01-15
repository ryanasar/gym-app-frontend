import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { getFollowers, getFollowing } from '../../api/usersApi';

const FollowListModal = ({ visible, onClose, username, type }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (visible && username) {
      loadUsers();
    }
  }, [visible, username, type]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = type === 'followers'
        ? await getFollowers(username)
        : await getFollowing(username);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPress = (userUsername) => {
    onClose();
    router.push(`/user/${userUsername}`);
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item.username)}
    >
      <View style={styles.avatarContainer}>
        {item.profile?.avatarUrl ? (
          <Image
            source={{ uri: item.profile.avatarUrl }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: Colors.light.primary }]}>
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.username}>@{item.username}</Text>
        {item.profile?.bio && (
          <Text style={styles.bio} numberOfLines={1}>
            {item.profile.bio}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={Colors.light.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {type === 'followers' ? 'Followers' : 'Following'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : users.length > 0 ? (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item, index) => item?.id?.toString() || `user-${index}`}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={Colors.light.secondaryText} />
            <Text style={styles.emptyText}>
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerPlaceholder: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    marginBottom: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.borderLight,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 2,
  },
  bio: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default FollowListModal;
