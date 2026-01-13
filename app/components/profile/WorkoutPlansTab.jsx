import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useSync } from '../../contexts/SyncContext';
import { getPublicSplitsByUserId } from '../../api/splitsApi';

const SplitCard = ({ split }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const handleWorkoutDayPress = (day) => {
    // Format workout day data to match what WorkoutDetailScreen expects
    const workoutData = {
      dayName: day.workoutName || `Day ${day.dayIndex + 1}`,
      exercises: day.exercises || []
    };

    const splitData = {
      name: split.name,
      emoji: split.emoji
    };

    router.push({
      pathname: '/workout/workoutDetail',
      params: {
        workoutData: JSON.stringify(workoutData),
        splitData: JSON.stringify(splitData)
      }
    });
  };

  return (
    <View style={styles.splitCard}>
      {/* Split Header */}
      <View style={styles.splitHeader}>
        <View style={styles.splitTitleRow}>
          {split.emoji && <Text style={styles.splitEmoji}>{split.emoji}</Text>}
          <Text style={styles.splitName}>{split.name}</Text>
        </View>
        <View style={styles.publicBadge}>
          <Ionicons name="globe-outline" size={12} color="#4CAF50" />
          <Text style={styles.publicBadgeText}>Public</Text>
        </View>
      </View>

      {/* Description */}
      {split.description && (
        <Text style={styles.splitDescription}>{split.description}</Text>
      )}

      {/* Split Info */}
      <View style={styles.splitInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color={Colors.light.secondaryText} />
          <Text style={styles.infoText}>{split.numDays} days</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="barbell-outline" size={16} color={Colors.light.secondaryText} />
          <Text style={styles.infoText}>
            {split.workoutDays?.filter(day => !day.isRest).length} workouts
          </Text>
        </View>
      </View>

      {/* Workout Days Preview */}
      <View style={styles.daysPreview}>
        {split.workoutDays?.slice(0, expanded ? undefined : 3).map((day, index) => (
          <View key={day.id || index} style={styles.dayChip}>
            {day.isRest ? (
              <View style={styles.restDayChip}>
                <Ionicons name="moon-outline" size={14} color={Colors.light.secondaryText} />
                <Text style={styles.restDayText}>Rest</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.workoutDayChip}
                onPress={() => handleWorkoutDayPress(day)}
                activeOpacity={0.7}
              >
                {day.emoji && <Text style={styles.dayEmoji}>{day.emoji}</Text>}
                <Text style={styles.dayName} numberOfLines={1}>
                  {day.workoutName || `Day ${day.dayIndex + 1}`}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Expand/Collapse Button */}
      {split.workoutDays && split.workoutDays.length > 3 && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.expandButtonText}>
            {expanded ? 'Show less' : `Show ${split.workoutDays.length - 3} more days`}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.light.primary}
          />
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.splitStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color={Colors.light.secondaryText} />
          <Text style={styles.statText}>{split._count?.likes || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color={Colors.light.secondaryText} />
          <Text style={styles.statText}>{split._count?.comments || 0}</Text>
        </View>
      </View>
    </View>
  );
};

const WorkoutPlansTab = ({ userId }) => {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { manualSync } = useSync();

  useEffect(() => {
    fetchPublicSplits();
  }, [userId]);

  const fetchPublicSplits = async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      const data = await getPublicSplitsByUserId(userId);
      setSplits(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching public splits:', err);
      setError('Failed to load splits');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger sync on pull-to-refresh
    manualSync();
    await fetchPublicSplits();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!splits || splits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
        </View>
        <Text style={styles.emptyTitle}>No public splits yet</Text>
        <Text style={styles.emptySubtitle}>Public splits will appear here</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={splits}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <SplitCard split={item} />}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    />
  );
};

export default WorkoutPlansTab;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    backgroundColor: Colors.light.borderLight + '40',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Split Card
  splitCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  splitEmoji: {
    fontSize: 24,
  },
  splitName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4CAF50' + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publicBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  splitDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    lineHeight: 20,
    marginBottom: 12,
  },
  splitInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },

  // Days Preview
  daysPreview: {
    gap: 8,
    marginBottom: 12,
  },
  dayChip: {
    marginBottom: 4,
  },
  restDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.borderLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  restDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
  },
  workoutDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  dayEmoji: {
    fontSize: 16,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    flex: 1,
  },

  // Expand Button
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 12,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },

  // Stats
  splitStats: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight + '40',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
});
