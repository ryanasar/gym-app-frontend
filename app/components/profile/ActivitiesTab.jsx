import React from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import Activity from '../common/Activity';
import { Colors } from '../../constants/colors';

const ActivitiesTab = ({ posts }) => {

  if (!posts || posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
        </View>
        <Text style={styles.emptyTitle}>No activities yet</Text>
        <Text style={styles.emptySubtitle}>Start working out to see your activities here</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <Activity post={item} />}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default ActivitiesTab;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
});
