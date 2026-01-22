import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useSync } from '../../contexts/SyncContext';
import { getPublicSplitsByUserId, createSplit } from '../../api/splitsApi';
import { useAuth } from '../../auth/auth';
import EmptyState from '../common/EmptyState';

const SplitCard = ({ split, colors, isOwnProfile, currentUserId }) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveSplit = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'You must be logged in to save splits');
      return;
    }

    setSaving(true);
    try {
      // Copy the split to the current user's account
      const newSplitData = {
        userId: currentUserId,
        name: split.name,
        emoji: split.emoji || '',
        description: split.description ? `Saved from @${split.user?.username || 'user'}. ${split.description}` : `Saved from @${split.user?.username || 'user'}`,
        numDays: split.numDays,
        isPublic: false,
        workoutDays: split.workoutDays?.map(day => ({
          dayIndex: day.dayIndex,
          isRest: day.isRest,
          workoutName: day.workoutName || '',
          emoji: day.emoji || '',
          exercises: day.exercises || []
        })) || []
      };

      await createSplit(newSplitData);
      setSaved(true);
      Alert.alert('Success', 'Split saved to your library!');
    } catch (error) {
      console.error('Failed to save split:', error);
      Alert.alert('Error', 'Failed to save split');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkoutDayPress = (day) => {
    // Format workout day data to match what WorkoutDetailScreen expects
    const workoutData = {
      dayName: day.workoutName || `Day ${day.dayIndex + 1}`,
      exercises: day.exercises || []
    };

    const splitData = {
      id: split.id,
      userId: split.userId,
      name: split.name,
      emoji: split.emoji,
      isPublic: split.isPublic,
      totalDays: split.numDays,
      workoutDays: split.workoutDays
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
    <View style={[styles.splitCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, shadowColor: colors.shadow }]}>
      {/* Split Header */}
      <View style={styles.splitHeader}>
        <View style={styles.splitTitleRow}>
          {split.emoji && <Text style={styles.splitEmoji}>{split.emoji}</Text>}
          <Text style={[styles.splitName, { color: colors.text }]}>{split.name}</Text>
        </View>
        {isOwnProfile ? (
          <View style={[styles.publicBadge, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="globe-outline" size={12} color={colors.accent} />
            <Text style={[styles.publicBadgeText, { color: colors.accent }]}>Public</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.saveBadge,
              { backgroundColor: colors.primary + '15' },
              saved && { backgroundColor: colors.accent + '15' }
            ]}
            onPress={handleSaveSplit}
            disabled={saving || saved}
            activeOpacity={0.7}
          >
            <Ionicons
              name={saved ? "checkmark-circle" : "bookmark-outline"}
              size={14}
              color={saved ? colors.accent : colors.primary}
            />
            <Text style={[styles.saveBadgeText, { color: saved ? colors.accent : colors.primary }]}>
              {saving ? '...' : saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Description */}
      {split.description && (
        <Text style={[styles.splitDescription, { color: colors.secondaryText }]}>{split.description}</Text>
      )}

      {/* Split Info */}
      <View style={styles.splitInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.secondaryText} />
          <Text style={[styles.infoText, { color: colors.secondaryText }]}>{split.numDays} days</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="barbell-outline" size={16} color={colors.secondaryText} />
          <Text style={[styles.infoText, { color: colors.secondaryText }]}>
            {split.workoutDays?.filter(day => !day.isRest).length} workouts
          </Text>
        </View>
      </View>

      {/* Workout Days */}
      <View style={styles.daysPreview}>
        {split.workoutDays?.map((day, index) => (
          <View key={day.id || index} style={styles.dayChip}>
            {day.isRest ? (
              <View style={[styles.restDayChip, { backgroundColor: colors.borderLight + '30' }]}>
                <Ionicons name="moon-outline" size={14} color={colors.secondaryText} />
                <Text style={[styles.restDayText, { color: colors.secondaryText }]}>Rest</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.workoutDayChip, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
                onPress={() => handleWorkoutDayPress(day)}
                activeOpacity={0.7}
              >
                {day.emoji && <Text style={styles.dayEmoji}>{day.emoji}</Text>}
                <Text style={[styles.dayName, { color: colors.primary }]} numberOfLines={1}>
                  {day.workoutName || `Day ${day.dayIndex + 1}`}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const WorkoutPlansTab = ({ userId, isOwnProfile = true }) => {
  const colors = useThemeColors();
  const { user: currentUser } = useAuth();
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (!splits || splits.length === 0) {
    return (
      <EmptyState
        emoji="📋"
        title="No public splits yet"
        message="Public splits will appear here"
      />
    );
  }

  return (
    <FlatList
      data={splits}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <SplitCard split={item} colors={colors} isOwnProfile={isOwnProfile} currentUserId={currentUser?.id} />}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
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
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Split Card
  splitCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
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
  saveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 13,
    fontWeight: '600',
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
});
