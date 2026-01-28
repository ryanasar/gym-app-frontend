import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { searchUsers } from './api/usersApi';
import { useAuth } from './auth/auth';
import EmptyState from './components/common/EmptyState';
import { useThemeColors } from './hooks/useThemeColors';
import Avatar from './components/ui/Avatar';

export default function SearchScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const results = await searchUsers(searchQuery, user?.id);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user?.id]);

  const handleUserPress = (username) => {
    router.push(`/user/${username}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button + search input */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.secondaryText} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search users..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {searchResults.length > 0 ? (
          <View style={styles.resultsContainer}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={[styles.userCard, { backgroundColor: colors.cardBackground, borderColor: colors.border, shadowColor: colors.shadow }]}
                onPress={() => handleUserPress(result.username)}
                activeOpacity={0.7}
              >
                <View style={styles.userInfo}>
                  <Avatar uri={result.profile?.avatarUrl} name={result.name || result.username} size={48} style={{ marginRight: 12 }} />
                  <View style={styles.userDetails}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.userName, { color: colors.text }]}>{result.name || result.username}</Text>
                      {result.profile?.isVerified && (
                        <Ionicons name="checkmark-circle" size={16} color="#1D9BF0" style={styles.verifiedBadge} />
                      )}
                    </View>
                    <Text style={[styles.userUsername, { color: colors.secondaryText }]}>@{result.username}</Text>
                    {result.profile?.bio && (
                      <Text style={[styles.userBio, { color: colors.secondaryText }]} numberOfLines={1}>
                        {result.profile.bio}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.userStats}>
                  <Text style={[styles.userStat, { color: colors.secondaryText }]}>
                    {result._count?.posts || 0} posts
                  </Text>
                  <Text style={[styles.userStat, { color: colors.secondaryText }]}>
                    {result._count?.followedBy || 0} followers
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : searchQuery.trim() && !isSearching ? (
          <EmptyState
            emoji="😕"
            title="No users found"
            message="Try searching for a different username"
          />
        ) : !searchQuery.trim() ? (
          <EmptyState
            emoji="🔍"
            title="Discover new users"
            message="Search for users to follow and see their workouts"
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  resultsContainer: {
    padding: 16,
  },
  userCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  verifiedBadge: {
    marginLeft: 4,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    marginBottom: 4,
  },
  userBio: {
    fontSize: 13,
    marginTop: 2,
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
  },
  userStat: {
    fontSize: 13,
    fontWeight: '500',
  },
});
