import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import CelebrationAnimation from '../components/animations/CelebrationAnimation';
import RestDayCard from '../components/workout/RestDayCard';
import FreeRestDayCard from '../components/workout/FreeRestDayCard';
import BeginSplitCard from '../components/workout/BeginSplitCard';
import EmptyState from '../components/common/EmptyState';
import ExerciseCard from '../components/exercises/ExerciseCard';
import { Colors } from '../constants/colors';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../auth/auth';
import { getActiveWorkout, storage, calculateStreakFromLocal, unmarkTodayCompleted } from '../../storage';
import { getCalendarData } from '../../storage/calendarStorage';
import { isFreeRestDayAvailable, clearFreeRestDayUsageForToday } from '../../storage/freeRestDayStorage';
import { clearLocalSplit, debugLocalSplit } from '../utils/clearLocalSplit';
import { updateSplit } from '../api/splitsApi';
import { getTodaysWorkoutPost } from '../api/postsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '../hooks/useThemeColors';
import { getCustomExercises, createCustomExercise } from '../api/customExercisesApi';
import CreateCustomExerciseModal from '../components/exercises/CreateCustomExerciseModal';


const SCREEN_HEIGHT = Dimensions.get('window').height;

const WorkoutScreen = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const {
    todaysWorkout,
    activeSplit,
    markWorkoutCompleted,
    markFreeRestDay,
    todaysWorkoutCompleted,
    completedSessionId: cachedSessionId,
    refreshTodaysWorkout,
    isInitialized,
  } = useWorkout();
  const { updatePendingCount, manualSync } = useSync();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-sync when workout tab is focused
  useFocusEffect(
    useCallback(() => {
      manualSync();
    }, [manualSync])
  );

  // Check if workout has been posted when tab is focused
  useFocusEffect(
    useCallback(() => {
      const checkIfPosted = async () => {
        // Only check if workout is completed today and user is logged in
        if (todaysWorkoutCompleted && user?.id) {
          try {
            // Check the API for a workout post created today
            const post = await getTodaysWorkoutPost(user.id);
            setHasPosted(!!post);
          } catch (error) {
            console.error('Error checking if posted:', error);
            setHasPosted(false);
          }
        } else {
          setHasPosted(false);
        }
      };
      checkIfPosted();
    }, [todaysWorkoutCompleted, user?.id])
  );

  // Check free rest day availability on focus
  useFocusEffect(
    useCallback(() => {
      const checkFreeRestDay = async () => {
        const isRest = todaysWorkout?.isRest || (todaysWorkout?.exercises?.length === 0 && todaysWorkout?.dayName === 'Rest Day');
        if (!isRest && !todaysWorkoutCompleted && todaysWorkout) {
          const available = await isFreeRestDayAvailable();
          setFreeRestDayAvailable(available);
        } else {
          setFreeRestDayAvailable(false);
        }
      };
      checkFreeRestDay();
    }, [todaysWorkoutCompleted, todaysWorkout])
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

  // Use context state directly - no local isCompleted state to avoid sync issues
  const isCompleted = todaysWorkoutCompleted;
  const completedSessionId = cachedSessionId;

  const [currentStreak, setCurrentStreak] = useState(0);
  const [isToggling, setIsToggling] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasPosted, setHasPosted] = useState(false);
  const [isExercisesExpanded, setIsExercisesExpanded] = useState(false);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
  const skipAutoResumeRef = useRef(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [freeRestDayAvailable, setFreeRestDayAvailable] = useState(false);
  const [showChangeDayModal, setShowChangeDayModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [localExercises, setLocalExercises] = useState([]);

  // Add Exercise Modal state
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseDatabase, setExerciseDatabase] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [addExerciseSearch, setAddExerciseSearch] = useState('');
  const [addExerciseMuscleFilter, setAddExerciseMuscleFilter] = useState('all');
  const [selectedNewExercise, setSelectedNewExercise] = useState(null);
  const [newExerciseSets, setNewExerciseSets] = useState('3');
  const [newExerciseReps, setNewExerciseReps] = useState('10');
  const [showCreateCustomModal, setShowCreateCustomModal] = useState(false);

  // Muscle groups for filtering
  const muscleGroups = [
    { id: 'all', name: 'All Exercises' },
    { id: 'my_exercises', name: 'My Exercises' },
    { id: 'chest', name: 'Chest' },
    { id: 'lats', name: 'Back' },
    { id: 'front_delts', name: 'Shoulders' },
    { id: 'biceps', name: 'Biceps' },
    { id: 'triceps', name: 'Triceps' },
    { id: 'quadriceps', name: 'Legs' },
    { id: 'core', name: 'Core' },
    { id: 'hamstrings', name: 'Hamstrings' },
    { id: 'glutes', name: 'Glutes' },
    { id: 'calves', name: 'Calves' },
    { id: 'forearms', name: 'Forearms' }
  ];

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

  // Handle returning from completed workout session
  useEffect(() => {
    const handleCompletedSession = async () => {
      if (params.completed === 'true') {
        // Calculate streak when returning from completed workout
        try {
          const streak = await calculateStreakFromLocal();
          setCurrentStreak(streak);
        } catch (error) {
          console.error('[Workout Tab] Error calculating streak after session:', error);
        }
        // Show celebration animation when returning from completed workout
        setShowCelebration(true);
      }
    };
    handleCompletedSession();
  }, [params.completed]);

  // Check for active workout and auto-resume
  useEffect(() => {
    // Latch the skip flag when arriving from pause/complete/discard so it
    // survives across effect re-runs even if route params get cleared.
    if (params.paused === 'true' || params.completed === 'true' || params.discarded === 'true') {
      skipAutoResumeRef.current = true;
    }

    const checkAndResumeWorkout = async () => {
      try {
        const activeWorkout = await getActiveWorkout();
        setHasActiveWorkout(!!activeWorkout);

        // Don't auto-resume if we just paused, completed, or discarded a workout
        if (skipAutoResumeRef.current) {
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

  // Check if workout has exercises
  const hasExercises = todaysWorkout?.exercises?.length > 0;

  // Automatically mark rest days as completed (doesn't increase streak)
  useEffect(() => {
    const autoMarkRestDay = async () => {
      if (isRestDay && todaysWorkout) {
        try {
          // Check if today is already marked as a rest day
          const calendarData = await getCalendarData();
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const todayEntry = calendarData[todayStr];

          // Only mark if not already marked as a rest day
          if (!todayEntry?.isRestDay) {
            // Mark today as a rest day via context (handles calendar + Progress refresh)
            // isRestDay=true means it won't count toward streak
            await markWorkoutCompleted('rest-day-auto', true);
            console.log('[Workout Tab] Auto-marked rest day as completed');
          }
        } catch (error) {
          console.error('[Workout Tab] Error auto-marking rest day:', error);
        }
      }
    };

    autoMarkRestDay();
  }, [isRestDay, todaysWorkout]);

  // Handle split that exists but hasn't been started
  const handleDaySelected = async (dayIndex) => {
    try {
      // Clear any existing completion for today when changing days
      await unmarkTodayCompleted();

      // Clear all completion state in storage and context
      await AsyncStorage.multiRemove([
        'completedSessionId',
        'lastCompletionDate',
        'lastCheckDate'
      ]);

      // Clear completion in context - this updates todaysWorkoutCompleted to false
      await markWorkoutCompleted(null);

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
      // This will trigger auto-mark for rest days via the useEffect
      await refreshTodaysWorkout();
    } catch (error) {
      console.error('Error starting split:', error);
      Alert.alert('Error', 'Failed to start split. Please try again.');
    }
  };

  // Sync local exercises with todaysWorkout
  useEffect(() => {
    if (todaysWorkout?.exercises) {
      setLocalExercises(todaysWorkout.exercises);
    }
  }, [todaysWorkout?.exercises]);

  // Handle reordering exercises
  const handleReorderExercises = useCallback(async ({ data }) => {
    setLocalExercises(data);

    // Update the split in local storage
    try {
      // Read fresh from storage to avoid stale data
      const currentSplit = await storage.getSplit();
      if (currentSplit) {
        const currentDayIndex = (todaysWorkout?.dayNumber || 1) - 1;
        // Deep copy the split to avoid mutation issues
        const updatedSplit = JSON.parse(JSON.stringify(currentSplit));
        const days = updatedSplit.days || updatedSplit.workoutDays;

        if (days && days[currentDayIndex]) {
          // Update exercises for the current day
          days[currentDayIndex].exercises = data;

          // Save to local storage
          await storage.saveSplit(updatedSplit);

          // Refresh to reflect changes
          await refreshTodaysWorkout();
        }
      }
    } catch (error) {
      console.error('[Workout] Error saving reordered exercises:', error);
      Alert.alert('Error', 'Failed to save exercise order. Please try again.');
    }
  }, [todaysWorkout, refreshTodaysWorkout]);

  const openReorderModal = () => {
    setShowOptionsMenu(false);
    setLocalExercises(todaysWorkout?.exercises || []);
    setShowReorderModal(true);
  };

  // Handle removing an exercise from the workout
  const handleRemoveExercise = useCallback(async (exerciseIndex) => {
    const updatedExercises = localExercises.filter((_, index) => index !== exerciseIndex);
    setLocalExercises(updatedExercises);

    // Update the split in local storage
    try {
      // Read fresh from storage to avoid stale data
      const currentSplit = await storage.getSplit();
      if (currentSplit) {
        const currentDayIndex = (todaysWorkout?.dayNumber || 1) - 1;
        // Deep copy the split to avoid mutation issues
        const updatedSplit = JSON.parse(JSON.stringify(currentSplit));
        const days = updatedSplit.days || updatedSplit.workoutDays;

        if (days && days[currentDayIndex]) {
          days[currentDayIndex].exercises = updatedExercises;
          await storage.saveSplit(updatedSplit);
          await refreshTodaysWorkout();
        }
      }
    } catch (error) {
      console.error('[Workout] Error removing exercise:', error);
      Alert.alert('Error', 'Failed to remove exercise. Please try again.');
    }
  }, [localExercises, todaysWorkout, refreshTodaysWorkout]);

  // Load exercise database (bundled + custom)
  useEffect(() => {
    const loadExerciseDatabase = async () => {
      try {
        const exercises = await storage.getExercises();
        setExerciseDatabase(exercises || []);
        const custom = await getCustomExercises(user?.id);
        setCustomExercises(custom || []);
      } catch (error) {
        console.error('[Workout] Error loading exercise database:', error);
      }
    };
    loadExerciseDatabase();
  }, []);

  // Open add exercise modal (close reorder modal first to avoid stacking issues on iOS)
  const openAddExerciseModal = () => {
    setShowReorderModal(false);
    setAddExerciseSearch('');
    setAddExerciseMuscleFilter('all');
    setSelectedNewExercise(null);
    setNewExerciseSets('3');
    setNewExerciseReps('10');
    // Small delay to let the reorder modal close first
    setTimeout(() => {
      setShowAddExerciseModal(true);
    }, 100);
  };

  // Close add exercise modal and return to edit workout
  const closeAddExerciseModal = () => {
    setShowAddExerciseModal(false);
    // Small delay before reopening edit modal
    setTimeout(() => {
      setShowReorderModal(true);
    }, 100);
  };

  // Filter exercises for search with muscle group filter
  const filteredExercisesForAdd = useMemo(() => {
    // Handle "My Exercises" filter - only show custom exercises
    if (addExerciseMuscleFilter === 'my_exercises') {
      let filtered = customExercises.map(ex => ({ ...ex, isCustom: true }));

      // Exclude exercises already in workout
      filtered = filtered.filter(ex =>
        !localExercises.some(e => e.id === ex.id || e.name === ex.name)
      );

      if (addExerciseSearch.trim()) {
        const lowercaseQuery = addExerciseSearch.toLowerCase();
        filtered = filtered.filter(ex =>
          ex.name.toLowerCase().includes(lowercaseQuery) ||
          ex.primaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
          ex.equipment?.toLowerCase().includes(lowercaseQuery)
        );
      }

      return filtered;
    }

    // Merge bundled and custom exercises
    const allExercises = [
      ...exerciseDatabase,
      ...customExercises.map(ex => ({ ...ex, isCustom: true }))
    ];

    return allExercises.filter(ex => {
      // Exclude exercises already in workout
      if (localExercises.some(e => e.id === ex.id || e.name === ex.name)) return false;

      // Apply muscle filter first (only primary muscles)
      if (addExerciseMuscleFilter !== 'all') {
        const primaryMatch = ex.primaryMuscles && ex.primaryMuscles.includes(addExerciseMuscleFilter);
        if (!primaryMatch) return false;
      }

      // Then apply search filter
      if (addExerciseSearch.trim()) {
        const lowercaseQuery = addExerciseSearch.toLowerCase();
        return (
          ex.name.toLowerCase().includes(lowercaseQuery) ||
          ex.primaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
          ex.secondaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
          ex.equipment?.toLowerCase().includes(lowercaseQuery) ||
          ex.category?.toLowerCase().includes(lowercaseQuery)
        );
      }

      return true;
    });
  }, [exerciseDatabase, customExercises, localExercises, addExerciseMuscleFilter, addExerciseSearch]);

  // Handle opening create custom exercise modal
  const openCreateCustomModal = () => {
    setShowAddExerciseModal(false);
    setTimeout(() => {
      setShowCreateCustomModal(true);
    }, 300);
  };

  // Handle creating a new custom exercise
  const handleCreateCustomExercise = async (exerciseData) => {
    const newExercise = await createCustomExercise(exerciseData, user?.id);
    setCustomExercises([...customExercises, newExercise]);
    setAddExerciseMuscleFilter('my_exercises');
    // Re-open add exercise modal after creating
    setTimeout(() => {
      setShowAddExerciseModal(true);
    }, 300);
  };

  // Handle adding an exercise to today's workout
  const handleAddExercise = useCallback(async () => {
    if (!selectedNewExercise) {
      Alert.alert('Select Exercise', 'Please select an exercise to add.');
      return;
    }

    const sets = parseInt(newExerciseSets) || 3;
    const reps = parseInt(newExerciseReps) || 10;

    // Create new exercise object matching the workout format
    const newExercise = {
      id: selectedNewExercise.id,
      name: selectedNewExercise.name,
      sets: sets.toString(),
      reps: reps.toString(),
      primaryMuscles: selectedNewExercise.primaryMuscles,
      secondaryMuscles: selectedNewExercise.secondaryMuscles,
      equipment: selectedNewExercise.equipment,
    };

    const updatedExercises = [...localExercises, newExercise];
    setLocalExercises(updatedExercises);

    // Update the split in local storage
    try {
      // Read fresh from storage to avoid stale data
      const currentSplit = await storage.getSplit();
      if (currentSplit) {
        const currentDayIndex = (todaysWorkout?.dayNumber || 1) - 1;
        // Deep copy the split to avoid mutation issues
        const updatedSplit = JSON.parse(JSON.stringify(currentSplit));
        const days = updatedSplit.days || updatedSplit.workoutDays;

        if (days && days[currentDayIndex]) {
          days[currentDayIndex].exercises = updatedExercises;
          await storage.saveSplit(updatedSplit);
          await refreshTodaysWorkout();
        }
      }
    } catch (error) {
      console.error('[Workout] Error adding exercise:', error);
      Alert.alert('Error', 'Failed to add exercise. Please try again.');
    }

    // Close and return to edit workout modal
    closeAddExerciseModal();
  }, [selectedNewExercise, newExerciseSets, newExerciseReps, localExercises, todaysWorkout, refreshTodaysWorkout]);

  // Show loading state while context initializes
  if (!isInitialized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.title, { color: colors.text }]}>Today's Workout</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // Show Begin Split card if split exists but hasn't been started
  if (activeSplit && activeSplit.started === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.title, { color: colors.text }]}>Today's Workout</Text>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
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

  // Handle case where user has no split at all
  if (!activeSplit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.title, { color: colors.text }]}>Today's Workout</Text>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          <EmptyState
            icon="barbell-outline"
            title="No Active Split"
            message="Get started by creating a workout split in the Program tab. You'll be able to track your workouts and progress!"
            ctaText="Create Your Split"
            ctaIcon="add-circle-outline"
            onCtaPress={() => router.push('/program')}
          />
        </ScrollView>
      </View>
    );
  }

  // Handle case where split exists but workout is still being calculated
  if (!todaysWorkout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.title, { color: colors.text }]}>Today's Workout</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // Show Rest Day Card for rest days
  if (isRestDay) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerContainer, styles.headerContainerCompleted]}>
          <Text style={[styles.title, styles.titleCompleted]}>Today's Workout</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
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
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Workout Day</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowChangeDayModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>
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
                    style={[styles.dayPickerCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
                    onPress={() => handleDaySelected(index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dayPickerCardContent}>
                      {day.emoji && <Text style={styles.dayPickerEmoji}>{day.emoji}</Text>}
                      <View style={styles.dayPickerInfo}>
                        <Text style={[styles.dayPickerName, { color: colors.text }]}>{dayName}</Text>
                        {!isRest && exerciseCount > 0 && (
                          <Text style={[styles.dayPickerExercises, { color: colors.secondaryText }]}>
                            {exerciseCount} exercises
                          </Text>
                        )}
                      </View>
                    </View>
                    {isRest && (
                      <View style={[styles.restDayBadge, { backgroundColor: colors.borderLight + '40' }]}>
                        <Ionicons name="moon" size={14} color={colors.secondaryText} />
                        <Text style={[styles.restDayBadgeText, { color: colors.secondaryText }]}>Rest</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={colors.primary} />
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
            onAnimationComplete={() => {
              setShowCelebration(false);
              setIsToggling(false);
            }}
          />
        )}
      </View>
    );
  }

  // Show Free Rest Day Card when a free rest day has been taken today
  if (todaysWorkoutCompleted && completedSessionId === 'free-rest-day') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerContainer, { backgroundColor: colors.warning }]}>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>Today's Workout</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          <View style={styles.contentContainer}>
            <FreeRestDayCard
              splitName={activeSplit?.name}
              splitEmoji={activeSplit?.emoji}
              weekNumber={todaysWorkout?.weekNumber}
              dayNumber={todaysWorkout?.dayNumber}
              originalWorkoutName={todaysWorkout?.dayName}
              onRestLogged={() => {
                setShowCelebration(true);
              }}
              onUndoRestDay={() => {
                Alert.alert(
                  'Undo Free Rest Day?',
                  'This will restore your free rest day for this week and you can resume your workout.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Undo',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await markWorkoutCompleted(null);
                          await clearFreeRestDayUsageForToday();
                          await AsyncStorage.removeItem('freeRestDayDate');
                          setFreeRestDayAvailable(true);
                        } catch (error) {
                          console.error('[Workout Tab] Error undoing free rest day:', error);
                          Alert.alert('Error', 'Failed to undo free rest day. Please try again.');
                        }
                      },
                    },
                  ]
                );
              }}
            />
          </View>
        </ScrollView>

        {/* Celebration Animation */}
        {showCelebration && (
          <CelebrationAnimation
            key={Date.now()}
            onAnimationComplete={() => {
              setShowCelebration(false);
              setIsToggling(false);
            }}
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

                // Update context state (this updates todaysWorkoutCompleted)
                await markWorkoutCompleted(null);

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
          if (workout.exercises && workout.exercises.length > 0) {
            workout.exercises.forEach(exercise => {
              if (exercise.sets) {
                exercise.sets.forEach(set => {
                  set.completed = true;
                  set.reps = set.reps || 0;
                  set.weight = set.weight || 0;
                });
              }
            });
          }

          // Save the updated workout with completed sets back to storage
          await storage.saveActiveWorkout(workout);

          // Complete the workout immediately
          await localCompleteWorkout(workout.id);

          // Update context state (this updates todaysWorkoutCompleted)
          await markWorkoutCompleted(workout.id, isRestDay);

          // Calculate and store current streak from local storage
          try {
            const streak = await calculateStreakFromLocal();
            setCurrentStreak(streak);
          } catch (error) {
            console.error('[Workout Tab] Error calculating streak:', error);
          }

          // Show celebration animation (isToggling stays true until animation completes)
          setShowCelebration(true);

          // Update pending count for sync
          await updatePendingCount();
        } else {
          setShowCelebration(true);
        }
        // Don't set isToggling to false here - wait for animation to complete
      } catch (error) {
        console.error('[Workout Tab] Error saving quick workout completion:', error);
        Alert.alert('Error', 'Failed to save workout progress. Please try again.');
        setIsToggling(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[
        styles.headerContainer,
        { backgroundColor: colors.cardBackground, shadowColor: colors.shadow },
        isCompleted && styles.headerContainerCompleted
      ]}>
        <Text style={[
          styles.title,
          { color: colors.text },
          isCompleted && styles.titleCompleted
        ]}>Today's Workout</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.contentContainer}>
          {/* Today's Workout Card */}
          <View style={[
            styles.workoutCard,
            { backgroundColor: colors.cardBackground, shadowColor: colors.shadow, borderColor: colors.borderLight },
            isCompleted && styles.workoutCardCompleted
          ]}>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutInfo}>
                <View style={styles.workoutTitleRow}>
                  <Text style={[styles.workoutTitle, { color: colors.text }]}>{todaysWorkout.dayName}</Text>
                  <View style={styles.headerActions}>
                    <Text style={[styles.exerciseCount, { color: colors.secondaryText }]}>
                      {todaysWorkout.exercises.length} exercises
                    </Text>
                    {!isCompleted && (
                      <TouchableOpacity
                        style={styles.optionsButton}
                        onPress={() => setShowOptionsMenu(!showOptionsMenu)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.secondaryText} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {activeSplit?.name && (
                  <Text style={[styles.splitName, { color: colors.primary }]}>
                    {activeSplit.emoji && `${activeSplit.emoji} `}{activeSplit.name}
                  </Text>
                )}
                <Text style={[styles.cycleInfo, { color: colors.secondaryText }]}>
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
                <View style={[styles.optionsMenuOverlay, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
                  <TouchableOpacity
                    style={styles.optionsMenuItem}
                    onPress={() => {
                      setShowOptionsMenu(false);
                      setShowChangeDayModal(true);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={18} color={colors.text} />
                    <Text style={[styles.optionsMenuItemText, { color: colors.text }]}>Change Today's Workout</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.optionsMenuItem}
                    onPress={openReorderModal}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.text} />
                    <Text style={[styles.optionsMenuItemText, { color: colors.text }]}>Edit Workout</Text>
                  </TouchableOpacity>
                  {freeRestDayAvailable && (
                    <TouchableOpacity
                      style={styles.optionsMenuItem}
                      onPress={() => {
                        setShowOptionsMenu(false);
                        Alert.alert(
                          'Take Free Rest Day?',
                          'This will use your free rest day for the week. Your current workout will be waiting tomorrow.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Take Rest Day',
                              onPress: async () => {
                                await markFreeRestDay();
                                setFreeRestDayAvailable(false);
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="bed-outline" size={18} color={colors.warning} />
                      <Text style={[styles.optionsMenuItemText, { color: colors.warning }]}>Take Free Rest Day</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* Exercises List */}
            <View style={styles.exercisesList}>
              {(isExercisesExpanded || !shouldCollapse
                ? todaysWorkout.exercises
                : todaysWorkout.exercises.slice(0, maxVisibleExercises)
              ).map((exercise, exerciseIndex) => (
                <View key={exerciseIndex} style={[styles.exerciseItem, { borderBottomColor: colors.borderLight + '40' }]}>
                  <View style={styles.exerciseContent}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exerciseIndex + 1}. {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseDetailText, { color: colors.secondaryText }]}>
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
                  <Text style={[styles.showMoreText, { color: colors.primary }]}>
                    {isExercisesExpanded
                      ? 'Show less'
                      : `Show ${todaysWorkout.exercises.length - maxVisibleExercises} more`}
                  </Text>
                  <Ionicons
                    name={isExercisesExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {!isCompleted && (
                <>
                  {/* No exercises warning */}
                  {!hasExercises && (
                    <View style={[styles.noExercisesWarning, { backgroundColor: colors.borderLight + '40' }]}>
                      <Ionicons name="alert-circle-outline" size={18} color={colors.secondaryText} />
                      <Text style={[styles.noExercisesWarningText, { color: colors.secondaryText }]}>
                        Add exercises to this workout to get started
                      </Text>
                    </View>
                  )}

                  {/* Primary CTA: Start/Resume Workout */}
                  <TouchableOpacity
                    style={[
                      styles.startWorkoutButton,
                      { backgroundColor: colors.primary, shadowColor: colors.primary },
                      !hasExercises && styles.startWorkoutButtonDisabled
                    ]}
                    onPress={() => {
                      skipAutoResumeRef.current = false;
                      router.push({
                        pathname: '/workout/session',
                        params: {
                          workoutData: JSON.stringify(todaysWorkout)
                        }
                      });
                    }}
                    disabled={!hasExercises}
                    activeOpacity={!hasExercises ? 1 : 0.7}
                  >
                    <Text style={[
                      styles.startWorkoutText,
                      { color: colors.onPrimary },
                      !hasExercises && styles.startWorkoutTextDisabled
                    ]}>
                      {hasActiveWorkout ? 'Resume Workout' : 'Start Workout'}
                    </Text>
                  </TouchableOpacity>

                  {/* Secondary Action: Mark Complete */}
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionButton,
                      { borderColor: colors.borderLight },
                      isToggling && styles.secondaryActionButtonDisabled
                    ]}
                    onPress={handleToggleCompletion}
                    disabled={isToggling}
                    activeOpacity={isToggling ? 1 : 0.7}
                  >
                    <Text style={[styles.secondaryActionText, { color: colors.secondaryText }]}>Complete Workout</Text>
                  </TouchableOpacity>
                </>
              )}

              {isCompleted && (
                <>
                  {hasPosted ? (
                    /* Workout Posted - Show completed state */
                    <View style={styles.workoutCompletedContainer}>
                      <View style={styles.workoutCompletedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                        <Text style={[styles.workoutCompletedText, { color: colors.text }]}>Workout Completed</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Share Button */}
                      <TouchableOpacity
                        style={[
                          styles.postWorkoutButton,
                          isToggling && styles.postWorkoutButtonDisabled
                        ]}
                        onPress={() => {
                          // Calculate if this workout completes the split
                          // (last workout day, or only rest days remaining)
                          let isSplitCompleted = false;
                          if (activeSplit?.days && todaysWorkout?.dayNumber) {
                            const currentDayIndex = todaysWorkout.dayNumber - 1;
                            const totalDays = activeSplit.days.length;
                            isSplitCompleted = true;
                            // Check if there are any workout days after this one
                            for (let i = currentDayIndex + 1; i < totalDays; i++) {
                              const day = activeSplit.days[i];
                              if (day && !day.isRest) {
                                isSplitCompleted = false;
                                break;
                              }
                            }
                          }

                          router.push({
                            pathname: '/post/create',
                            params: {
                              workoutData: JSON.stringify(todaysWorkout),
                              workoutSessionId: completedSessionId?.toString() || '',
                              splitId: activeSplit?.id?.toString() || '',
                              streak: currentStreak.toString(),
                              isSplitCompleted: isSplitCompleted.toString(),
                            },
                          });
                        }}
                        disabled={isToggling}
                        activeOpacity={isToggling ? 1 : 0.7}
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
                          { borderColor: colors.borderLight },
                          isToggling && styles.secondaryActionButtonDisabled
                        ]}
                        onPress={handleToggleCompletion}
                        disabled={isToggling}
                        activeOpacity={isToggling ? 1 : 0.7}
                      >
                        <Text style={[styles.secondaryActionText, { color: colors.secondaryText }]}>Un-complete</Text>
                      </TouchableOpacity>
                    </>
                  )}
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
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Workout Day</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowChangeDayModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>
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
              const dayName = isRest ? 'Rest Day' : (day.name || day.workoutName || day.dayName || `Day ${index + 1}`);
              let exerciseCount = 0;
              if (!isRest && day.exercises) {
                try {
                  exerciseCount = typeof day.exercises === 'string'
                    ? JSON.parse(day.exercises).length
                    : Array.isArray(day.exercises) ? day.exercises.length : 0;
                } catch (e) {
                  exerciseCount = 0;
                }
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayPickerCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
                  onPress={() => handleDaySelected(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayPickerCardContent}>
                    {day.emoji && <Text style={styles.dayPickerEmoji}>{day.emoji}</Text>}
                    <View style={styles.dayPickerInfo}>
                      <Text style={[styles.dayPickerName, { color: colors.text }]}>{dayName}</Text>
                      {!isRest && exerciseCount > 0 && (
                        <Text style={[styles.dayPickerExercises, { color: colors.secondaryText }]}>
                          {exerciseCount} exercises
                        </Text>
                      )}
                    </View>
                  </View>
                  {isRest && (
                    <View style={[styles.restDayBadge, { backgroundColor: colors.borderLight + '40' }]}>
                      <Ionicons name="moon" size={14} color={colors.secondaryText} />
                      <Text style={[styles.restDayBadgeText, { color: colors.secondaryText }]}>Rest</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Reorder Exercises Modal */}
      <Modal
        visible={showReorderModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReorderModal(false)}
      >
        <GestureHandlerRootView style={[styles.gestureRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.reorderModalHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={() => setShowReorderModal(false)}>
              <Text style={[styles.reorderCancelText, { color: colors.secondaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.reorderModalTitle, { color: colors.text }]}>Edit Workout</Text>
            <TouchableOpacity onPress={() => setShowReorderModal(false)}>
              <Text style={[styles.reorderDoneText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Add Exercise Button */}
          <TouchableOpacity
            style={[styles.addExerciseButton, { backgroundColor: colors.primary }]}
            onPress={openAddExerciseModal}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={colors.onPrimary} />
            <Text style={[styles.addExerciseButtonText, { color: colors.onPrimary }]}>Add Exercise</Text>
          </TouchableOpacity>

          <DraggableFlatList
            data={localExercises}
            keyExtractor={(item, index) => `reorder-${item.id || item.name}-${index}`}
            onDragEnd={handleReorderExercises}
            contentContainerStyle={styles.reorderListContent}
            activationDistance={0}
            renderItem={({ item, drag, isActive, getIndex }) => {
              const index = getIndex();
              return (
                <ScaleDecorator>
                  <View
                    style={[
                      styles.reorderItem,
                      { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
                      isActive && [styles.reorderItemDragging, { shadowColor: colors.primary, borderColor: colors.primary }]
                    ]}
                  >
                    <TouchableOpacity
                      onPressIn={drag}
                      disabled={isActive}
                      style={styles.reorderDragHandle}
                    >
                      <View style={styles.reorderDragDots}>
                        {[0, 1].map((row) => (
                          <View key={row} style={styles.reorderDragDotsRow}>
                            <View style={[styles.reorderDragDot, { backgroundColor: colors.secondaryText }]} />
                            <View style={[styles.reorderDragDot, { backgroundColor: colors.secondaryText }]} />
                            <View style={[styles.reorderDragDot, { backgroundColor: colors.secondaryText }]} />
                            <View style={[styles.reorderDragDot, { backgroundColor: colors.secondaryText }]} />
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                    <View style={[styles.reorderExerciseNumber, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.reorderExerciseNumberText, { color: colors.primary }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.reorderExerciseInfo}>
                      <Text style={[styles.reorderExerciseName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.reorderExerciseDetails, { color: colors.secondaryText }]}>
                        {item.sets && `${item.sets} sets`}
                        {item.sets && item.reps && ' · '}
                        {item.reps && `${item.reps} reps`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.reorderRemoveButton}
                      onPress={() => handleRemoveExercise(index)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </ScaleDecorator>
              );
            }}
          />
        </GestureHandlerRootView>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAddExerciseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.addExerciseModalContainer, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={[styles.addExerciseModalHeader, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
            <View style={styles.addExerciseModalHeaderContent}>
              <Text style={[styles.addExerciseModalTitle, { color: colors.text }]}>Add Exercise</Text>
              <View style={styles.addExerciseHeaderActions}>
                <TouchableOpacity
                  style={styles.createCustomButton}
                  onPress={openCreateCustomModal}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  <Text style={[styles.createCustomButtonText, { color: colors.primary }]}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addExerciseModalCloseButton}
                  onPress={closeAddExerciseModal}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Search */}
          <View style={[styles.addExerciseSearchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={20} color={colors.secondaryText} />
            <TextInput
              style={[styles.addExerciseSearchInput, { color: colors.text }]}
              placeholder="Search exercises..."
              placeholderTextColor={colors.secondaryText}
              value={addExerciseSearch}
              onChangeText={setAddExerciseSearch}
              autoCapitalize="none"
            />
            {addExerciseSearch.length > 0 && (
              <TouchableOpacity onPress={() => setAddExerciseSearch('')}>
                <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>

          {/* Muscle Group Filter Pills */}
          <View style={styles.addExerciseFilterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.addExerciseFilterScrollView}
              contentContainerStyle={styles.addExerciseFilterScrollContent}
            >
              {muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle.id}
                  style={[
                    styles.addExerciseFilterPill,
                    { backgroundColor: colors.borderLight + '80' },
                    addExerciseMuscleFilter === muscle.id && [styles.addExerciseFilterPillActive, { backgroundColor: colors.primary, borderColor: colors.primary, shadowColor: colors.primary }]
                  ]}
                  onPress={() => {
                    setAddExerciseMuscleFilter(muscle.id);
                    if (muscle.id !== 'all' && addExerciseSearch.trim()) {
                      setAddExerciseSearch('');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.addExerciseFilterPillText,
                    { color: colors.text },
                    addExerciseMuscleFilter === muscle.id && [styles.addExerciseFilterPillTextActive, { color: colors.onPrimary }]
                  ]}>
                    {muscle.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Selected Exercise Config */}
          {selectedNewExercise && (
            <View style={[styles.addExerciseSelectedConfig, { backgroundColor: colors.cardBackground, borderColor: colors.primary + '40' }]}>
              <View style={styles.addExerciseSelectedBadge}>
                <Text style={[styles.addExerciseSelectedName, { color: colors.text }]}>{selectedNewExercise.name}</Text>
                <TouchableOpacity onPress={() => setSelectedNewExercise(null)}>
                  <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
              <View style={styles.addExerciseConfigRow}>
                <View style={styles.addExerciseConfigItem}>
                  <Text style={[styles.addExerciseConfigLabel, { color: colors.secondaryText }]}>Sets</Text>
                  <TextInput
                    style={[styles.addExerciseConfigInput, { color: colors.text, borderColor: colors.borderLight }]}
                    value={newExerciseSets}
                    onChangeText={setNewExerciseSets}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={styles.addExerciseConfigItem}>
                  <Text style={[styles.addExerciseConfigLabel, { color: colors.secondaryText }]}>Reps</Text>
                  <TextInput
                    style={[styles.addExerciseConfigInput, { color: colors.text, borderColor: colors.borderLight }]}
                    value={newExerciseReps}
                    onChangeText={setNewExerciseReps}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.addExerciseModalSaveButton, { backgroundColor: colors.primary, marginTop: 12 }]}
                onPress={handleAddExercise}
              >
                <Text style={[styles.addExerciseModalSaveText, { color: colors.onPrimary }]}>
                  Add to Workout
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Exercise List */}
          <ScrollView style={styles.addExerciseList} contentContainerStyle={styles.addExerciseListContent}>
            {filteredExercisesForAdd.length === 0 && addExerciseMuscleFilter === 'my_exercises' ? (
              <View style={styles.emptyCustomExercises}>
                <Text style={[styles.emptyCustomText, { color: colors.secondaryText }]}>
                  No custom exercises yet
                </Text>
                <TouchableOpacity
                  style={[styles.createFirstButton, { backgroundColor: colors.primary }]}
                  onPress={openCreateCustomModal}
                >
                  <Ionicons name="add" size={18} color={colors.onPrimary} />
                  <Text style={[styles.createFirstButtonText, { color: colors.onPrimary }]}>Create Your First</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {filteredExercisesForAdd.map(exercise => {
                  const isSelected = selectedNewExercise?.id === exercise.id;
                  return (
                    <View key={exercise.id} style={isSelected ? [styles.addExerciseSelectedWrapper, { borderColor: colors.primary }] : styles.addExerciseCardWrapper}>
                      <ExerciseCard
                        exercise={exercise}
                        onPress={() => setSelectedNewExercise(exercise)}
                        compact={true}
                        showMuscles={false}
                        showCategory={false}
                        isCustom={exercise.isCustom}
                        style={isSelected ? { marginBottom: 0, borderWidth: 0 } : undefined}
                      />
                      {isSelected && (
                        <View style={[styles.addExerciseSelectedCheckmark, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
                        </View>
                      )}
                    </View>
                  );
                })}
                {filteredExercisesForAdd.length === 0 && (
                  <Text style={[styles.addExerciseNoResults, { color: colors.secondaryText }]}>No exercises found</Text>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Custom Exercise Modal */}
      <CreateCustomExerciseModal
        visible={showCreateCustomModal}
        onClose={() => setShowCreateCustomModal(false)}
        onSave={handleCreateCustomExercise}
      />

      {/* Celebration Animation */}
      {showCelebration && (
        <CelebrationAnimation
          key={completedSessionId || Date.now()}
          onAnimationComplete={() => {
            setShowCelebration(false);
            setIsToggling(false);
          }}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20,
    flex: 1,
    alignItems: 'stretch',
  },

  // Workout Card (matching Activity card styling)
  workoutCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: Colors.light.border,
    width: '100%',
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

  // No exercises warning
  noExercisesWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  noExercisesWarningText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
  startWorkoutButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  startWorkoutText: {
    color: Colors.light.onPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  startWorkoutTextDisabled: {
    opacity: 0.8,
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
  postWorkoutButtonDisabled: {
    opacity: 0.5,
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

  // Workout Completed State
  workoutCompletedContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  workoutCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutCompletedText: {
    fontSize: 18,
    fontWeight: '600',
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

  // Reorder Modal
  gestureRoot: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  reorderModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  reorderModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  reorderCancelText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  reorderDoneText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  reorderHint: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    paddingVertical: 12,
    fontStyle: 'italic',
  },
  reorderListContent: {
    padding: 16,
  },
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  reorderItemDragging: {
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    borderColor: Colors.light.primary,
  },
  reorderDragHandle: {
    padding: 12,
    marginRight: 8,
    marginLeft: -8,
  },
  reorderDragDots: {
    flexDirection: 'column',
    gap: 3,
  },
  reorderDragDotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  reorderDragDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.secondaryText,
  },
  reorderExerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reorderExerciseNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  reorderExerciseInfo: {
    flex: 1,
  },
  reorderExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  reorderExerciseDetails: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  reorderRemoveButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Add Exercise Button in Edit Modal
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  addExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.onPrimary,
  },

  // Add Exercise Modal
  addExerciseModalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  addExerciseModalHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addExerciseModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addExerciseModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addExerciseModalCloseButton: {
    padding: 4,
  },
  addExerciseModalSaveButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addExerciseModalSaveButtonDisabled: {
    opacity: 0.4,
  },
  addExerciseModalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.onPrimary,
  },
  addExerciseModalSaveTextDisabled: {
    opacity: 0.6,
  },

  // Add Exercise Search
  addExerciseSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    gap: 8,
  },
  addExerciseSearchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },

  // Add Exercise Filter Section
  addExerciseFilterSection: {
    paddingBottom: 12,
  },
  addExerciseFilterScrollView: {
    paddingHorizontal: 16,
  },
  addExerciseFilterScrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  addExerciseFilterPill: {
    backgroundColor: Colors.light.borderLight + '80',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  addExerciseFilterPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addExerciseFilterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  addExerciseFilterPillTextActive: {
    color: Colors.light.onPrimary,
  },

  // Add Exercise Selected Config
  addExerciseSelectedConfig: {
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary + '40',
  },
  addExerciseSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addExerciseSelectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  addExerciseConfigRow: {
    flexDirection: 'row',
    gap: 16,
  },
  addExerciseConfigItem: {
    flex: 1,
  },
  addExerciseConfigLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addExerciseConfigInput: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },

  // Add Exercise List
  addExerciseList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addExerciseListContent: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  addExerciseCardWrapper: {
    // Non-selected cards - no special styling needed
  },
  addExerciseSelectedWrapper: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    marginBottom: 8,
    position: 'relative',
  },
  addExerciseSelectedCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseNoResults: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    paddingVertical: 40,
  },

  // Create Custom Exercise Button in Header
  addExerciseHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  createCustomButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty Custom Exercises State
  emptyCustomExercises: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCustomText: {
    fontSize: 16,
    marginBottom: 16,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createFirstButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});