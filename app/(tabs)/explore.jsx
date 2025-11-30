import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Colors } from '../constants/colors';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Explore</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users, workouts..."
            placeholderTextColor={Colors.light.placeholder}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
          </View>
          <Text style={styles.emptyTitle}>Discover new workouts</Text>
          <Text style={styles.emptySubtitle}>
            Search for users, exercises, and splits to expand your fitness journey
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
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: Colors.light.secondaryText,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
