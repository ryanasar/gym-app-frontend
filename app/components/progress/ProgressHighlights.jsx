import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const ProgressHighlights = ({ highlights = [] }) => {
  const defaultHighlights = [
    {
      icon: '🏋️‍♂️',
      title: 'Heaviest Squat',
      value: highlights.find(h => h.type === 'heaviestSquat')?.value || 'No data',
    },
    {
      icon: '💪',
      title: 'Heaviest Bench Press',
      value: highlights.find(h => h.type === 'heaviestBench')?.value || 'No data',
    },
    {
      icon: '🔥',
      title: 'Most Volume in One Day',
      value: highlights.find(h => h.type === 'maxVolume')?.value || 'No data',
    },
    {
      icon: '⏱️',
      title: 'Longest Streak',
      value: highlights.find(h => h.type === 'longestStreak')?.value || 'No data',
    },
    {
      icon: '📊',
      title: 'Total Workouts',
      value: highlights.find(h => h.type === 'totalWorkouts')?.value || '0',
    },
    {
      icon: '💯',
      title: 'Total Sets Completed',
      value: highlights.find(h => h.type === 'totalSets')?.value || '0',
    },
  ];

  const HighlightItem = ({ icon, title, value }) => (
    <View style={styles.highlightItem}>
      <View style={styles.highlightIconContainer}>
        <Text style={styles.highlightIcon}>{icon}</Text>
      </View>
      <View style={styles.highlightContent}>
        <Text style={styles.highlightTitle}>{title}</Text>
        <Text style={styles.highlightValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Highlights</Text>
        <Text style={styles.subtitle}>Your best lifts and milestones</Text>
      </View>

      <View style={styles.highlightsList}>
        {defaultHighlights.map((highlight, index) => (
          <HighlightItem
            key={index}
            icon={highlight.icon}
            title={highlight.title}
            value={highlight.value}
          />
        ))}
      </View>
    </View>
  );
};

export default ProgressHighlights;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  highlightsList: {
    gap: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  highlightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  highlightIcon: {
    fontSize: 24,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
