import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getSavedWorkouts, deleteSavedWorkout } from '../../api/savedWorkoutsApi';

/**
 * Saved Workouts Tab Component
 * Shows list of saved workouts with view/edit/delete actions (no start button)
 */
const SavedWorkoutsTab = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load saved workouts on focus
  useFocusEffect(
    useCallback(() => {
      loadSavedWorkouts();
    }, [])
  );

  const loadSavedWorkouts = async () => {
    try {
      setLoading(true);
      const workouts = await getSavedWorkouts();
      setSavedWorkouts(workouts || []);
    } catch (error) {
      console.error('[SavedWorkoutsTab] Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedWorkouts();
    setRefreshing(false);
  };

  const handleViewWorkout = (workout) => {
    router.push({
      pathname: '/workout/workoutDetail',
      params: { workoutId: workout.id, workoutData: JSON.stringify(workout) }
    });
  };

  const handleEditWorkout = (workout) => {
    router.push({
      pathname: '/workout/saved',
      params: { workoutId: workout.id, workoutData: JSON.stringify(workout), mode: 'edit' }
    });
  };

  const handleDeleteWorkout = (workout) => {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workout.name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedWorkout(workout.id);
              setSavedWorkouts(prev => prev.filter(w => w.id !== workout.id));
            } catch (error) {
              console.error('[SavedWorkoutsTab] Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCreateWorkout = () => {
    router.push({
      pathname: '/workout/saved',
      params: { mode: 'create' }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading saved workouts...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      {/* Create New Workout Button */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}
        onPress={handleCreateWorkout}
      >
        <Ionicons name="add-circle" size={22} color={colors.primary} />
        <Text style={[styles.createButtonText, { color: colors.primary }]}>Create New Workout</Text>
      </TouchableOpacity>

      {/* Saved Workouts List */}
      {savedWorkouts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="bookmark-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Saved Workouts</Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
            Create a custom workout or save one after completing a freestyle session
          </Text>
        </View>
      ) : (
        <View style={styles.workoutsList}>
          {savedWorkouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={[styles.workoutCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
              onPress={() => handleViewWorkout(workout)}
              activeOpacity={0.7}
            >
              <View style={styles.workoutCardContent}>
                <View style={[styles.emojiContainer, { backgroundColor: colors.borderLight + '60' }]}>
                  <Text style={styles.emoji}>{workout.emoji || '💪'}</Text>
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={[styles.workoutName, { color: colors.text }]} numberOfLines={1}>
                    {workout.name}
                  </Text>
                  <Text style={[styles.workoutMeta, { color: colors.secondaryText }]}>
                    {workout.exercises?.length || 0} exercises
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.borderLight + '60' }]}
                  onPress={() => handleEditWorkout(workout)}
                >
                  <Ionicons name="pencil" size={18} color={colors.secondaryText} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
                  onPress={() => handleDeleteWorkout(workout)}
                >
                  <Ionicons name="trash" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Info Note */}
      <View style={[styles.infoNote, { backgroundColor: colors.borderLight + '40' }]}>
        <Ionicons name="information-circle-outline" size={18} color={colors.secondaryText} />
        <Text style={[styles.infoNoteText, { color: colors.secondaryText }]}>
          To start a saved workout, go to the Workout tab
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
  },

  // Create Button
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Workouts List
  workoutsList: {
    gap: 12,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  workoutCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emoji: {
    fontSize: 24,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  workoutMeta: {
    fontSize: 14,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
  },
  infoNoteText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});

export default SavedWorkoutsTab;
