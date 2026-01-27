import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  FlatList,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getFollowers, getFollowing } from '../../api/usersApi';
import EmptyState from '../common/EmptyState';
import ModalHeader from '../ui/ModalHeader';
import UserListItem from '../ui/UserListItem';
import LoadingSpinner from '../ui/LoadingSpinner';

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
    <UserListItem
      user={{
        name: item.name,
        username: item.username,
        avatarUrl: item.profile?.avatarUrl,
        isVerified: item.profile?.isVerified,
        bio: item.profile?.bio,
      }}
      onPress={() => handleUserPress(item.username)}
      rightAction={
        <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
      }
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ModalHeader
          title={type === 'followers' ? 'Followers' : 'Following'}
          onClose={onClose}
        />

        {isLoading ? (
          <LoadingSpinner fullScreen />
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
  listContent: {
    paddingVertical: 8,
  },
});

export default FollowListModal;
