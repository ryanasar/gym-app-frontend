import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/auth';
import { useSync } from '../contexts/SyncContext';
import { getFollowingPosts } from '../api/postsApi';
import Activity from '../components/common/Activity';

export default function FollowingScreen() {
  const { user } = useAuth();
  const { manualSync } = useSync();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPosts();
    }
  }, [user?.id]);

  // Refresh feed when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id && posts.length > 0) {
        loadPosts(true);
      }
    }, [user?.id])
  );

  const loadPosts = async (refresh = false) => {
    if (!user?.id) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await getFollowingPosts(user.id, null, 10);
      setPosts(response.posts || []);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Error loading following posts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadMorePosts = async () => {
    if (!user?.id || !hasMore || isLoadingMore || !nextCursor) return;

    try {
      setIsLoadingMore(true);
      const response = await getFollowingPosts(user.id, nextCursor, 10);
      setPosts(prevPosts => [...prevPosts, ...(response.posts || [])]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    // Trigger sync on pull-to-refresh
    manualSync();
    await loadPosts(true);
  };

  const handlePostUpdated = (updatedPost) => {
    // Update post in local state instead of reloading from backend
    setPosts(prevPosts =>
      prevPosts.map(post => post.id === updatedPost.id ? updatedPost : post)
    );
  };

  const handlePostDeleted = () => {
    loadPosts(true);
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        No new workouts yet — go lift or hype a friend 💪
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Following</Text>
          <Text style={styles.subtitle}>Friends' workouts</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Following</Text>
        <Text style={styles.subtitle}>Friends' workouts</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <Activity
            post={item}
            currentUserId={user?.id}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        contentContainerStyle={posts.length === 0 ? styles.emptyListContainer : styles.listContainer}
        initialNumToRender={5}
        windowSize={7}
        removeClippedSubviews
        maxToRenderPerBatch={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: Colors.light.cardBackground,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
