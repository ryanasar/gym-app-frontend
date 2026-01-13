import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CelebrationAnimation from '../components/animations/CelebrationAnimation';
import RestDayCard from '../components/workout/RestDayCard';
import BeginSplitCard from '../components/workout/BeginSplitCard';
import { Colors } from '../constants/colors';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSync } from '../contexts/SyncContext';
import { getActiveWorkout, storage, calculateStreakFromLocal } from '../../storage';
import { clearLocalSplit, debugLocalSplit } from '../utils/clearLocalSplit';
import { updateSplit } from '../api/splitsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';


const SCREEN_HEIGHT = Dimensions.get('window').height;

const WorkoutScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    todaysWorkout,
    activeSplit,
    markWorkoutCompleted,
    todaysWorkoutCompleted,
    completedSessionId: cachedSessionId,
    refreshTodaysWorkout,
  } = useWorkout();
  const { updatePendingCount, manualSync } = useSync();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-sync when workout tab is focused
  useFocusEffect(
    useCallback(() => {
      manualSync();
    }, [manualSync])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTodaysWorkout();
    setRefreshing(false);
  }, [refreshTodaysWorkout]);

  // Clear local split data
  const handleClearLocalSplit = async () => {
    Alert.alert(
      'Clear Local Data?',
      'This will remove the local split and reset your progress. You can then select a new split from the Program tab.\n\nYour workout history is safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const success = await clearLocalSplit();
            if (success) {
              Alert.alert('Cleared!', 'Local split data has been cleared. Pull to refresh or restart the app.', [
                {
                  text: 'Refresh Now',
                  onPress: async () => {
                    await refreshTodaysWorkout();
                  },
                },
              ]);
            } else {
              Alert.alert('Error', 'Failed to clear local data.');
            }
          },
        },
      ]
    );
  };

  const [isCompleted, setIsCompleted] = useState(todaysWorkoutCompleted);
  const [completedSessionId, setCompletedSessionId] = useState(cachedSessionId);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isExercisesExpanded, setIsExercisesExpanded] = useState(false);
  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showChangeDayModal, setShowChangeDayModal] = useState(false);

  // Calculate if card would exceed screen height
  const { shouldCollapse, maxVisibleExercises } = useMemo(() => {
    if (!todaysWorkout?.exercises) return { shouldCollapse: false, maxVisibleExercises: 0 };

    // Estimated heights (in pixels) - adjusted for even gaps
    const HEADER_HEIGHT = 100; // Top header with title
    const CONTENT_PADDING = 32; // 16px top + 16px bottom around card
    const CARD_PADDING = 40; // Card padding top + bottom
    const WORKOUT_HEADER_HEIGHT = 80; // Workout name + cycle info
    const EXERCISE_ITEM_HEIGHT = 52; // Each exercise item
    const SHOW_MORE_BUTTON_HEIGHT = 30; // Reduced compact button
    const ACTION_BUTTONS_HEIGHT = 130; // Start Workout + Mark Complete buttons
    const BOTTOM_SAFE_AREA = 130; // Tab bar + safe area + extra padding

    const totalExercises = todaysWorkout.exercises.length;

    // Calculate height with all exercises
    const fullCardHeight =
      HEADER_HEIGHT +
      CONTENT_PADDING +
      CARD_PADDING +
      WORKOUT_HEADER_HEIGHT +
      (EXERCISE_ITEM_HEIGHT * totalExercises) +
      ACTION_BUTTONS_HEIGHT +
      BOTTOM_SAFE_AREA;

    // If it fits, show all exercises
    if (fullCardHeight <= SCREEN_HEIGHT) {
      return { shouldCollapse: false, maxVisibleExercises: totalExercises };
    }

    // Otherwise, calculate max exercises that fit
    const availableHeight = SCREEN_HEIGHT - (
      HEADER_HEIGHT +
      CONTENT_PADDING +
      CARD_PADDING +
      WORKOUT_HEADER_HEIGHT +
      SHOW_MORE_BUTTON_HEIGHT +
      ACTION_BUTTONS_HEIGHT +
      BOTTOM_SAFE_AREA
    );

    const maxExercises = Math.max(3, Math.floor(availableHeight / EXERCISE_ITEM_HEIGHT));

    return {
      shouldCollapse: totalExercises > maxExercises,
      maxVisibleExercises: maxExercises
    };
  }, [todaysWorkout]);

  // Sync with context state on mount and when context updates
  useEffect(() => {
    setIsCompleted(todaysWorkoutCompleted);
    setCompletedSessionId(cachedSessionId);
  }, [todaysWorkoutCompleted, cachedSessionId]);

  // Check status only once on initial mount or when workout changes
  useEffect(() => {
    const checkStatus = async () => {
      if (todaysWorkout && activeSplit && !hasCheckedStatus) {
        try {
          // Check if today's workout is completed in local storage
          const splitId = activeSplit.id;
          const dayIndex = (todaysWorkout.dayNumber || 1) - 1;
          const completedWorkout = await storage.getTodaysCompletedWorkout(splitId, dayIndex);

          if (completedWorkout) {
            setIsCompleted(true);
            setCompletedSessionId(completedWorkout.id);
            markWorkoutCompleted(completedWorkout.id);
          }
        } catch (error) {
          console.error('[Workout Tab] Error checking workout status from local storage:', error);
        }
        setHasCheckedStatus(true);
      }
    };
    checkStatus();
  }, [todaysWorkout?.dayName, todaysWorkout?.dayNumber, activeSplit?.id]);

  // Handle returning from completed workout session
  useEffect(() => {
    if (params.completed === 'true') {
      setIsCompleted(true);
      // Show celebration animation when returning from completed workout
      setShowCelebration(true);

      // Update completed session ID if provided
      if (params.sessionId) {
        setCompletedSessionId(params.sessionId);
      }
    }
  }, [params.completed, params.sessionId]);

  // Check for active workout and auto-resume
  useEffect(() => {
    const checkAndResumeWorkout = async () => {
      try {
        const activeWorkout = await getActiveWorkout();
        setHasActiveWorkout(!!activeWorkout);

        // Don't auto-resume if we just paused, completed, or discarded a workout
        if (params.paused === 'true' || params.completed === 'true' || params.discarded === 'true') {
          return;
        }

        if (activeWorkout && todaysWorkout) {
          // Navigate to session screen with workout data
          router.replace({
            pathname: '/workout/session',
            params: {
              workoutData: JSON.stringify(todaysWorkout)
            }
          });
        }
      } catch (error) {
        console.error('[Workout Tab] Error checking for active workout:', error);
      }
    };

    checkAndResumeWorkout();
  }, [todaysWorkout, params.paused, params.completed, params.discarded]);

  // Check if it's a rest day
  const isRestDay = todaysWorkout?.isRest || (todaysWorkout?.exercises && todaysWorkout.exercises.length === 0 && todaysWorkout?.dayName === 'Rest Day');

  // Handle split that exists but hasn't been started
  const handleDaySelected = async (dayIndex) => {
    try {
      // Update the split to mark it as started in backend
      if (activeSplit?.id) {
        await updateSplit(activeSplit.id, { started: true });

        // Update the local split object with started: true
        const updatedSplit = { ...activeSplit, started: true };
        await storage.saveSplit(updatedSplit);
      }

      // Update local storage to set current day
      await AsyncStorage.setItem('currentDayIndex', dayIndex.toString());
      await AsyncStorage.setItem('currentWeek', '1');

      // Close modal if open
      setShowChangeDayModal(false);

      // Refresh to show the selected workout
      await refreshTodaysWorkout();
    } catch (error) {
      console.error('Error starting split:', error);
      Alert.alert('Error', 'Failed to start split. Please try again.');
    }
  };

  // Show Begin Split card if split exists but hasn't been started
  if (activeSplit && activeSplit.started === false) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Today's Workout</Text>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <BeginSplitCard
            split={activeSplit}
            onDaySelected={handleDaySelected}
          />
        </ScrollView>
      </View>
    );
  }

  // Handle case where no workout is available at all
  if (!todaysWorkout) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Today's Workout</Text>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.emptyStateContainer}>
            {/* Icon */}
            <View style={styles.emptyIconCircle}>
              <Ionicons name="barbell-outline" size={48} color={Colors.light.primary} />
            </View>

            {/* Title */}
            <Text style={styles.emptyStateTitle}>No Active Split</Text>

            {/* Message */}
            <Text style={styles.emptyStateMessage}>
              Get started by creating a workout split in the Program tab. You'll be able to track your workouts and progress!
            </Text>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.emptyStateCTA}
              onPress={() => router.push('/program')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.emptyStateCTAText}>Create Your Split</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show Rest Day Card for rest days
  if (isRestDay) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, styles.headerContainerCompleted]}>
          <Text style={[styles.title, styles.titleCompleted]}>Today's Workout</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.contentContainer}>
            <RestDayCard
              splitName={activeSplit?.name}
              splitEmoji={activeSplit?.emoji}
              weekNumber={todaysWorkout.weekNumber}
              dayNumber={todaysWorkout.dayNumber}
              onRestLogged={() => {
                // Mark calendar as rest day completed
                markWorkoutCompleted('rest-day-logged', true);
                setShowCelebration(true);
              }}
              onChangeWorkout={() => setShowChangeDayModal(true)}
            />
          </View>
        </ScrollView>

        {/* Change Workout Modal */}
        <Modal
          visible={showChangeDayModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowChangeDayModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Workout Day</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowChangeDayModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Select which day you'd like to train today
            </Text>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Day List */}
              {(activeSplit?.days || activeSplit?.workoutDays)?.map((day, index) => {
                const isRest = day.isRest;
                const dayName = isRest ? 'Rest Day' : (day.name || day.workoutName || `Day ${index + 1}`);
                const exerciseCount = !isRest && day.exercises
                  ? (typeof day.exercises === 'string' ? JSON.parse(day.exercises).length : day.exercises.length)
                  : 0;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.dayPickerCard}
                    onPress={() => handleDaySelected(index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dayPickerCardContent}>
                      {day.emoji && <Text style={styles.dayPickerEmoji}>{day.emoji}</Text>}
                      <View style={styles.dayPickerInfo}>
                        <Text style={styles.dayPickerName}>{dayName}</Text>
                        {!isRest && exerciseCount > 0 && (
                          <Text style={styles.dayPickerExercises}>
                            {exerciseCount} exercises
                          </Text>
                        )}
                      </View>
                    </View>
                    {isRest && (
                      <View style={styles.restDayBadge}>
                        <Ionicons name="moon" size={14} color={Colors.light.secondaryText} />
                        <Text style={styles.restDayBadgeText}>Rest</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Modal>

        {/* Celebration Animation */}
        {showCelebration && (
          <CelebrationAnimation
            key={completedSessionId || Date.now()}
            onAnimationComplete={() => setShowCelebration(false)}
          />
        )}
      </View>
    );
  }

  const handleToggleCompletion = async () => {
    // Prevent multiple clicks
    if (isToggling) return;

    // If trying to un-complete, show warning
    if (isCompleted) {
      Alert.alert(
        'Un-complete Workout?',
        'Are you sure you want to mark this workout as incomplete? Your progress will be deleted.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Un-complete',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsToggling(true);

                if (completedSessionId) {
                  // Get the database ID (if workout was synced)
                  const databaseId = await storage.getWorkoutDatabaseId(completedSessionId);

                  // Delete from backend only if it was synced
                  if (databaseId) {
                    try {
                      const { deleteWorkoutSession } = require('../api/workoutSessionsApi');
                      await deleteWorkoutSession(databaseId);
                      console.log('[Workout Tab] Deleted workout from backend:', databaseId);
                    } catch (error) {
                      // If 404, session was already deleted from backend
                      if (error.response?.status !== 404) {
                        console.error('[Workout Tab] Error deleting workout from backend:', error);
                        Alert.alert('Error', 'Failed to delete from server. Please try again.');
                        setIsToggling(false);
                        return;
                      }
                    }

                    // Delete the ID mapping
                    await storage.deleteWorkoutDatabaseId(completedSessionId);
                  }

                  // Remove from local storage (pending queue)
                  await storage.markWorkoutSynced(completedSessionId);

                  // Remove from completed history
                  await storage.removeFromCompletedHistory(completedSessionId);
                }

                // Update local and context state
                setIsCompleted(false);
                setCompletedSessionId(null);
                markWorkoutCompleted(null);

                // Recalculate streak
                try {
                  const streak = await calculateStreakFromLocal();
                  setCurrentStreak(streak);
                } catch (error) {
                  console.error('[Workout Tab] Error recalculating streak:', error);
                }

                // Update pending count for sync
                await updatePendingCount();
              } catch (error) {
                console.error('[Workout Tab] Error deleting workout:', error);
                Alert.alert('Error', 'Failed to delete workout progress. Please try again.');
              } finally {
                setIsToggling(false);
              }
            },
          },
        ]
      );
    } else {
      // If marking as complete, create a quick completion workout in local storage
      try {
        setIsToggling(true);

        if (todaysWorkout && activeSplit) {
          // Import the necessary functions
          const { startWorkout: localStartWorkout, completeWorkout: localCompleteWorkout } = await import('../../storage');

          // Create a workout session
          const splitId = activeSplit.id;
          const dayIndex = (todaysWorkout.dayNumber || 1) - 1;
          const workout = await localStartWorkout(splitId, dayIndex);

          // Mark all sets as completed (quick completion)
          workout.exercises.forEach(exercise => {
            exercise.sets.forEach(set => {
              set.completed = true;
              set.reps = set.reps || 0;
              set.weight = set.weight || 0;
            });
          });

          // Save the updated workout with completed sets back to storage
          await storage.saveActiveWorkout(workout);

          // Complete the workout immediately
          await localCompleteWorkout(workout.id);

          // Update local and context state
          setCompletedSessionId(workout.id);
          setIsCompleted(true);
          markWorkoutCompleted(workout.id, isRestDay);

          // Calculate and store current streak from local storage
          try {
            const streak = await calculateStreakFromLocal();
            setCurrentStreak(streak);
          } catch (error) {
            console.error('[Workout Tab] Error calculating streak:', error);
          }

          // Show celebration animation
          setShowCelebration(true);

          // Update pending count for sync
          await updatePendingCount();
        } else {
          setIsCompleted(true);
          setShowCelebration(true);
        }
      } catch (error) {
        console.error('[Workout Tab] Error saving quick workout completion:', error);
        Alert.alert('Error', 'Failed to save workout progress. Please try again.');
      } finally {
        setIsToggling(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[
        styles.headerContainer,
        isCompleted && styles.headerContainerCompleted
      ]}>
        <Text style={[
          styles.title,
          isCompleted && styles.titleCompleted
        ]}>Today's Workout</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.contentContainer}>
          {/* Today's Workout Card */}
          <View style={[
            styles.workoutCard,
            isCompleted && styles.workoutCardCompleted
          ]}>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutInfo}>
                <View style={styles.workoutTitleRow}>
                  <Text style={styles.workoutTitle}>{todaysWorkout.dayName}</Text>
                  <View style={styles.headerActions}>
                    <Text style={styles.exerciseCount}>
                      {todaysWorkout.exercises.length} exercises
                    </Text>
                    {!isCompleted && (
                      <TouchableOpacity
                        style={styles.optionsButton}
                        onPress={() => setShowOptionsMenu(!showOptionsMenu)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="ellipsis-horizontal" size={20} color={Colors.light.secondaryText} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {activeSplit?.name && (
                  <Text style={styles.splitName}>
                    {activeSplit.emoji && `${activeSplit.emoji} `}{activeSplit.name}
                  </Text>
                )}
                <Text style={styles.cycleInfo}>
                  Cycle {todaysWorkout.weekNumber} · Day {todaysWorkout.dayNumber}
                </Text>
              </View>
            </View>

            {/* Options Menu */}
            {showOptionsMenu && !isCompleted && (
              <>
                {/* Backdrop to dismiss menu */}
                <TouchableOpacity
                  style={styles.optionsMenuBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowOptionsMenu(false)}
                />
                <View style={styles.optionsMenuOverlay}>
                  <TouchableOpacity
                    style={styles.optionsMenuItem}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      setShowChangeDayModal(true);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={18} color={Colors.light.text} />
                    <Text style={styles.optionsMenuItemText}>Change Today's Workout</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Exercises List */}
            <View style={styles.exercisesList}>
              {(isExercisesExpanded || !shouldCollapse
                ? todaysWorkout.exercises
                : todaysWorkout.exercises.slice(0, maxVisibleExercises)
              ).map((exercise, exerciseIndex) => (
                <View key={exerciseIndex} style={styles.exerciseItem}>
                  <View style={styles.exerciseContent}>
                    <Text style={styles.exerciseName}>
                      {exerciseIndex + 1}. {exercise.name}
                    </Text>
                    <Text style={styles.exerciseDetailText}>
                      {exercise.sets && `${exercise.sets} sets`}
                      {exercise.sets && exercise.reps && ' · '}
                      {exercise.reps && `${exercise.reps} reps`}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Show More/Less Button - Only show if card would exceed screen */}
              {shouldCollapse && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setIsExercisesExpanded(!isExercisesExpanded)}
                >
                  <Text style={styles.showMoreText}>
                    {isExercisesExpanded
                      ? 'Show less'
                      : `Show ${todaysWorkout.exercises.length - maxVisibleExercises} more`}
                  </Text>
                  <Ionicons
                    name={isExercisesExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.light.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {!isCompleted && (
                <>
                  {/* Primary CTA: Start/Resume Workout */}
                  <TouchableOpacity
                    style={styles.startWorkoutButton}
                    onPress={() => router.push({
                      pathname: '/workout/session',
                      params: {
                        workoutData: JSON.stringify(todaysWorkout)
                      }
                    })}
                  >
                    <Text style={styles.startWorkoutText}>
                      {hasActiveWorkout ? 'Resume Workout' : 'Start Workout'}
                    </Text>
                  </TouchableOpacity>

                  {/* Secondary Action: Mark Complete */}
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionButton,
                      isToggling && styles.secondaryActionButtonDisabled
                    ]}
                    onPress={handleToggleCompletion}
                    disabled={isToggling}
                    activeOpacity={isToggling ? 1 : 0.7}
                  >
                    {isToggling ? (
                      <ActivityIndicator size="small" color={Colors.light.secondaryText} />
                    ) : (
                      <Text style={styles.secondaryActionText}>Mark Complete</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {isCompleted && (
                <>
                  {/* Share Button */}
                  <TouchableOpacity
                    style={styles.postWorkoutButton}
                    onPress={() =>
                      router.push({
                        pathname: '/post/create',
                        params: {
                          workoutData: JSON.stringify(todaysWorkout),
                          workoutSessionId: completedSessionId?.toString() || '',
                          splitId: activeSplit?.id?.toString() || '',
                          streak: currentStreak.toString(),
                        },
                      })
                    }
                  >
                    <View style={styles.postWorkoutContent}>
                      <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.postWorkoutText}>Post Workout</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Un-complete action */}
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionButton,
                      isToggling && styles.secondaryActionButtonDisabled
                    ]}
                    onPress={handleToggleCompletion}
                    disabled={isToggling}
                    activeOpacity={isToggling ? 1 : 0.7}
                  >
                    {isToggling ? (
                      <ActivityIndicator size="small" color={Colors.light.secondaryText} />
                    ) : (
                      <Text style={styles.secondaryActionText}>Un-complete</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Change Workout Modal */}
      <Modal
        visible={showChangeDayModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChangeDayModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Workout Day</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowChangeDayModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            Select which day you'd like to train today
          </Text>
          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Day List */}
            {(activeSplit?.days || activeSplit?.workoutDays)?.map((day, index) => {
              const isRest = day.isRest;
              const dayName = isRest ? 'Rest Day' : (day.name || day.workoutName || `Day ${index + 1}`);
              const exerciseCount = !isRest && day.exercises
                ? (typeof day.exercises === 'string' ? JSON.parse(day.exercises).length : day.exercises.length)
                : 0;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dayPickerCard}
                  onPress={() => handleDaySelected(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayPickerCardContent}>
                    {day.emoji && <Text style={styles.dayPickerEmoji}>{day.emoji}</Text>}
                    <View style={styles.dayPickerInfo}>
                      <Text style={styles.dayPickerName}>{dayName}</Text>
                      {!isRest && exerciseCount > 0 && (
                        <Text style={styles.dayPickerExercises}>
                          {exerciseCount} exercises
                        </Text>
                      )}
                    </View>
                  </View>
                  {isRest && (
                    <View style={styles.restDayBadge}>
                      <Ionicons name="moon" size={14} color={Colors.light.secondaryText} />
                      <Text style={styles.restDayBadgeText}>Rest</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Celebration Animation */}
      {showCelebration && (
        <CelebrationAnimation
          key={completedSessionId || Date.now()}
          onAnimationComplete={() => setShowCelebration(false)}
        />
      )}
    </View>
  );
};

export default WorkoutScreen;

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
  headerContainerCompleted: {
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  titleCompleted: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flex: 1,
  },

  // Workout Card (using SplitReview styling)
  workoutCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.light.borderLight,
    transition: 'all 0.3s ease',
  },
  workoutCardCompleted: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50' + '08',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.15,
  },

  // Workout Header
  workoutHeader: {
    marginBottom: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  splitName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
    marginTop: 4,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  exerciseCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  cycleInfo: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },

  // Exercises List
  exercisesList: {
    marginTop: 4,
  },
  exerciseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight + '40',
  },
  exerciseContent: {
    gap: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 20,
  },
  exerciseDetailText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },

  // Show More Button
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    marginTop: 2,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },

  // Empty state
  emptyScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    maxWidth: 400,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateCTA: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateCTAText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Action Buttons Container
  actionButtons: {
    marginTop: 20,
    gap: 10,
  },

  // Primary CTA - Start Workout Button
  startWorkoutButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startWorkoutText: {
    color: Colors.light.onPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Secondary Action Button (Mark Complete / Un-complete)
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.light.borderLight,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryActionButtonDisabled: {
    opacity: 0.5,
  },
  secondaryActionText: {
    color: Colors.light.secondaryText,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Post Workout Button
  postWorkoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postWorkoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Header Actions (exercise count + options button)
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Options Button (3-dot menu)
  optionsButton: {
    padding: 4,
    borderRadius: 8,
  },

  // Options Menu Backdrop (invisible overlay to dismiss)
  optionsMenuBackdrop: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    zIndex: 999,
  },

  // Options Menu Overlay
  optionsMenuOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 220,
    zIndex: 1000,
  },

  // Options Menu Item
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  // Options Menu Item Text
  optionsMenuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },

  // Modal Container
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  // Modal Title
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },

  // Modal Close Button
  modalCloseButton: {
    padding: 4,
  },

  // Modal ScrollView
  modalScrollView: {
    flex: 1,
  },

  // Modal Content
  modalContent: {
    padding: 20,
  },

  // Modal Subtitle
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Day Picker Card
  dayPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },

  // Day Picker Card Content
  dayPickerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },

  // Day Picker Emoji
  dayPickerEmoji: {
    fontSize: 24,
  },

  // Day Picker Info
  dayPickerInfo: {
    flex: 1,
  },

  // Day Picker Name
  dayPickerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },

  // Day Picker Exercises
  dayPickerExercises: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },

  // Rest Day Badge
  restDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.borderLight + '40',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },

  // Rest Day Badge Text
  restDayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
});