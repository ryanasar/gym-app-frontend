import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import CelebrationAnimation from '../components/animations/CelebrationAnimation';
import ExerciseCard from '../components/exercises/ExerciseCard';
import RestDayCard from '../components/workout/RestDayCard';
import FreeRestDayCard from '../components/workout/FreeRestDayCard';
import BeginSplitCard from '../components/workout/BeginSplitCard';
import SplitWorkoutCard from '../components/workout/SplitWorkoutCard';
import IndividualWorkoutView from '../components/workout/IndividualWorkoutView';
import CreateCustomExerciseModal from '../components/exercises/CreateCustomExerciseModal';
import IndividualWorkoutCompletedCard from '../components/workout/IndividualWorkoutCompletedCard';
import SavedWorkoutPicker from '../components/workout/SavedWorkoutPicker';
import SavedWorkoutDetailCard from '../components/workout/SavedWorkoutDetailCard';
import TabBar from '../components/ui/TabBar';
import { Colors } from '../constants/colors';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSync } from '../contexts/SyncContext';
import { useAuth } from '../auth/auth';
import { getActiveWorkout, storage, calculateStreakFromLocal, createCompletedWorkoutSession } from '../../storage';
import { getCalendarData } from '../../storage/calendarStorage';
import { isFreeRestDayAvailable, clearFreeRestDayUsageForToday } from '../../storage/freeRestDayStorage';
import { getTodaysWorkoutPost } from '../api/postsApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '../hooks/useThemeColors';
import { getCustomExercises, createCustomExercise } from '../api/customExercisesApi';
import { getSavedWorkouts, deleteSavedWorkout } from '../api/savedWorkoutsApi';
import { useWorkoutCompletion } from '../hooks/workout/useWorkoutCompletion';
import { useExerciseFiltering } from '../hooks/workout/useExerciseFiltering';
import { useExerciseManagement } from '../hooks/workout/useExerciseManagement';
import { calculateWorkoutCardCollapse } from '../utils/workout/workoutCalculations';
import { handleDaySelection } from '../utils/workout/splitManagement';

const WORKOUT_TABS = [
  { key: 'split', label: 'My Split' },
  { key: 'individual', label: 'Individual' },
];

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
    individualWorkoutCompleted,
    completedIndividualWorkout,
    markIndividualWorkoutCompleted,
  } = useWorkout();
  const { updatePendingCount, manualSync } = useSync();

  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasPosted, setHasPosted] = useState(false);
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
  const skipAutoResumeRef = useRef(false);
  const completionProcessedRef = useRef(false);
  const [freeRestDayAvailable, setFreeRestDayAvailable] = useState(false);
  const [workoutMode, setWorkoutMode] = useState('split');
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [selectedSavedWorkout, setSelectedSavedWorkout] = useState(null);

  // Modal state
  const [showChangeDayModal, setShowChangeDayModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showCreateCustomModal, setShowCreateCustomModal] = useState(false);

  // Exercise database and filtering state
  const [exerciseDatabase, setExerciseDatabase] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [addExerciseSearch, setAddExerciseSearch] = useState('');
  const [addExerciseMuscleFilter, setAddExerciseMuscleFilter] = useState('all');
  const [selectedNewExercise, setSelectedNewExercise] = useState(null);
  const [newExerciseSets, setNewExerciseSets] = useState('3');
  const [newExerciseReps, setNewExerciseReps] = useState('10');

  const isCompleted = todaysWorkoutCompleted;
  const completedSessionId = cachedSessionId;

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

  // Custom hooks
  const { isToggling, setIsToggling, handleToggleCompletion } = useWorkoutCompletion({
    markWorkoutCompleted,
    updatePendingCount,
    todaysWorkout,
    activeSplit,
    isRestDay: todaysWorkout?.isRest || (todaysWorkout?.exercises?.length === 0 && todaysWorkout?.dayName === 'Rest Day'),
    completedSessionId
  });

  const { localExercises, setLocalExercises, handleReorderExercises, handleRemoveExercise, handleAddExercise } = useExerciseManagement({
    todaysWorkout,
    refreshTodaysWorkout
  });

  const filteredExercisesForAdd = useExerciseFiltering({
    exerciseDatabase,
    customExercises,
    localExercises,
    muscleFilter: addExerciseMuscleFilter,
    searchQuery: addExerciseSearch
  });

  // Load saved workout mode preference on mount
  useEffect(() => {
    const loadWorkoutMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('workoutModePreference');
        if (savedMode === 'split' || savedMode === 'individual') {
          setWorkoutMode(savedMode);
        }
      } catch (error) {
        console.error('[Workout] Error loading workout mode preference:', error);
      }
    };
    loadWorkoutMode();
  }, []);

  // Handle workout mode change (save to AsyncStorage)
  const handleWorkoutModeChange = useCallback(async (mode) => {
    setWorkoutMode(mode);
    try {
      await AsyncStorage.setItem('workoutModePreference', mode);
    } catch (error) {
      console.error('[Workout] Error saving workout mode preference:', error);
    }
  }, []);

  // Calculate workout card collapse state
  const { shouldCollapse, maxVisibleExercises } = useMemo(() =>
    calculateWorkoutCardCollapse(todaysWorkout),
    [todaysWorkout]
  );

  // Handle returning from completed workout session
  useEffect(() => {
    const handleCompletedSession = async () => {
      // Reset the ref when not in completed state (allows future completions)
      if (params.completed !== 'true') {
        completionProcessedRef.current = false;
        return;
      }

      // Only process completion once per session
      if (completionProcessedRef.current) {
        return;
      }
      completionProcessedRef.current = true;

      // Calculate streak when returning from completed workout
      try {
        const streak = await calculateStreakFromLocal();
        setCurrentStreak(streak);
      } catch (error) {
        console.error('[Workout Tab] Error calculating streak after session:', error);
      }

      // Handle individual workout completion (freestyle or saved)
      const source = params.source;
      if (source === 'freestyle' || source === 'saved') {
        // Parse the workout data and mark as completed
        if (params.workoutData) {
          try {
            const workoutData = JSON.parse(params.workoutData);
            await markIndividualWorkoutCompleted(workoutData);
          } catch (error) {
            console.error('[Workout Tab] Error parsing workout data:', error);
          }
        }
        // Switch to Individual tab to show the completed card
        setWorkoutMode('individual');
      }

      // Show celebration animation when returning from completed workout
      setShowCelebration(true);
    };
    handleCompletedSession();
  }, [params.completed, params.source, params.workoutData, markIndividualWorkoutCompleted]);

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
  const handleDaySelectedWrapper = async (dayIndex) => {
    await handleDaySelection(dayIndex, activeSplit, markWorkoutCompleted, refreshTodaysWorkout);
    setShowChangeDayModal(false);
  };

  // Sync local exercises with todaysWorkout
  useEffect(() => {
    if (todaysWorkout?.exercises) {
      setLocalExercises(todaysWorkout.exercises);
    }
  }, [todaysWorkout?.exercises]);

  const openReorderModal = () => {
    setLocalExercises(todaysWorkout?.exercises || []);
    setShowReorderModal(true);
  };

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

  // Load saved workouts for no-split and different workout modal
  useFocusEffect(
    useCallback(() => {
      const loadSavedWorkouts = async () => {
        try {
          const workouts = await getSavedWorkouts();
          setSavedWorkouts(workouts || []);
        } catch (error) {
          console.error('[Workout] Error loading saved workouts:', error);
        }
      };
      loadSavedWorkouts();
    }, [])
  );

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
            onDaySelected={handleDaySelectedWrapper}
          />
        </ScrollView>
      </View>
    );
  }

  // Handle case where user has no split at all
  if (!activeSplit) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[
          styles.headerContainer,
          { backgroundColor: colors.cardBackground, shadowColor: colors.shadow },
          individualWorkoutCompleted && styles.headerContainerCompleted
        ]}>
          <Text style={[
            styles.title,
            { color: colors.text },
            individualWorkoutCompleted && styles.titleCompleted
          ]}>Today's Workout</Text>
        </View>

        {/* Tab Toggle - My Split vs Individual */}
        <TabBar
          tabs={WORKOUT_TABS}
          activeTab={workoutMode}
          onTabPress={handleWorkoutModeChange}
          style={{ backgroundColor: colors.cardBackground }}
          completed={individualWorkoutCompleted}
          lockedTab={individualWorkoutCompleted ? 'individual' : null}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.noSplitScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {workoutMode === 'individual' ? (
            individualWorkoutCompleted && completedIndividualWorkout ? (
              /* Show completed workout card */
              <View style={styles.contentContainer}>
                <IndividualWorkoutCompletedCard
                  workoutData={completedIndividualWorkout}
                  onPostWorkout={() => {
                    // Format workout data like split workouts for consistent post creation
                    const workoutDataForPost = {
                      dayName: completedIndividualWorkout.workoutName || 'Workout',
                      exercises: completedIndividualWorkout.exercises || [],
                      source: completedIndividualWorkout.source || 'freestyle',
                    };
                    router.push({
                      pathname: '/post/create',
                      params: {
                        workoutData: JSON.stringify(workoutDataForPost),
                        workoutSessionId: completedIndividualWorkout.workoutSessionId?.toString() || '',
                      },
                    });
                  }}
                  onUncomplete={async () => {
                    await markIndividualWorkoutCompleted(null);
                  }}
                />
              </View>
            ) : selectedSavedWorkout ? (
              /* Show selected saved workout detail */
              <SavedWorkoutDetailCard
                workout={selectedSavedWorkout}
                onBack={() => setSelectedSavedWorkout(null)}
                onEdit={(workout) => router.push({
                  pathname: '/workout/make-workout',
                  params: { editWorkoutId: workout.id }
                })}
                onMarkComplete={async (workout) => {
                  // Create a workout session so the post has exercise data
                  const workoutSessionId = await createCompletedWorkoutSession({
                    workoutName: workout.name,
                    exercises: workout.exercises || [],
                    source: 'saved',
                    savedWorkoutId: workout.id?.toString(),
                  });
                  const workoutData = {
                    source: 'saved',
                    workoutSessionId,
                    workoutName: workout.name,
                    exercises: workout.exercises?.map(ex => ({
                      name: ex.name,
                      completedSets: ex.sets || 0,
                      totalSets: ex.sets || 0,
                    })) || [],
                    completedAt: Date.now(),
                  };
                  await markIndividualWorkoutCompleted(workoutData);
                  setSelectedSavedWorkout(null);
                  setShowCelebration(true);
                }}
              />
            ) : (
              /* Show freestyle/saved options */
              <>
                {/* Freestyle Workout Option */}
                <TouchableOpacity
                  style={[styles.freestyleCard, { backgroundColor: colors.cardBackground, borderColor: colors.primary + '30' }]}
                  onPress={() => router.push({ pathname: '/workout/session', params: { source: 'freestyle' } })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.freestyleIconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="flash" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.freestyleContent}>
                    <Text style={[styles.freestyleTitle, { color: colors.text }]}>Start Freestyle Workout</Text>
                    <Text style={[styles.freestyleSubtitle, { color: colors.secondaryText }]}>
                      Add exercises as you go
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.secondaryText} />
                </TouchableOpacity>

                {/* Saved Workouts Section */}
                {savedWorkouts.length > 0 && (
                  <View style={styles.savedWorkoutsSection}>
                    <Text style={[styles.savedWorkoutsSectionTitle, { color: colors.text }]}>
                      Saved Workouts
                    </Text>
                    <SavedWorkoutPicker
                      workouts={savedWorkouts}
                      onSelect={(workout) => setSelectedSavedWorkout(workout)}
                    />
                  </View>
                )}
              </>
            )
          ) : (
            /* My Split Tab - No split created yet */
            <View style={styles.createSplitSection}>
              <View style={[styles.noSplitCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
                <Ionicons name="calendar-outline" size={48} color={colors.secondaryText} style={{ marginBottom: 16 }} />
                <Text style={[styles.noSplitTitle, { color: colors.text }]}>No Workout Split</Text>
                <Text style={[styles.noSplitSubtitle, { color: colors.secondaryText }]}>
                  Create a workout split to follow a structured weekly plan
                </Text>
                <TouchableOpacity
                  style={[styles.createSplitButtonPrimary, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/program')}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.createSplitButtonPrimaryText}>Create a Workout Split</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Celebration Animation for individual workout completion */}
        {showCelebration && (
          <CelebrationAnimation
            onAnimationComplete={() => {
              setShowCelebration(false);
            }}
          />
        )}
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
                    onPress={() => handleDaySelectedWrapper(index)}
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
            onAnimationComplete={() => {
              setShowCelebration(false);
              setIsToggling(false);
            }}
          />
        )}
      </View>
    );
  }

  // Wrapper for handleToggleCompletion from hook with celebration logic
  const handleToggleCompletionWrapper = async () => {
    const workoutId = await handleToggleCompletion(isCompleted);
    if (workoutId && !isCompleted) {
      // Show celebration when marking complete
      setShowCelebration(true);
      try {
        const streak = await calculateStreakFromLocal();
        setCurrentStreak(streak);
      } catch (error) {
        console.error('[Workout Tab] Error calculating streak:', error);
      }
    } else if (!workoutId && isCompleted) {
      // Recalculate streak when un-completing
      try {
        const streak = await calculateStreakFromLocal();
        setCurrentStreak(streak);
      } catch (error) {
        console.error('[Workout Tab] Error recalculating streak:', error);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[
        styles.headerContainer,
        { backgroundColor: colors.cardBackground, shadowColor: colors.shadow },
        ((isCompleted && workoutMode === 'split') || (individualWorkoutCompleted && workoutMode === 'individual')) && styles.headerContainerCompleted
      ]}>
        <Text style={[
          styles.title,
          { color: colors.text },
          ((isCompleted && workoutMode === 'split') || (individualWorkoutCompleted && workoutMode === 'individual')) && styles.titleCompleted
        ]}>Today's Workout</Text>
      </View>

      {/* Tab Toggle - My Split vs Individual */}
      <TabBar
        tabs={WORKOUT_TABS}
        activeTab={workoutMode}
        onTabPress={handleWorkoutModeChange}
        style={{ backgroundColor: colors.cardBackground }}
        completed={isCompleted || individualWorkoutCompleted}
        lockedTab={isCompleted ? 'split' : (individualWorkoutCompleted ? 'individual' : null)}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {workoutMode === 'split' ? (
          <View style={styles.contentContainer}>
            <SplitWorkoutCard
              todaysWorkout={todaysWorkout}
              activeSplit={activeSplit}
              isCompleted={isCompleted}
              isToggling={isToggling}
              hasExercises={todaysWorkout?.exercises?.length > 0}
              hasActiveWorkout={hasActiveWorkout}
              hasPosted={hasPosted}
              currentStreak={currentStreak}
              completedSessionId={completedSessionId}
              shouldCollapse={shouldCollapse}
              maxVisibleExercises={maxVisibleExercises}
              freeRestDayAvailable={freeRestDayAvailable}
              onToggleCompletion={handleToggleCompletionWrapper}
              onChangeDayPress={() => setShowChangeDayModal(true)}
              onEditWorkoutPress={openReorderModal}
              onFreeRestDayPress={() => {
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
              skipAutoResumeRef={skipAutoResumeRef}
            />
          </View>
        ) : (
          <IndividualWorkoutView
            individualWorkoutCompleted={individualWorkoutCompleted}
            completedIndividualWorkout={completedIndividualWorkout}
            savedWorkouts={savedWorkouts}
            selectedSavedWorkout={selectedSavedWorkout}
            onUncomplete={async () => {
              await markIndividualWorkoutCompleted(null);
            }}
            onEditWorkout={(workout) => router.push({
              pathname: '/workout/make-workout',
              params: { editWorkoutId: workout.id }
            })}
            onSelectWorkout={(workout) => setSelectedSavedWorkout(workout)}
            onBackFromWorkout={() => setSelectedSavedWorkout(null)}
            onMarkComplete={async (workout) => {
              // Create a workout session so the post has exercise data
              const workoutSessionId = await createCompletedWorkoutSession({
                workoutName: workout.name,
                exercises: workout.exercises || [],
                source: 'saved',
                savedWorkoutId: workout.id?.toString(),
              });
              const workoutData = {
                source: 'saved',
                workoutSessionId,
                workoutName: workout.name,
                exercises: workout.exercises?.map(ex => ({
                  name: ex.name,
                  completedSets: ex.sets || 0,
                  totalSets: ex.sets || 0,
                })) || [],
                completedAt: Date.now(),
              };
              await markIndividualWorkoutCompleted(workoutData);
              setSelectedSavedWorkout(null);
              setShowCelebration(true);
            }}
          />
        )}
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
                  onPress={() => handleDaySelectedWrapper(index)}
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

  // No-Split Freestyle Workout UI
  noSplitScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  freestyleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
  },
  freestyleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  freestyleContent: {
    flex: 1,
  },
  freestyleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  freestyleSubtitle: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  savedWorkoutsSection: {
    marginTop: 28,
  },
  savedWorkoutsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createSplitSection: {
    marginTop: 36,
    alignItems: 'center',
  },
  dividerWithText: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    marginBottom: 24,
    position: 'relative',
    alignItems: 'center',
  },
  dividerText: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.secondaryText,
    backgroundColor: Colors.light.background,
  },
  createSplitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.borderLight,
  },
  createSplitText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  createSplitHint: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginTop: 12,
    textAlign: 'center',
  },

  // No Split Card styles
  noSplitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  noSplitTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  noSplitSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  createSplitButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createSplitButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});