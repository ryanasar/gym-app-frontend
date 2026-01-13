import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSync } from '../contexts/SyncContext';
import { startWorkout, updateWorkoutSet, completeWorkout, cancelWorkout, getActiveWorkout, calculateStreakFromLocal, storage } from '../../storage';

const WorkoutSessionScreen = () => {
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

  // Animation refs
  const slideXAnim = useRef(new Animated.Value(0)).current; // Horizontal for sets
  const slideYAnim = useRef(new Animated.Value(0)).current; // Vertical for exercises
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Input refs
  const weightInputRef = useRef(null);
  const repsInputRef = useRef(null);

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
            for (let i = 0; i < restoredExercises.length; i++) {
              const ex = restoredExercises[i];
              const firstIncompleteSet = ex.sessionSets.findIndex(s => !s.completed);
              if (firstIncompleteSet !== -1) {
                setCurrentExerciseIndex(i);
                setCurrentSetIndex(firstIncompleteSet);
                foundCurrent = true;
                break;
              }
            }

            if (!foundCurrent) {
              // All sets complete, set to last
              setCurrentExerciseIndex(restoredExercises.length - 1);
              setCurrentSetIndex(restoredExercises[restoredExercises.length - 1].sessionSets.length - 1);
            }

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

            return {
              name: exerciseData?.name || `Exercise ${exercise.exerciseId}`,
              id: exercise.exerciseId,
              completedSets: 0,
              totalSets: exercise.sets.length,
              sessionSets: exercise.sets.map((set) => ({
                setNumber: set.setIndex + 1,
                weight: set.weight?.toString() || '0',
                reps: set.reps?.toString() || '0',
                completed: false
              }))
            };
          });

          setExercises(initializedExercises);
        }
      } catch (error) {
        console.error('[Session] Error checking for active workout:', error);
      }
    };

    checkForActiveWorkout();
  }, []);

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

    // Move to next set or exercise
    if (isLastSet) {
      if (isLastExercise) {
        // Workout completed!
        handleWorkoutComplete();
      } else {
        // Move to next exercise with vertical animation
        animateToNextExercise();
      }
    } else {
      // Move to next set with horizontal animation
      animateToNextSet();
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
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSetIndex(0);

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={exitWorkout} style={styles.headerLeft}>
          <Text style={styles.exitButton}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workoutData.dayName}</Text>
        <TouchableOpacity onPress={handleWorkoutComplete} style={styles.headerRight}>
          <Text style={styles.completeButton}>Complete</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Workout Progress</Text>
          <Text style={styles.progressCounter}>
            {currentExerciseIndex + 1}/{exercises.length}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${((currentExerciseIndex + (currentSetIndex + 1) / currentExercise.totalSets) / exercises.length) * 100}%` }
            ]} />
          </View>
        </View>
        <Text style={styles.progressText}>
          Exercise {currentExerciseIndex + 1} of {exercises.length} • Set {currentSetIndex + 1} of {currentExercise.totalSets}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Exercise */}
        <Animated.View
          style={[
            styles.currentExerciseCard,
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
                <Ionicons name="arrow-back" size={18} color={Colors.light.text} />
              </TouchableOpacity>
            )}

            <View style={styles.exerciseTitleContainer}>
              <Text style={styles.exerciseTitle}>{currentExercise.name}</Text>
              <View style={styles.setBadge}>
                <Text style={styles.setBadgeText}>
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
              <Ionicons name="ellipsis-vertical" size={20} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          {/* Set Input Fields */}
          <View style={styles.inputSection}>
            <View style={styles.setInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>WEIGHT (LBS)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={weightInputRef}
                    style={[
                      styles.input,
                      (!currentSet?.weight || currentSet?.weight === '0') && styles.inputGreyedOut
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
                    placeholderTextColor={Colors.light.secondaryText + '80'}
                    selectionColor={Colors.light.primary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>REPS</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={repsInputRef}
                    style={styles.input}
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
                    placeholderTextColor={Colors.light.secondaryText + '80'}
                    selectionColor={Colors.light.primary}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Set Completion Button */}
          <View style={styles.primaryActionContainer}>
            <TouchableOpacity
              style={[
                styles.completeSetButton,
                isLastSet && isLastExercise && styles.finishWorkoutButton
              ]}
              onPress={completeCurrentSet}
              activeOpacity={0.8}
            >
              <Text style={styles.completeSetText}>
                {isLastSet && isLastExercise ? '🎉 Finish Workout' : '✓ Complete Set'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Set History for Current Exercise */}
        {currentExercise.completedSets > 0 && (
          <View style={[
            styles.setHistoryCard,
            !nextExercise && styles.setHistoryCardLast
          ]}>
            <Text style={styles.setHistoryTitle}>Completed Sets</Text>
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
                  <View key={index} style={styles.completedSet}>
                    <Text style={styles.completedSetText}>
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
            style={styles.nextExerciseCard}
            onPress={goToNextExercise}
            activeOpacity={0.7}
          >
            <View style={styles.nextExerciseHeader}>
              <Text style={styles.nextExerciseTitle}>Up Next</Text>
              <View style={styles.nextExerciseIcon}>
                <Text style={styles.nextExerciseIconText}>→</Text>
              </View>
            </View>
            <Text style={styles.nextExerciseName}>{nextExercise.name}</Text>
            <Text style={styles.nextExerciseDetails}>
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
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleAddSet}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={24} color={Colors.light.primary} />
                <Text style={styles.modalOptionText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
    color: Colors.light.secondaryText,
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
    color: Colors.light.onPrimary,
    fontWeight: '600',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
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
    backgroundColor: Colors.light.borderLight + '80',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: Colors.light.borderLight + '80',
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
});