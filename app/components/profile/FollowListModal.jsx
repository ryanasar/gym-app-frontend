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
import { useThemeColors } from '../../hooks/useThemeColors';
import { getFollowers, getFollowing } from '../../api/usersApi';
import EmptyState from '../common/EmptyState';

const FollowListModal = ({ visible, onClose, username, type }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const colors = useThemeColors();

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
      style={[styles.userItem, { backgroundColor: colors.cardBackground }]}
      onPress={() => handleUserPress(item.username)}
    >
      <View style={styles.avatarContainer}>
        {item.profile?.avatarUrl ? (
          <Image
            source={{ uri: item.profile.avatarUrl }}
            style={[styles.avatarImage, { backgroundColor: colors.borderLight }]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.name || 'Unknown'}</Text>
          {item.profile?.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" style={styles.verifiedBadge} />
          )}
        </View>
        <Text style={[styles.username, { color: colors.secondaryText }]}>@{item.username}</Text>
        {item.profile?.bio && (
          <Text style={[styles.bio, { color: colors.secondaryText }]} numberOfLines={1}>
            {item.profile.bio}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {type === 'followers' ? 'Followers' : 'Following'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : users.length > 0 ? (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item, index) => item?.id?.toString() || `user-${index}`}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState
            icon="people-outline"
            title={type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            message={type === 'followers' ? 'When someone follows this user, they will appear here' : 'Users this person follows will appear here'}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  verifiedBadge: {
    marginLeft: 4,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 2,
  },
  bio: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default FollowListModal;
