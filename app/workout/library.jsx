import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAuth } from '../auth/auth';
import {
  getSavedWorkouts,
  deleteSavedWorkout
} from '../api/savedWorkoutsApi';
import EmptyState from '../components/common/EmptyState';

const WorkoutLibraryScreen = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedWorkouts = async () => {
    try {
      const workouts = await getSavedWorkouts();
      setSavedWorkouts(workouts);
    } catch (error) {
      console.error('Failed to fetch saved workouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSavedWorkouts();
    }, [])
  );

  const handleDelete = (workoutId, workoutName) => {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workoutName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSavedWorkout(workoutId);
              setSavedWorkouts(prev => prev.filter(w => w.id !== workoutId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout');
            }
          }
        }
      ]
    );
  };

  const renderWorkoutCard = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{item.emoji || '💪'}</Text>
        <View style={styles.cardInfo}>
          <Text style={[styles.workoutName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.exerciseCount, { color: colors.secondaryText }]}>
            {item.exercises?.length || 0} exercises
            {item.workoutType ? ` • ${item.workoutType}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item.id, item.name)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error || '#EF4444'} />
        </TouchableOpacity>
      </View>

      {item.description && (
        <Text style={[styles.description, { color: colors.secondaryText }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {item.exercises?.length > 0 && (
        <View style={[styles.exercisePreview, { backgroundColor: colors.background }]}>
          {item.exercises.slice(0, 3).map((exercise, index) => (
            <Text key={index} style={[styles.exercisePreviewText, { color: colors.secondaryText }]} numberOfLines={1}>
              • {exercise.name}
            </Text>
          ))}
          {item.exercises.length > 3 && (
            <Text style={[styles.moreText, { color: colors.primary }]}>
              +{item.exercises.length - 3} more
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Workout Library</Text>
        <TouchableOpacity onPress={() => router.push('/workout/saved')} style={styles.addButton}>
          <Ionicons name="add" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {savedWorkouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            emoji="📁"
            title="No saved workouts"
            message="Create standalone workouts or save them from your splits to reuse later"
          />
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/workout/saved')}
          >
            <Ionicons name="add-circle" size={20} color={colors.onPrimary} />
            <Text style={[styles.createButtonText, { color: colors.onPrimary }]}>
              Create Workout
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={savedWorkouts}
          keyExtractor={(item) => item.id}
          renderItem={renderWorkoutCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchSavedWorkouts();
              }}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseCount: {
    fontSize: 13,
  },
  deleteButton: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  exercisePreview: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  exercisePreviewText: {
    fontSize: 13,
    marginBottom: 4,
  },
  moreText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default WorkoutLibraryScreen;
