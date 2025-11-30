import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const PRsTab = ({ userId, personalRecords }) => {
  if (!personalRecords || personalRecords.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>🏆</Text>
        </View>
        <Text style={styles.emptyTitle}>No personal records yet</Text>
        <Text style={styles.emptySubtitle}>Complete workouts to start tracking your PRs</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.comingSoonText}>Personal Records coming soon!</Text>
    </View>
  );
}

export default PRsTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
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
  comingSoonText: {
    fontSize: 18,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
});