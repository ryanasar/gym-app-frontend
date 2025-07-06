import React from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import Activity from '../common/Activity';

const ActivitiesTab = ({ posts, loading }) => {
  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  if (!posts || posts.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No posts</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <Activity post={item} />}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
};

export default ActivitiesTab;

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    marginTop: 20,
  },
});
