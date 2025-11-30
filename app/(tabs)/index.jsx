import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';

export default function FollowingScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Following</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
          </View>
          <Text style={styles.emptyTitle}>No posts from friends yet</Text>
          <Text style={styles.emptySubtitle}>
            Follow other users to see their workout activities here
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 100,
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
});
