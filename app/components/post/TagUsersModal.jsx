import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { searchUsers } from '../../api/usersApi';

const TagUsersModal = ({ visible, onClose, selectedUsers = [], onUsersSelected, currentUserId }) => {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localSelectedUsers, setLocalSelectedUsers] = useState(selectedUsers);

  // Sync local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalSelectedUsers(selectedUsers);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible, selectedUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsLoading(true);
    try {
      const results = await searchUsers(query, currentUserId);
      // Filter out current user from results
      const filteredResults = results.filter(user => user.id !== currentUserId);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isUserSelected = useCallback((userId) => {
    return localSelectedUsers.some(user => user.id === userId);
  }, [localSelectedUsers]);

  const handleUserToggle = (user) => {
    setLocalSelectedUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, {
          id: user.id,
          username: user.username,
          name: user.name,
          profile: user.profile,
        }];
      }
    });
  };

  const handleDone = () => {
    onUsersSelected(localSelectedUsers);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const renderUser = ({ item }) => {
    const selected = isUserSelected(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          { backgroundColor: colors.cardBackground },
          selected && { backgroundColor: colors.primary + '10' },
        ]}
        onPress={() => handleUserToggle(item)}
        activeOpacity={0.7}
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
                {(item.name || item.username || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.name || item.username || 'Unknown'}
          </Text>
          <Text style={[styles.username, { color: colors.secondaryText }]}>
            @{item.username}
          </Text>
        </View>

        <View style={[
          styles.checkbox,
          { borderColor: selected ? colors.primary : colors.border },
          selected && { backgroundColor: colors.primary },
        ]}>
          {selected && (
            <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedUsers = () => {
    if (localSelectedUsers.length === 0) return null;

    return (
      <View style={[styles.selectedContainer, { borderBottomColor: colors.borderLight }]}>
        <FlatList
          horizontal
          data={localSelectedUsers}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectedList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.selectedUserChip, { backgroundColor: colors.primary + '15' }]}
              onPress={() => handleUserToggle(item)}
            >
              <Text style={[styles.selectedUserText, { color: colors.primary }]}>
                @{item.username}
              </Text>
              <Ionicons name="close" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderEmptyState = () => {
    if (searchQuery.trim().length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={colors.secondaryText + '50'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Search for users
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
            Type a name or username to find workout partners to tag
          </Text>
        </View>
      );
    }

    if (!isLoading && searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={48} color={colors.secondaryText + '50'} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No users found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.secondaryText }]}>
            Try searching with a different name
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={[styles.cancelText, { color: colors.secondaryText }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tag Users</Text>
          <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
            <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.borderLight + '40' }]}>
            <Ionicons name="search" size={18} color={colors.secondaryText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search by name or username"
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Selected Users */}
        {renderSelectedUsers()}

        {/* Search Results */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderUser}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
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
    paddingVertical: 14,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  closeButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  doneButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.light.cardBackground,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.borderLight + '40',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  selectedContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    paddingVertical: 12,
  },
  selectedList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '15',
    borderRadius: 16,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 4,
    marginRight: 8,
  },
  selectedUserText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
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
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.borderLight,
  },
  avatarText: {
    fontSize: 18,
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
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TagUsersModal;
