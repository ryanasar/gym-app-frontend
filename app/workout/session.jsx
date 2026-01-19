import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../hooks/useThemeColors';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSync } from '../contexts/SyncContext';
import { startWorkout, updateWorkoutSet, completeWorkout, cancelWorkout, getActiveWorkout, calculateStreakFromLocal, storage } from '../../storage';
import LiveActivity from '../modules/LiveActivity';

const WorkoutSessionScreen = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { markWorkoutCompleted } = useWorkout();
  const { updatePendingCount } = useSync();

  // Parse workout data from params
  const workoutData = params.workoutData ? JSON.parse(params.workoutData) : null;

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [workoutSessionId, setWorkoutSessionId] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [exerciseDatabase, setExerciseDatabase] = useState([]);

  // Add Exercise Modal state
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [addExerciseSearch, setAddExerciseSearch] = useState('');
  const [selectedNewExercise, setSelectedNewExercise] = useState(null);
  const [newExerciseSets, setNewExerciseSets] = useState('3');
  const [newExerciseReps, setNewExerciseReps] = useState('10');
  const [newExerciseWeight, setNewExerciseWeight] = useState('');

  // Swap Exercise Modal state
  const [showSwapExerciseModal, setShowSwapExerciseModal] = useState(false);
  const [swapExerciseSearch, setSwapExerciseSearch] = useState('');

  // Reorder Exercises Modal state
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Completion state - prevents interaction during finish animation
  const [isCompleting, setIsCompleting] = useState(false);

  // Rest Timer state
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [totalRestTime, setTotalRestTime] = useState(0);
  const [inputSectionHeight, setInputSectionHeight] = useState(null);
  const restTimerRef = useRef(null);
  const pendingNavigationRef = useRef(null);

  // Animation refs
  const slideXAnim = useRef(new Animated.Value(0)).current; // Horizontal for sets
  const slideYAnim = useRef(new Animated.Value(0)).current; // Vertical for exercises
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Live Activity ref to track if started
  const liveActivityStartedRef = useRef(false);

  // Input refs
  const weightInputRef = useRef(null);
  const repsInputRef = useRef(null);

  // Helper to update Live Activity with current exercise info
  const updateLiveActivity = useCallback((exercisesList, exIndex, sIndex, isStart = false) => {
    if (!exercisesList || exercisesList.length === 0) return;

    const exercise = exercisesList[exIndex];
    if (!exercise) return;

    const currentSetData = exercise.sessionSets?.[sIndex];
    const weight = parseInt(currentSetData?.weight) || 0;
    const reps = parseInt(currentSetData?.reps) || 0;
    const setInfo = `Set ${sIndex + 1} of ${exercise.totalSets}`;

    if (isStart && !liveActivityStartedRef.current) {
      LiveActivity.startWorkout(
        workoutData?.dayName || 'Workout',
        exercise.name,
        setInfo,
        weight,
        reps
      );
      liveActivityStartedRef.current = true;
    } else if (liveActivityStartedRef.current) {
      LiveActivity.updateExercise(exercise.name, setInfo, weight, reps);
    }
  }, [workoutData?.dayName]);

  // Load exercise database on mount
  useEffect(() => {
    const loadExerciseDatabase = async () => {
      try {
        const exercises = await storage.getExercises();
        setExerciseDatabase(exercises || []);
      } catch (error) {
        console.error('[Session] Error loading exercise database:', error);
      }
    };
    loadExerciseDatabase();
  }, []);

  // Check for existing workout session and restore if exists
  useEffect(() => {
    const checkForActiveWorkout = async () => {
      try {
        const activeWorkout = await getActiveWorkout();

        if (activeWorkout) {
          // Validate that the active workout has properly structured exercises with sets
          const hasInvalidExercises = activeWorkout.exercises.some(ex =>
            !ex.sets || !Array.isArray(ex.sets) || ex.sets.length === 0
          );

          if (hasInvalidExercises) {
            await cancelWorkout(activeWorkout.id);
            // Fall through to create new workout
          } else {
            // Restore the workout state from storage
            setWorkoutSessionId(activeWorkout.id);

            // Load exercise database to get exercise names
            const exercises = await storage.getExercises();
            const exerciseMap = {};
            exercises.forEach(ex => {
              exerciseMap[ex.id] = ex;
              // Also map by string version for flexibility
              exerciseMap[String(ex.id)] = ex;
            });

            // Convert storage format to UI format
            const restoredExercises = activeWorkout.exercises.map((exercise) => {
              const completed = exercise.sets.filter(s => s.completed).length;
              const exerciseData = exerciseMap[exercise.exerciseId] || exerciseMap[String(exercise.exerciseId)];

              return {
                name: exerciseData?.name || `Exercise ${exercise.exerciseId}`,
                id: exercise.exerciseId,
                completedSets: completed,
                totalSets: exercise.sets.length,
                restSeconds: exercise.restSeconds || 0,
                sessionSets: exercise.sets.map((set) => ({
                  setNumber: set.setIndex + 1,
                  weight: set.weight?.toString() || '0',
                  reps: set.reps?.toString() || '0',
                  completed: set.completed
                }))
              };
            });

            setExercises(restoredExercises);

            // Find current position (first incomplete set)
            let foundCurrent = false;
            let restoredExIndex = 0;
            let restoredSetIndex = 0;
            for (let i = 0; i < restoredExercises.length; i++) {
              const ex = restoredExercises[i];
              const firstIncompleteSet = ex.sessionSets.findIndex(s => !s.completed);
              if (firstIncompleteSet !== -1) {
                setCurrentExerciseIndex(i);
                setCurrentSetIndex(firstIncompleteSet);
                restoredExIndex = i;
                restoredSetIndex = firstIncompleteSet;
                foundCurrent = true;
                break;
              }
            }

            if (!foundCurrent) {
              // All sets complete, set to last
              restoredExIndex = restoredExercises.length - 1;
              restoredSetIndex = restoredExercises[restoredExercises.length - 1].sessionSets.length - 1;
              setCurrentExerciseIndex(restoredExIndex);
              setCurrentSetIndex(restoredSetIndex);
            }

            // Start Live Activity for restored workout
            updateLiveActivity(restoredExercises, restoredExIndex, restoredSetIndex, true);

            return;
          }
        }

        // No active workout, start new one
        if (workoutData && workoutData.exercises) {
          const splitId = workoutData.splitId || 'unknown';
          const dayIndex = (workoutData.dayNumber || 1) - 1;

          const newWorkout = await startWorkout(splitId, dayIndex);
          setWorkoutSessionId(newWorkout.id);

          // Load exercise database to get exercise names
          const exercises = await storage.getExercises();
          const exerciseMap = {};
          exercises.forEach(ex => {
            exerciseMap[ex.id] = ex;
            exerciseMap[String(ex.id)] = ex;
          });

          // Use exercises from the workout storage (not from workoutData)
          // This ensures we use the correct exerciseIds that match the storage
          const initializedExercises = newWorkout.exercises.map((exercise) => {
            const exerciseData = exerciseMap[exercise.exerciseId] || exerciseMap[String(exercise.exerciseId)];
            // Get restSeconds from workoutData if available
            const workoutExercise = workoutData.exercises?.find(
              ex => ex.id === exercise.exerciseId || String(ex.id) === String(exercise.exerciseId)
            );

            return {
              name: exerciseData?.name || `Exercise ${exercise.exerciseId}`,
              id: exercise.exerciseId,
              completedSets: 0,
              totalSets: exercise.sets.length,
              restSeconds: workoutExercise?.restSeconds || exercise.restSeconds || 0,
              sessionSets: exercise.sets.map((set) => ({
                setNumber: set.setIndex + 1,
                weight: set.weight?.toString() || '0',
                reps: set.reps?.toString() || '0',
                completed: false
              }))
            };
          });

          setExercises(initializedExercises);

          // Start Live Activity for new workout
          updateLiveActivity(initializedExercises, 0, 0, true);
        }
      } catch (error) {
        console.error('[Session] Error checking for active workout:', error);
      }
    };

    checkForActiveWorkout();
  }, [updateLiveActivity]);

  // Rest timer countdown effect
  useEffect(() => {
    if (showRestTimer && restTimeRemaining > 0) {
      // Update Live Activity with rest time at start
      if (restTimeRemaining === totalRestTime) {
        LiveActivity.startRest(restTimeRemaining);
      }

      restTimerRef.current = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current);
            setShowRestTimer(false);
            // End rest on Live Activity
            LiveActivity.endRest();
            // Execute pending navigation
            if (pendingNavigationRef.current) {
              pendingNavigationRef.current();
              pendingNavigationRef.current = null;
            }
            return 0;
          }
          // Update Live Activity with remaining rest time
          LiveActivity.updateRest(prev - 1);
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (restTimerRef.current) {
          clearInterval(restTimerRef.current);
        }
      };
    }
  }, [showRestTimer, restTimeRemaining, totalRestTime]);

  // Cleanup timer and Live Activity on unmount
  useEffect(() => {
    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
      // Note: We don't stop the Live Activity here by default
      // because the user might be switching apps temporarily.
      // The Live Activity will be stopped explicitly when the
      // workout is completed, discarded, or saved.
    };
  }, []);

  // Helper to format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Skip rest timer and proceed immediately
  const skipRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    setShowRestTimer(false);
    setRestTimeRemaining(0);
    // End rest on Live Activity
    LiveActivity.endRest();
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  };

  // useCallback must be before any early returns to follow Rules of Hooks
  const handleReorderExercises = useCallback(async ({ data }) => {
    // Update UI state
    setExercises(data);

    // Find the new index of the current exercise
    const currentExerciseId = exercises[currentExerciseIndex]?.id;
    const newIndex = data.findIndex(ex => ex.id === currentExerciseId);
    if (newIndex !== -1 && newIndex !== currentExerciseIndex) {
      setCurrentExerciseIndex(newIndex);
    }

    // Update storage
    try {
      const activeWorkout = await storage.getActiveWorkout();
      if (activeWorkout && activeWorkout.id === workoutSessionId) {
        // Reorder exercises in storage to match the new order
        const reorderedStorageExercises = data.map(uiExercise => {
          return activeWorkout.exercises.find(
            storageEx => storageEx.exerciseId === uiExercise.id || String(storageEx.exerciseId) === String(uiExercise.id)
          );
        }).filter(Boolean);

        activeWorkout.exercises = reorderedStorageExercises;
        await storage.saveActiveWorkout(activeWorkout);
      }
    } catch (error) {
      console.error('[Session] Error reordering exercises in storage:', error);
    }
  }, [exercises, currentExerciseIndex, workoutSessionId]);

  if (!workoutData || !exercises.length) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load workout data</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const currentSet = currentExercise?.sessionSets[currentSetIndex];
  const nextExercise = exercises[currentExerciseIndex + 1];

  const isLastSet = currentSetIndex === currentExercise.totalSets - 1;
  const isLastExercise = currentExerciseIndex === exercises.length - 1;

  const updateSetData = (field, value) => {
    setExercises(prev => {
      const updated = [...prev];
      updated[currentExerciseIndex].sessionSets[currentSetIndex][field] = value;
      return updated;
    });
  };

  const saveSetToStorage = async (exerciseIndex, setIndex, setData) => {
    if (!workoutSessionId) return;

    try {
      const exercise = exercises[exerciseIndex];
      // Use numeric exerciseId to match the workout storage format
      const exerciseId = parseInt(exercise.id) || exercise.id || exercise.name;
      await updateWorkoutSet(
        workoutSessionId,
        exerciseId,
        setIndex,
        {
          reps: parseInt(setData.reps) || 0,
          weight: parseFloat(setData.weight) || 0,
          completed: setData.completed
        }
      );
    } catch (error) {
      console.error('[Session] Error saving set to storage:', error);
    }
  };

  const handleAddSet = async () => {
    setShowOptionsMenu(false);

    // Add a new set to the current exercise in the UI
    setExercises(prev => {
      const updated = [...prev];
      const newSetNumber = updated[currentExerciseIndex].sessionSets.length + 1;
      const lastSet = updated[currentExerciseIndex].sessionSets[updated[currentExerciseIndex].sessionSets.length - 1];

      // Create new set with same weight/reps as last set
      updated[currentExerciseIndex].sessionSets.push({
        setNumber: newSetNumber,
        weight: lastSet?.weight || '0',
        reps: lastSet?.reps || '0',
        completed: false
      });

      updated[currentExerciseIndex].totalSets += 1;

      return updated;
    });

    // Also add the set to storage
    try {
      const activeWorkout = await storage.getActiveWorkout();
      if (activeWorkout && activeWorkout.id === workoutSessionId) {
        const exercise = activeWorkout.exercises[currentExerciseIndex];
        const newSetIndex = exercise.sets.length;
        const lastSet = exercise.sets[exercise.sets.length - 1];

        // Add new set to storage
        exercise.sets.push({
          setIndex: newSetIndex,
          reps: lastSet?.reps || 0,
          weight: lastSet?.weight || 0,
          completed: false
        });

        await storage.saveActiveWorkout(activeWorkout);
      }
    } catch (error) {
      console.error('[Session] Error adding set to storage:', error);
    }
  };

  const handleDeleteSet = async () => {
    setShowOptionsMenu(false);

    // Can't delete if only one set remains
    if (currentExercise.totalSets <= 1) {
      Alert.alert('Cannot Delete', 'Each exercise must have at least one set.');
      return;
    }

    // Remove the current set from UI
    setExercises(prev => {
      const updated = [...prev];
      const exercise = updated[currentExerciseIndex];

      // Remove the set at current index
      exercise.sessionSets.splice(currentSetIndex, 1);
      exercise.totalSets -= 1;

      // Renumber remaining sets
      exercise.sessionSets.forEach((set, idx) => {
        set.setNumber = idx + 1;
      });

      // Recalculate completed sets
      exercise.completedSets = exercise.sessionSets.filter(s => s.completed).length;

      return updated;
    });

    // Update storage
    try {
      const activeWorkout = await storage.getActiveWorkout();
      if (activeWorkout && activeWorkout.id === workoutSessionId) {
        const exercise = activeWorkout.exercises[currentExerciseIndex];

        // Remove the set at current index
        exercise.sets.splice(currentSetIndex, 1);

        // Renumber remaining sets
        exercise.sets.forEach((set, idx) => {
          set.setIndex = idx;
        });

        await storage.saveActiveWorkout(activeWorkout);
      }
    } catch (error) {
      console.error('[Session] Error deleting set from storage:', error);
    }

    // Adjust current set index if needed
    if (currentSetIndex >= currentExercise.totalSets - 1) {
      setCurrentSetIndex(Math.max(0, currentSetIndex - 1));
    }
  };

  const handleDeleteExercise = async () => {
    setShowOptionsMenu(false);

    // Can't delete if only one exercise remains
    if (exercises.length <= 1) {
      Alert.alert('Cannot Delete', 'Your workout must have at least one exercise.');
      return;
    }

    Alert.alert(
      'Delete Exercise',
      `Are you sure you want to remove "${currentExercise.name}" from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Remove from UI
            setExercises(prev => {
              const updated = [...prev];
              updated.splice(currentExerciseIndex, 1);
              return updated;
            });

            // Update storage
            try {
              const activeWorkout = await storage.getActiveWorkout();
              if (activeWorkout && activeWorkout.id === workoutSessionId) {
                activeWorkout.exercises.splice(currentExerciseIndex, 1);
                await storage.saveActiveWorkout(activeWorkout);
              }
            } catch (error) {
              console.error('[Session] Error deleting exercise from storage:', error);
            }

            // Adjust current exercise index if needed
            if (currentExerciseIndex >= exercises.length - 1) {
              setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1));
            }
            setCurrentSetIndex(0);
          }
        }
      ]
    );
  };

  const openAddExerciseModal = () => {
    setShowOptionsMenu(false);
    setAddExerciseSearch('');
    setSelectedNewExercise(null);
    setNewExerciseSets('3');
    setNewExerciseReps('10');
    setNewExerciseWeight('');
    setShowAddExerciseModal(true);
  };

  const handleAddExercise = async () => {
    if (!selectedNewExercise) {
      Alert.alert('Select Exercise', 'Please select an exercise to add.');
      return;
    }

    const sets = parseInt(newExerciseSets) || 3;
    const reps = parseInt(newExerciseReps) || 10;
    const weight = newExerciseWeight ? parseFloat(newExerciseWeight) : 0;

    // Create new exercise for UI
    const newExercise = {
      name: selectedNewExercise.name,
      id: selectedNewExercise.id,
      completedSets: 0,
      totalSets: sets,
      sessionSets: Array.from({ length: sets }, (_, idx) => ({
        setNumber: idx + 1,
        weight: weight.toString(),
        reps: reps.toString(),
        completed: false
      }))
    };

    // Add to UI after current exercise
    setExercises(prev => {
      const updated = [...prev];
      updated.splice(currentExerciseIndex + 1, 0, newExercise);
      return updated;
    });

    // Update storage
    try {
      const activeWorkout = await storage.getActiveWorkout();
      if (activeWorkout && activeWorkout.id === workoutSessionId) {
        const storageExercise = {
          exerciseId: selectedNewExercise.id,
          sets: Array.from({ length: sets }, (_, idx) => ({
            setIndex: idx,
            reps: reps,
            weight: weight,
            completed: false
          }))
        };

        activeWorkout.exercises.splice(currentExerciseIndex + 1, 0, storageExercise);
        await storage.saveActiveWorkout(activeWorkout);
      }
    } catch (error) {
      console.error('[Session] Error adding exercise to storage:', error);
    }

    setShowAddExerciseModal(false);
  };

  const openSwapExerciseModal = () => {
    setShowOptionsMenu(false);
    setSwapExerciseSearch('');
    setShowSwapExerciseModal(true);
  };

  const handleSwapExercise = async (newExercise) => {
    // Close modal first to prevent any race conditions
    setShowSwapExerciseModal(false);

    // Swap exercise in UI - explicitly preserve all set data
    setExercises(prev => {
      const updated = [...prev];
      const currentEx = updated[currentExerciseIndex];

      // Deep clone the sessionSets to preserve completed state
      const preservedSets = currentEx.sessionSets.map(set => ({ ...set }));

      updated[currentExerciseIndex] = {
        name: newExercise.name,
        id: newExercise.id,
        completedSets: currentEx.completedSets,
        totalSets: currentEx.totalSets,
        sessionSets: preservedSets
      };
      return updated;
    });

    // Update storage - only change the exerciseId, preserve all sets
    try {
      const activeWorkout = await storage.getActiveWorkout();
      if (activeWorkout && activeWorkout.id === workoutSessionId) {
        activeWorkout.exercises[currentExerciseIndex].exerciseId = newExercise.id;
        await storage.saveActiveWorkout(activeWorkout);
      }
    } catch (error) {
      console.error('[Session] Error swapping exercise in storage:', error);
    }
  };

  const openReorderModal = () => {
    setShowOptionsMenu(false);
    setShowReorderModal(true);
  };

  // Filter exercises for search
  const filteredExercisesForAdd = exerciseDatabase.filter(ex =>
    ex.name.toLowerCase().includes(addExerciseSearch.toLowerCase()) &&
    !exercises.some(e => e.id === ex.id)
  );

  const filteredExercisesForSwap = exerciseDatabase.filter(ex =>
    ex.name.toLowerCase().includes(swapExerciseSearch.toLowerCase()) &&
    ex.id !== currentExercise?.id
  );

  const completeCurrentSet = async () => {
    // Mark set as complete
    const updatedSetData = {
      ...currentSet,
      completed: true
    };

    setExercises(prev => {
      const updated = [...prev];
      updated[currentExerciseIndex].sessionSets[currentSetIndex].completed = true;
      updated[currentExerciseIndex].completedSets += 1;
      return updated;
    });

    // Save to storage immediately
    await saveSetToStorage(currentExerciseIndex, currentSetIndex, updatedSetData);

    // Determine what to do next
    const proceedToNext = () => {
      if (isLastSet) {
        if (isLastExercise) {
          handleWorkoutComplete();
        } else {
          animateToNextExercise();
        }
      } else {
        animateToNextSet();
      }
    };

    // Check if rest timer is configured and we're not on the last set
    const restSeconds = parseInt(currentExercise.restSeconds) || 0;
    if (restSeconds > 0 && !isLastSet) {
      // Show rest timer before proceeding
      pendingNavigationRef.current = proceedToNext;
      setTotalRestTime(restSeconds);
      setRestTimeRemaining(restSeconds);
      setShowRestTimer(true);
    } else {
      // No rest timer or last set, proceed immediately
      proceedToNext();
    }
  };

  const animateToNextSet = () => {
    // Start horizontal slide animation (to the left)
    Animated.parallel([
      Animated.timing(slideXAnim, {
        toValue: -50,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      const nextSetIndex = currentSetIndex + 1;

      // Copy weight/reps from previous set if next set values aren't set
      setExercises(prev => {
        const updated = [...prev];
        const exercise = updated[currentExerciseIndex];
        const prevSet = exercise.sessionSets[currentSetIndex];
        const nextSet = exercise.sessionSets[nextSetIndex];

        if (nextSet) {
          // Copy weight if not set
          if (!nextSet.weight || nextSet.weight === '0' || nextSet.weight === '') {
            nextSet.weight = prevSet.weight;
          }
          // Copy reps if not set
          if (!nextSet.reps || nextSet.reps === '0' || nextSet.reps === '') {
            nextSet.reps = prevSet.reps;
          }
        }

        // Update Live Activity with next set info
        updateLiveActivity(updated, currentExerciseIndex, nextSetIndex);

        return updated;
      });

      // Update state after animation
      setCurrentSetIndex(prev => prev + 1);

      // Reset animation values and animate in from right
      slideXAnim.setValue(50);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(slideXAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const animateToNextExercise = () => {
    // Start vertical slide animation (down)
    Animated.parallel([
      Animated.timing(slideYAnim, {
        toValue: -100,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Update state after animation
      if (isLastExercise) {
        handleWorkoutComplete();
      } else {
        const nextExerciseIndex = currentExerciseIndex + 1;
        setCurrentExerciseIndex(nextExerciseIndex);
        setCurrentSetIndex(0);

        // Update Live Activity with next exercise info
        updateLiveActivity(exercises, nextExerciseIndex, 0);

        // Reset animation values and animate in from top
        slideYAnim.setValue(100);
        fadeAnim.setValue(0);

        Animated.parallel([
          Animated.timing(slideYAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      }
    });
  };

  const goToNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      animateToNextExercise();
    }
  };

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      // Animate to previous exercise (vertical - up)
      Animated.parallel([
        Animated.timing(slideYAnim, {
          toValue: 100,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Update state after animation
        setCurrentExerciseIndex(prev => prev - 1);
        setCurrentSetIndex(0); // Always start at first set

        // Reset animation values and animate in from bottom
        slideYAnim.setValue(-100);
        fadeAnim.setValue(0);

        Animated.parallel([
          Animated.timing(slideYAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      });
    }
  };

  const goBackOneStep = async () => {
    if (currentSetIndex > 0) {
      // Go back to previous set with horizontal animation (to the right)
      const previousSetIndex = currentSetIndex - 1;

      // Start horizontal slide animation (to the right)
      Animated.parallel([
        Animated.timing(slideXAnim, {
          toValue: 50,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(async () => {
        // Update state after animation
        setExercises(prev => {
          const updated = [...prev];
          updated[currentExerciseIndex].sessionSets[previousSetIndex].completed = false;
          updated[currentExerciseIndex].completedSets = Math.max(0, updated[currentExerciseIndex].completedSets - 1);
          return updated;
        });

        // Save to storage immediately
        const exercise = exercises[currentExerciseIndex];
        const exerciseId = parseInt(exercise.id) || exercise.id || exercise.name;
        await updateWorkoutSet(
          workoutSessionId,
          exerciseId,
          previousSetIndex,
          {
            reps: parseInt(exercise.sessionSets[previousSetIndex].reps) || 0,
            weight: parseFloat(exercise.sessionSets[previousSetIndex].weight) || 0,
            completed: false
          }
        );

        setCurrentSetIndex(previousSetIndex);

        // Reset animation values and animate in from left
        slideXAnim.setValue(-50);
        fadeAnim.setValue(0);

        Animated.parallel([
          Animated.timing(slideXAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();
      });
    } else if (currentExerciseIndex > 0) {
      // Go to previous exercise, last completed set (vertical animation - up)
      const prevExerciseIndex = currentExerciseIndex - 1;
      const prevExercise = exercises[prevExerciseIndex];

      // Find the last completed set, or default to first set (index 0) if no sets completed
      let targetSetIndex = 0;
      for (let i = prevExercise.sessionSets.length - 1; i >= 0; i--) {
        if (prevExercise.sessionSets[i].completed) {
          targetSetIndex = i;
          break;
        }
      }

      // Animate to previous exercise
      Animated.parallel([
        Animated.timing(slideYAnim, {
          toValue: 100,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Update state after animation
        setCurrentExerciseIndex(prevExerciseIndex);
        setCurrentSetIndex(targetSetIndex);

        // Mark the target set as incomplete (only if it was completed)
        if (prevExercise.sessionSets[targetSetIndex].completed) {
          setExercises(prev => {
            const updated = [...prev];
            updated[prevExerciseIndex].sessionSets[targetSetIndex].completed = false;
            updated[prevExerciseIndex].completedSets = Math.max(0, updated[prevExerciseIndex].completedSets - 1);
            return updated;
          });

          // Save to storage immediately
          const prevExerciseId = parseInt(prevExercise.id) || prevExercise.id || prevExercise.name;
          updateWorkoutSet(
            workoutSessionId,
            prevExerciseId,
            targetSetIndex,
            {
              reps: parseInt(prevExercise.sessionSets[targetSetIndex].reps) || 0,
              weight: parseFloat(prevExercise.sessionSets[targetSetIndex].weight) || 0,
              completed: false
            }
          );
        }

        // Reset animation values and animate in from bottom
        slideYAnim.setValue(-100);
        fadeAnim.setValue(0);

        Animated.parallel([
          Animated.timing(slideYAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      });
    }
  };

  const handleWorkoutComplete = async () => {
    // Prevent multiple presses during completion
    if (isCompleting) return;
    setIsCompleting(true);

    // Stop Live Activity
    LiveActivity.stopWorkout();
    liveActivityStartedRef.current = false;

    // Mark workout as complete in storage (moves to pending sync)
    if (workoutSessionId) {
      try {
        await completeWorkout(workoutSessionId);

        // Trigger progress update in context
        markWorkoutCompleted(workoutSessionId);

        // Update pending count for sync
        await updatePendingCount();
      } catch (error) {
        console.error('[Session] Error completing workout in storage:', error);
      }
    }

    // Navigate back to workout tab - animation will play there
    router.replace({
      pathname: '/(tabs)/workout',
      params: { completed: 'true', sessionId: workoutSessionId }
    });
  };

  const exitWorkout = () => {
    Alert.alert(
      'Exit Workout?',
      'Your progress has been saved. You can resume this workout later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save & Exit',
          onPress: () => {
            // Keep Live Activity running so user can resume later
            // (or stop it if you prefer to end it on pause)
            LiveActivity.stopWorkout();
            liveActivityStartedRef.current = false;
            router.replace({
              pathname: '/(tabs)/workout',
              params: { paused: 'true' }
            });
          }
        },
        {
          text: 'Discard Workout',
          style: 'destructive',
          onPress: async () => {
            // Stop Live Activity
            LiveActivity.stopWorkout();
            liveActivityStartedRef.current = false;

            if (workoutSessionId) {
              try {
                await cancelWorkout(workoutSessionId);
              } catch (error) {
                console.error('[Session] Error cancelling workout:', error);
              }
            }
            // Navigate back to workout tab with discarded flag
            router.replace({
              pathname: '/(tabs)/workout',
              params: { discarded: 'true' }
            });
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} pointerEvents={isCompleting ? 'none' : 'auto'}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity onPress={exitWorkout} style={styles.headerLeft} disabled={isCompleting}>
          <Text style={[styles.exitButton, { color: colors.error }, isCompleting && styles.disabledText]}>Exit</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{workoutData.dayName}</Text>
        <TouchableOpacity onPress={handleWorkoutComplete} style={styles.headerRight} disabled={isCompleting}>
          <Text style={[styles.completeButton, isCompleting && styles.disabledText]}>
            {isCompleting ? 'Finishing...' : 'Finish'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>Workout Progress</Text>
          <Text style={[styles.progressCounter, { color: colors.primary }]}>
            {currentExerciseIndex + 1}/{exercises.length}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.borderLight + '60' }]}>
            <View style={[
              styles.progressFill,
              { width: `${((currentExerciseIndex + (currentSetIndex + 1) / currentExercise.totalSets) / exercises.length) * 100}%`, backgroundColor: colors.primary, shadowColor: colors.primary }
            ]} />
          </View>
        </View>
        <Text style={[styles.progressText, { color: colors.secondaryText }]}>
          Exercise {currentExerciseIndex + 1} of {exercises.length} • Set {currentSetIndex + 1} of {currentExercise.totalSets}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Exercise */}
        <Animated.View
          style={[
            styles.currentExerciseCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.primary + '30', shadowColor: colors.shadow },
            {
              transform: [
                { translateX: slideXAnim },
                { translateY: slideYAnim }
              ],
              opacity: fadeAnim,
            }
          ]}
        >
          <View style={styles.exerciseHeader}>
            {/* Back Arrow - only show if not on first set of first exercise */}
            {(currentSetIndex > 0 || currentExerciseIndex > 0) && (
              <TouchableOpacity
                style={styles.backArrowButton}
                onPress={goBackOneStep}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={colors.text} />
              </TouchableOpacity>
            )}

            <View style={styles.exerciseTitleContainer}>
              <Text style={[styles.exerciseTitle, { color: colors.text }]}>{currentExercise.name}</Text>
              <View style={[styles.setBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <Text style={[styles.setBadgeText, { color: colors.primary }]}>
                  Set {currentSetIndex + 1}/{currentExercise.totalSets}
                </Text>
              </View>
            </View>

            {/* Options Menu Button */}
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => setShowOptionsMenu(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Set Input Fields or Rest Timer */}
          <View
            style={[styles.inputSection, inputSectionHeight && { minHeight: inputSectionHeight }]}
            onLayout={(event) => {
              if (!inputSectionHeight && !showRestTimer) {
                setInputSectionHeight(event.nativeEvent.layout.height);
              }
            }}
          >
            {showRestTimer ? (
              <View style={styles.inlineRestTimerContainer}>
                <View style={styles.circularProgressContainer}>
                  <Svg width={80} height={80} style={styles.circularProgressSvg}>
                    {/* Background circle */}
                    <Circle
                      cx={40}
                      cy={40}
                      r={36}
                      stroke={colors.border}
                      strokeWidth={4}
                      fill="transparent"
                    />
                    {/* Progress circle */}
                    <Circle
                      cx={40}
                      cy={40}
                      r={36}
                      stroke={colors.primary}
                      strokeWidth={4}
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 36}
                      strokeDashoffset={2 * Math.PI * 36 * (1 - restTimeRemaining / totalRestTime)}
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                    />
                  </Svg>
                  <View style={styles.timerTextContainer}>
                    <Text style={[styles.timerText, { color: colors.text }]}>{formatTime(restTimeRemaining)}</Text>
                    <Text style={[styles.timerLabel, { color: colors.secondaryText }]}>Rest</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.setInputs}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>WEIGHT (LBS)</Text>
                  <View style={[styles.inputWrapper, { shadowColor: colors.shadow }]}>
                    <TextInput
                      ref={weightInputRef}
                      style={[
                        styles.input,
                        { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, color: colors.text },
                        (!currentSet?.weight || currentSet?.weight === '0') && { color: colors.secondaryText + '60', borderColor: colors.borderLight + '60' }
                      ]}
                      placeholder={currentExercise.weight || "0"}
                      value={currentSet?.weight !== undefined ? currentSet.weight : '0'}
                      onChangeText={(value) => updateSetData('weight', value)}
                      onFocus={() => {
                        if (currentSet?.weight === '0') {
                          updateSetData('weight', '');
                        }
                      }}
                      onBlur={() => {
                        if (!currentSet?.weight || currentSet?.weight === '') {
                          updateSetData('weight', '0');
                        }
                      }}
                      keyboardType="numeric"
                      placeholderTextColor={colors.secondaryText + '80'}
                      selectionColor={colors.primary}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>REPS</Text>
                  <View style={[styles.inputWrapper, { shadowColor: colors.shadow }]}>
                    <TextInput
                      ref={repsInputRef}
                      style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, color: colors.text }]}
                      placeholder={currentExercise.reps || "0"}
                      value={currentSet?.reps !== undefined ? currentSet.reps : '0'}
                      onChangeText={(value) => updateSetData('reps', value)}
                      onFocus={() => {
                        if (currentSet?.reps === '0') {
                          updateSetData('reps', '');
                        }
                      }}
                      onBlur={() => {
                        if (!currentSet?.reps || currentSet?.reps === '') {
                          updateSetData('reps', '0');
                        }
                      }}
                      keyboardType="numeric"
                      placeholderTextColor={colors.secondaryText + '80'}
                      selectionColor={colors.primary}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Set Completion Button or Skip Button */}
          <View style={styles.primaryActionContainer}>
            <TouchableOpacity
              style={[
                styles.completeSetButton,
                { backgroundColor: colors.primary, shadowColor: colors.primary },
                isLastSet && isLastExercise && !showRestTimer && styles.finishWorkoutButton,
                showRestTimer && [styles.skipRestButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]
              ]}
              onPress={showRestTimer ? skipRestTimer : completeCurrentSet}
              activeOpacity={0.8}
            >
              <Text style={[styles.completeSetText, { color: colors.onPrimary }, showRestTimer && { color: colors.secondaryText }]}>
                {showRestTimer
                  ? 'Skip Rest'
                  : (isLastSet && isLastExercise ? '🎉 Finish Workout' : '✓ Complete Set')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Set History for Current Exercise */}
        {currentExercise.completedSets > 0 && (
          <View style={[
            styles.setHistoryCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
            !nextExercise && styles.setHistoryCardLast
          ]}>
            <Text style={[styles.setHistoryTitle, { color: colors.text }]}>Completed Sets</Text>
            {currentExercise.sessionSets
              .filter(set => set.completed)
              .map((set, index) => {
                const hasWeight = set.weight && set.weight !== '' && set.weight !== '0';
                const hasReps = set.reps && set.reps !== '' && set.reps !== '0';

                let details = '';
                if (hasWeight && hasReps) {
                  details = `${set.weight} lbs × ${set.reps} reps`;
                } else if (hasWeight) {
                  details = `${set.weight} lbs`;
                } else if (hasReps) {
                  details = `${set.reps} reps`;
                } else {
                  details = 'Completed';
                }

                return (
                  <View key={index} style={[styles.completedSet, { borderBottomColor: colors.borderLight + '40' }]}>
                    <Text style={[styles.completedSetText, { color: colors.secondaryText }]}>
                      Set {set.setNumber}: {details}
                    </Text>
                  </View>
                );
              })}
          </View>
        )}

        {/* Next Exercise Preview */}
        {nextExercise && (
          <TouchableOpacity
            style={[styles.nextExerciseCard, { backgroundColor: colors.borderLight + '25', borderColor: colors.borderLight + '60', shadowColor: colors.shadow }]}
            onPress={goToNextExercise}
            activeOpacity={0.7}
          >
            <View style={styles.nextExerciseHeader}>
              <Text style={[styles.nextExerciseTitle, { color: colors.secondaryText }]}>Up Next</Text>
              <View style={[styles.nextExerciseIcon, { backgroundColor: colors.borderLight + '80' }]}>
                <Text style={[styles.nextExerciseIconText, { color: colors.secondaryText }]}>→</Text>
              </View>
            </View>
            <Text style={[styles.nextExerciseName, { color: colors.text }]}>{nextExercise.name}</Text>
            <Text style={[styles.nextExerciseDetails, { color: colors.secondaryText }]}>
              {nextExercise.totalSets || nextExercise.sets} sets{nextExercise.reps ? ` × ${nextExercise.reps} reps` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleAddSet}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                <Text style={[styles.modalOptionText, { color: colors.text }]}>Add Set</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleDeleteSet}
                activeOpacity={0.7}
              >
                <Ionicons name="remove-circle-outline" size={24} color={colors.error} />
                <Text style={[styles.modalOptionText, { color: colors.error }]}>Delete Current Set</Text>
              </TouchableOpacity>

              <View style={[styles.modalDivider, { backgroundColor: colors.borderLight }]} />

              <TouchableOpacity
                style={styles.modalOption}
                onPress={openAddExerciseModal}
                activeOpacity={0.7}
              >
                <Ionicons name="fitness-outline" size={24} color={colors.primary} />
                <Text style={[styles.modalOptionText, { color: colors.text }]}>Add Exercise</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={openSwapExerciseModal}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal-outline" size={24} color={colors.primary} />
                <Text style={[styles.modalOptionText, { color: colors.text }]}>Swap Exercise</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={openReorderModal}
                activeOpacity={0.7}
              >
                <Ionicons name="reorder-four-outline" size={24} color={colors.primary} />
                <Text style={[styles.modalOptionText, { color: colors.text }]}>Reorder Exercises</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleDeleteExercise}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={24} color={colors.error} />
                <Text style={[styles.modalOptionText, { color: colors.error }]}>Delete Exercise</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddExerciseModal(false)}
      >
        <KeyboardAvoidingView
          style={[styles.fullScreenModal, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.fullScreenModalHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={() => setShowAddExerciseModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.secondaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.fullScreenModalTitle, { color: colors.text }]}>Add Exercise</Text>
            <TouchableOpacity onPress={handleAddExercise}>
              <Text style={[styles.modalSaveText, { color: colors.primary }, !selectedNewExercise && styles.modalSaveTextDisabled]}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={20} color={colors.secondaryText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
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

          {selectedNewExercise && (
            <View style={[styles.selectedExerciseConfig, { backgroundColor: colors.cardBackground, borderColor: colors.primary + '40' }]}>
              <View style={styles.selectedExerciseBadge}>
                <Text style={[styles.selectedExerciseName, { color: colors.text }]}>{selectedNewExercise.name}</Text>
                <TouchableOpacity onPress={() => setSelectedNewExercise(null)}>
                  <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>

              <View style={styles.exerciseConfigRow}>
                <View style={styles.configInputGroup}>
                  <Text style={[styles.configLabel, { color: colors.secondaryText }]}>Sets</Text>
                  <TextInput
                    style={[styles.configInput, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={newExerciseSets}
                    onChangeText={setNewExerciseSets}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor={colors.secondaryText}
                  />
                </View>
                <View style={styles.configInputGroup}>
                  <Text style={[styles.configLabel, { color: colors.secondaryText }]}>Reps</Text>
                  <TextInput
                    style={[styles.configInput, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={newExerciseReps}
                    onChangeText={setNewExerciseReps}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={colors.secondaryText}
                  />
                </View>
                <View style={styles.configInputGroup}>
                  <Text style={[styles.configLabel, { color: colors.secondaryText }]}>Weight (opt)</Text>
                  <TextInput
                    style={[styles.configInput, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
                    value={newExerciseWeight}
                    onChangeText={setNewExerciseWeight}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.secondaryText}
                  />
                </View>
              </View>
            </View>
          )}

          <ScrollView style={styles.exerciseList}>
            {filteredExercisesForAdd.map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseListItem,
                  { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
                  selectedNewExercise?.id === exercise.id && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '08' }
                ]}
                onPress={() => setSelectedNewExercise(exercise)}
              >
                <Text style={[styles.exerciseListItemName, { color: colors.text }]}>{exercise.name}</Text>
                {exercise.primaryMuscles && (
                  <Text style={[styles.exerciseListItemMuscles, { color: colors.secondaryText }]}>
                    {exercise.primaryMuscles.join(', ')}
                  </Text>
                )}
                {selectedNewExercise?.id === exercise.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            {filteredExercisesForAdd.length === 0 && (
              <Text style={[styles.noExercisesText, { color: colors.secondaryText }]}>No exercises found</Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Swap Exercise Modal */}
      <Modal
        visible={showSwapExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSwapExerciseModal(false)}
      >
        <View style={[styles.fullScreenModal, { backgroundColor: colors.background }]}>
          <View style={[styles.fullScreenModalHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={() => setShowSwapExerciseModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.secondaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.fullScreenModalTitle, { color: colors.text }]}>Swap Exercise</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={[styles.swapCurrentExercise, { backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.swapCurrentLabel, { color: colors.secondaryText }]}>Current:</Text>
            <Text style={[styles.swapCurrentName, { color: colors.primary }]}>{currentExercise?.name}</Text>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <Ionicons name="search" size={20} color={colors.secondaryText} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search exercises..."
              placeholderTextColor={colors.secondaryText}
              value={swapExerciseSearch}
              onChangeText={setSwapExerciseSearch}
              autoCapitalize="none"
            />
            {swapExerciseSearch.length > 0 && (
              <TouchableOpacity onPress={() => setSwapExerciseSearch('')}>
                <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.exerciseList}>
            {filteredExercisesForSwap.map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                style={[styles.exerciseListItem, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
                onPress={() => handleSwapExercise(exercise)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exerciseListItemName, { color: colors.text }]}>{exercise.name}</Text>
                  {exercise.primaryMuscles && (
                    <Text style={[styles.exerciseListItemMuscles, { color: colors.secondaryText }]}>
                      {exercise.primaryMuscles.join(', ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
            {filteredExercisesForSwap.length === 0 && (
              <Text style={[styles.noExercisesText, { color: colors.secondaryText }]}>No exercises found</Text>
            )}
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
          <View style={[styles.fullScreenModalHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={() => setShowReorderModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.secondaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.fullScreenModalTitle, { color: colors.text }]}>Reorder Exercises</Text>
            <TouchableOpacity onPress={() => setShowReorderModal(false)}>
              <Text style={[styles.modalSaveText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.reorderHint, { color: colors.secondaryText }]}>Press the dots and drag to reorder</Text>

          <DraggableFlatList
            data={exercises}
            keyExtractor={(item, index) => `reorder-${item.id}-${index}`}
            onDragEnd={handleReorderExercises}
            contentContainerStyle={styles.reorderListContent}
            activationDistance={0}
            renderItem={({ item, drag, isActive, getIndex }) => {
              const index = getIndex();
              const isCurrentExercise = index === currentExerciseIndex;
              return (
                <ScaleDecorator>
                  <View
                    style={[
                      styles.reorderItem,
                      { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
                      isActive && [styles.reorderItemDragging, { shadowColor: colors.primary, borderColor: colors.primary }],
                      isCurrentExercise && { borderColor: colors.primary + '60', backgroundColor: colors.primary + '08' }
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
                        {item.completedSets}/{item.totalSets} sets completed
                      </Text>
                    </View>
                    {isCurrentExercise && (
                      <View style={[styles.currentBadge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.currentBadgeText, { color: colors.onPrimary }]}>Current</Text>
                      </View>
                    )}
                  </View>
                </ScaleDecorator>
              );
            }}
          />
        </GestureHandlerRootView>
      </Modal>

    </View>
  );
};

export default WorkoutSessionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  exitButton: {
    fontSize: 16,
    color: Colors.light.error,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    flex: 1,
  },
  completeButton: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '600',
    overflow: 'hidden',
  },
  disabledText: {
    opacity: 0.5,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressCounter: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.borderLight + '60',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Current Exercise
  currentExerciseCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 28,
    marginTop: 24,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.light.primary + '30',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  exerciseHeader: {
    marginBottom: 28,
    position: 'relative',
  },
  backArrowButton: {
    position: 'absolute',
    left: -20,
    top: -20,
    zIndex: 10,
    padding: 6,
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  exerciseTitleContainer: {
    alignItems: 'center',
  },
  exerciseTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  setBadge: {
    backgroundColor: Colors.light.primary + '15',
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  setBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Set Inputs
  inputSection: {
    marginBottom: 32,
  },
  setInputs: {
    flexDirection: 'row',
    gap: 20,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.secondaryText,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  inputWrapper: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: Colors.light.borderLight,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    color: Colors.light.text,
    textAlign: 'center',
    fontWeight: '700',
    minHeight: 56,
  },
  inputGreyedOut: {
    color: Colors.light.secondaryText + '60',
    borderColor: Colors.light.borderLight + '60',
  },

  // Primary Action
  primaryActionContainer: {
    marginBottom: 8,
  },
  completeSetButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  finishWorkoutButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.4,
  },
  completeSetText: {
    color: Colors.light.onPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // Set History
  setHistoryCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  setHistoryCardLast: {
    marginBottom: 32,
  },
  setHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedSet: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight + '40',
  },
  completedSetText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },

  // Next Exercise
  nextExerciseCard: {
    backgroundColor: Colors.light.borderLight + '25',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.light.borderLight + '60',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nextExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextExerciseTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextExerciseIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.borderLight + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextExerciseIconText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '600',
  },
  nextExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  nextExerciseDetails: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Options Menu
  optionsButton: {
    position: 'absolute',
    right: -20,
    top: -20,
    padding: 8,
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: 8,
    marginHorizontal: 8,
  },

  // Full Screen Modal (Add/Swap Exercise)
  fullScreenModal: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  fullScreenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  fullScreenModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  modalSaveText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    opacity: 0.4,
  },

  // Search
  searchContainer: {
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },

  // Selected Exercise Config
  selectedExerciseConfig: {
    backgroundColor: Colors.light.cardBackground,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.primary + '40',
  },
  selectedExerciseBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedExerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  exerciseConfigRow: {
    flexDirection: 'row',
    gap: 12,
  },
  configInputGroup: {
    flex: 1,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  configInput: {
    backgroundColor: Colors.light.background,
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

  // Exercise List
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  exerciseListItemSelected: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
    backgroundColor: Colors.light.primary + '08',
  },
  exerciseListItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  exerciseListItemMuscles: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginTop: 2,
  },
  noExercisesText: {
    textAlign: 'center',
    color: Colors.light.secondaryText,
    fontSize: 15,
    marginTop: 40,
  },

  // Swap Exercise Current
  swapCurrentExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  swapCurrentLabel: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  swapCurrentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
    flex: 1,
  },

  // Reorder Modal
  gestureRoot: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  reorderItemCurrent: {
    borderColor: Colors.light.primary + '60',
    backgroundColor: Colors.light.primary + '08',
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
  currentBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.onPrimary,
    textTransform: 'uppercase',
  },

  // Inline Rest Timer
  inlineRestTimerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularProgressSvg: {
    position: 'absolute',
  },
  timerTextContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  skipRestButton: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  skipRestText: {
    color: Colors.light.secondaryText,
  },
});