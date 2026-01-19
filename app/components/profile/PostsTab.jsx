import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSync } from '../../contexts/SyncContext';
import Activity from '../common/Activity';
import EmptyState from '../common/EmptyState';

const ActivitiesTab = ({ posts, currentUserId, onRefresh }) => {
  const colors = useThemeColors();
  const [localPosts, setLocalPosts] = useState(posts);
  const [refreshing, setRefreshing] = useState(false);
  const { manualSync } = useSync();

  React.useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  const handlePostUpdated = (updatedPost) => {
    setLocalPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
    // Don't refresh from backend - we already have the updated post locally
  };

  const handlePostDeleted = (deletedPostId) => {
    setLocalPosts((prevPosts) => prevPosts.filter((post) => post.id !== deletedPostId));
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleRefreshPosts = async () => {
    setRefreshing(true);
    // Trigger sync on pull-to-refresh
    manualSync();
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  if (!localPosts || localPosts.length === 0) {
    return (
      <EmptyState
        emoji="📝"
        title="No Posts yet"
        message="Start working out to see your activities here"
      />
    );
  }

  return (
    <FlatList
      data={localPosts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <Activity
          post={item}
          currentUserId={currentUserId}
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefreshPosts} tintColor={colors.primary} />
      }
      initialNumToRender={10}
      windowSize={10}
      maxToRenderPerBatch={10}
    />
  );
};

export default ActivitiesTab;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 120,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: Colors.light.borderLight + '60',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 28,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    paddingHorizontal: 8,
  },
  listContainer: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
});
