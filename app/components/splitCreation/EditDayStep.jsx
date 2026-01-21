import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { exercises } from '../../data/exercises/exerciseDatabase';
import ExerciseCard from '../exercises/ExerciseCard';
import EmptyState from '../common/EmptyState';
import SavedWorkoutPickerModal from './SavedWorkoutPickerModal';
import SaveWorkoutModal from './SaveWorkoutModal';
import CreateCustomExerciseModal from '../exercises/CreateCustomExerciseModal';
import { getSavedWorkouts, createSavedWorkout } from '../../api/savedWorkoutsApi';
import { getCustomExercises, createCustomExercise } from '../../api/customExercisesApi';

// Rest Timer Input Component with digit selection
const RestTimerInput = ({ value, onChange, colors }) => {
  const [selectedDigit, setSelectedDigit] = useState(null); // 0=min, 1=sec1, 2=sec2
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Parse seconds to M:SS digits
  const totalSeconds = parseInt(value) || 0;
  const minutes = Math.min(Math.floor(totalSeconds / 60), 5);
  const seconds = totalSeconds % 60;
  const sec1 = Math.floor(seconds / 10);
  const sec2 = seconds % 10;

  const handleDigitPress = (digitIndex) => {
    setSelectedDigit(digitIndex);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (key) => {
    if (selectedDigit === null) return;

    const num = parseInt(key);
    if (isNaN(num)) return;

    let newMinutes = minutes;
    let newSec1 = sec1;
    let newSec2 = sec2;

    if (selectedDigit === 0) {
      // Minutes: 0-5
      newMinutes = Math.min(num, 5);
    } else if (selectedDigit === 1) {
      // First second digit: 0-5
      newSec1 = Math.min(num, 5);
    } else if (selectedDigit === 2) {
      // Second second digit: 0-9
      newSec2 = num;
    }

    const newTotalSeconds = newMinutes * 60 + newSec1 * 10 + newSec2;
    onChange(newTotalSeconds > 0 ? newTotalSeconds.toString() : '');

    // Clear input and auto-advance to next digit
    setInputValue('');
    if (selectedDigit < 2) {
      setSelectedDigit(selectedDigit + 1);
    } else {
      setSelectedDigit(null);
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    setSelectedDigit(null);
    setInputValue('');
  };

  return (
    <View style={[restTimerStyles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <TextInput
        ref={inputRef}
        style={restTimerStyles.hiddenInput}
        keyboardType="number-pad"
        maxLength={1}
        onChangeText={(text) => {
          if (text) {
            handleKeyPress(text);
          }
          setInputValue('');
        }}
        onBlur={handleBlur}
        value={inputValue}
        caretHidden={true}
      />
      <TouchableOpacity
        style={[
          restTimerStyles.digit,
          selectedDigit === 0 && [restTimerStyles.digitSelected, { backgroundColor: colors.primary }]
        ]}
        onPress={() => handleDigitPress(0)}
        activeOpacity={0.7}
      >
        <Text style={[
          restTimerStyles.digitText,
          { color: colors.text },
          selectedDigit === 0 && [restTimerStyles.digitTextSelected, { color: colors.onPrimary }]
        ]}>
          {minutes}
        </Text>
      </TouchableOpacity>
      <Text style={[restTimerStyles.colon, { color: colors.text }]}>:</Text>
      <TouchableOpacity
        style={[
          restTimerStyles.digit,
          selectedDigit === 1 && [restTimerStyles.digitSelected, { backgroundColor: colors.primary }]
        ]}
        onPress={() => handleDigitPress(1)}
        activeOpacity={0.7}
      >
        <Text style={[
          restTimerStyles.digitText,
          { color: colors.text },
          selectedDigit === 1 && [restTimerStyles.digitTextSelected, { color: colors.onPrimary }]
        ]}>
          {sec1}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          restTimerStyles.digit,
          selectedDigit === 2 && [restTimerStyles.digitSelected, { backgroundColor: colors.primary }]
        ]}
        onPress={() => handleDigitPress(2)}
        activeOpacity={0.7}
      >
        <Text style={[
          restTimerStyles.digitText,
          { color: colors.text },
          selectedDigit === 2 && [restTimerStyles.digitTextSelected, { color: colors.onPrimary }]
        ]}>
          {sec2}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const restTimerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  digit: {
    paddingHorizontal: 2,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  digitSelected: {
    // backgroundColor set dynamically
  },
  digitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  digitTextSelected: {
    // color set dynamically
  },
  colon: {
    fontSize: 14,
    fontWeight: '500',
  },
});

const EditDayStep = ({ splitData, updateSplitData, editingDayIndex }) => {
  const colors = useThemeColors();
  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('all');

  // Saved workout states
  const [savedWorkoutPickerVisible, setSavedWorkoutPickerVisible] = useState(false);
  const [saveWorkoutModalVisible, setSaveWorkoutModalVisible] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState([]);
  const [loadingSavedWorkouts, setLoadingSavedWorkouts] = useState(false);
  const [savingWorkout, setSavingWorkout] = useState(false);

  // Custom exercise states
  const [customExercises, setCustomExercises] = useState([]);
  const [createCustomModalVisible, setCreateCustomModalVisible] = useState(false);

  // Load custom exercises on mount
  useEffect(() => {
    const loadCustomExercises = async () => {
      try {
        const exercises = await getCustomExercises();
        setCustomExercises(exercises);
      } catch (error) {
        console.error('Failed to load custom exercises:', error);
      }
    };
    loadCustomExercises();
  }, []);

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
  ];

  if (editingDayIndex === null || !splitData.workoutDays[editingDayIndex]) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.secondaryText }]}>No day selected</Text>
      </View>
    );
  }

  const currentDay = splitData.workoutDays[editingDayIndex];

  const updateCurrentDay = (updates) => {
    const updatedWorkoutDays = [...splitData.workoutDays];
    updatedWorkoutDays[editingDayIndex] = {
      ...updatedWorkoutDays[editingDayIndex],
      ...updates
    };
    updateSplitData({ workoutDays: updatedWorkoutDays });
  };

  const toggleRestDay = () => {
    const isCurrentlyRest = currentDay.isRest;
    updateCurrentDay({
      isRest: !isCurrentlyRest,
      workoutName: !isCurrentlyRest ? 'Rest Day' : '',
      workoutDescription: '',
      emoji: !isCurrentlyRest ? '😴' : '💪',
      exercises: []
    });
  };

  const addExerciseToWorkout = (exercise) => {
    const currentExerciseCount = currentDay.exercises?.length || 0;

    if (currentExerciseCount >= 20) {
      Alert.alert(
        'Exercise Limit Reached',
        'You can only add up to 20 exercises per workout.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newExercise = {
      ...exercise,
      sets: '',
      reps: '',
      weight: '',
      restSeconds: '',
      notes: ''
    };

    const updatedExercises = [...(currentDay.exercises || []), newExercise];
    updateCurrentDay({ exercises: updatedExercises });
    setExercisePickerVisible(false);
  };

  const removeExerciseFromWorkout = (exerciseIndex) => {
    const updatedExercises = [...currentDay.exercises];
    updatedExercises.splice(exerciseIndex, 1);
    updateCurrentDay({ exercises: updatedExercises });
  };

  const updateExercise = (exerciseIndex, field, value) => {
    const updatedExercises = [...currentDay.exercises];
    updatedExercises[exerciseIndex][field] = value;
    updateCurrentDay({ exercises: updatedExercises });
  };

  const handleReorderExercises = useCallback(({ data }) => {
    updateCurrentDay({ exercises: data });
  }, [currentDay, updateCurrentDay]);

  const getFilteredExercises = () => {
    // Handle "My Exercises" filter - only show custom exercises
    if (selectedMuscleFilter === 'my_exercises') {
      let filtered = customExercises.map(ex => ({ ...ex, isCustom: true }));

      if (searchQuery.trim()) {
        const lowercaseQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(exercise =>
          exercise.name.toLowerCase().includes(lowercaseQuery) ||
          exercise.primaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
          exercise.equipment?.toLowerCase().includes(lowercaseQuery)
        );
      }

      return filtered;
    }

    // Merge bundled exercises with custom exercises
    const bundledExercises = [...exercises];
    const customWithFlag = customExercises.map(ex => ({ ...ex, isCustom: true }));
    let filtered = [...bundledExercises, ...customWithFlag];

    if (selectedMuscleFilter !== 'all') {
      filtered = filtered.filter(exercise => {
        return exercise.primaryMuscles && exercise.primaryMuscles.includes(selectedMuscleFilter);
      });
    }

    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(lowercaseQuery) ||
        exercise.primaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
        exercise.equipment?.toLowerCase().includes(lowercaseQuery)
      );
    }

    return filtered;
  };

  // Handle opening create custom exercise modal
  const openCreateCustomModal = () => {
    // Close exercise picker first to avoid nested modal issues on iOS
    setExercisePickerVisible(false);
    // Small delay to allow the first modal to close
    setTimeout(() => {
      setCreateCustomModalVisible(true);
    }, 300);
  };

  // Handle creating a new custom exercise
  const handleCreateCustomExercise = async (exerciseData) => {
    const newExercise = await createCustomExercise(exerciseData);
    setCustomExercises([...customExercises, newExercise]);
    // Optionally auto-select "My Exercises" filter to show the new exercise
    setSelectedMuscleFilter('my_exercises');
    // Re-open exercise picker after creating
    setTimeout(() => {
      setExercisePickerVisible(true);
    }, 300);
  };

  // Load saved workouts from local storage
  const loadSavedWorkouts = async () => {
    setLoadingSavedWorkouts(true);
    try {
      const workouts = await getSavedWorkouts();
      setSavedWorkouts(workouts);
    } catch (error) {
      console.error('Failed to load saved workouts:', error);
      Alert.alert('Error', 'Failed to load saved workouts');
    } finally {
      setLoadingSavedWorkouts(false);
    }
  };

  // Apply a saved workout to current day
  const applySavedWorkout = (savedWorkout) => {
    updateCurrentDay({
      workoutName: savedWorkout.name,
      workoutDescription: savedWorkout.description || '',
      workoutType: savedWorkout.workoutType || '',
      emoji: savedWorkout.emoji || '💪',
      exercises: savedWorkout.exercises || []
    });
    setSavedWorkoutPickerVisible(false);
  };

  // Save current day as a saved workout to local storage
  const saveCurrentDayAsWorkout = async (name, description) => {
    setSavingWorkout(true);
    try {
      await createSavedWorkout({
        name,
        description,
        emoji: currentDay.emoji || '💪',
        workoutType: currentDay.workoutType || '',
        exercises: currentDay.exercises || []
      });
      setSaveWorkoutModalVisible(false);
    } catch (error) {
      console.error('Failed to save workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSavingWorkout(false);
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Day {editingDayIndex + 1}</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Configure this workout day</Text>
      </View>

      {/* Quick Actions Row */}
      {!currentDay.isRest && (
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
            onPress={() => {
              loadSavedWorkouts();
              setSavedWorkoutPickerVisible(true);
            }}
          >
            <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.primary }]}>Use Saved Workout</Text>
          </TouchableOpacity>

          {currentDay.exercises?.length > 0 && (
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}
              onPress={() => setSaveWorkoutModalVisible(true)}
            >
              <Ionicons name="bookmark-outline" size={18} color={colors.accent} />
              <Text style={[styles.quickActionText, { color: colors.accent }]}>Save Workout</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Rest Day Toggle */}
      <View style={[styles.toggleSection, { backgroundColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.toggleOption, !currentDay.isRest && [styles.toggleOptionActive, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]]}
          onPress={() => currentDay.isRest && toggleRestDay()}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleIcon}>💪</Text>
          <Text style={[styles.toggleText, { color: colors.secondaryText }, !currentDay.isRest && [styles.toggleTextActive, { color: colors.text }]]}>
            Workout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleOption, currentDay.isRest && [styles.toggleOptionActive, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]]}
          onPress={() => !currentDay.isRest && toggleRestDay()}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleIcon}>😴</Text>
          <Text style={[styles.toggleText, { color: colors.secondaryText }, currentDay.isRest && [styles.toggleTextActive, { color: colors.text }]]}>
            Rest
          </Text>
        </TouchableOpacity>
      </View>

      {/* Workout Name */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Workout Name <Text style={[styles.required, { color: colors.primary }]}>*</Text></Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g., Push Day, Leg Day"
          placeholderTextColor={colors.placeholder}
          value={currentDay.workoutName}
          onChangeText={(value) => updateCurrentDay({ workoutName: value })}
          maxLength={50}
        />
      </View>

      {/* Exercises Header */}
      <View style={styles.exercisesSection}>
        <View style={styles.exercisesHeader}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Exercises</Text>
          <View style={[styles.exerciseCounter, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[
              styles.exerciseCounterText,
              { color: colors.text },
              (currentDay.exercises?.length >= 20) && styles.exerciseCounterTextLimit
            ]}>
              {currentDay.exercises?.length || 0}/20
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addExerciseButton,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
            (currentDay.exercises?.length >= 20) && [styles.addExerciseButtonDisabled, { backgroundColor: colors.borderLight }]
          ]}
          onPress={() => setExercisePickerVisible(true)}
          disabled={currentDay.exercises?.length >= 20}
        >
          <Ionicons name="add-circle" size={20} color={currentDay.exercises?.length >= 20 ? colors.secondaryText : colors.onPrimary} />
          <Text style={[
            styles.addExerciseText,
            { color: colors.onPrimary },
            (currentDay.exercises?.length >= 20) && [styles.addExerciseTextDisabled, { color: colors.secondaryText }]
          ]}>
            Add Exercise
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderFooter = () => (
    <Text style={[styles.dragHint, { color: colors.secondaryText }]}>Hold and drag to reorder exercises</Text>
  );

  const renderEmptyList = () => (
    <EmptyState
      emoji="💪"
      title="No exercises added"
      message="Add exercises to build your workout"
    />
  );

  const renderExerciseItem = useCallback(({ item: exercise, drag, isActive, getIndex }) => {
    const index = getIndex();
    return (
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.exerciseCard,
          { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
          isActive && [styles.exerciseCardDragging, { backgroundColor: colors.cardBackground, shadowColor: colors.primary, borderColor: colors.primary }]
        ]}
      >
          <View style={styles.exerciseCardHeader}>
            <TouchableOpacity
              onPressIn={drag}
              disabled={isActive}
              style={styles.dragHandle}
            >
              <View style={styles.dragDots}>
                {[0, 1].map((row) => (
                  <View key={row} style={styles.dragDotsRow}>
                    <View style={[styles.dragDot, { backgroundColor: colors.secondaryText }]} />
                    <View style={[styles.dragDot, { backgroundColor: colors.secondaryText }]} />
                    <View style={[styles.dragDot, { backgroundColor: colors.secondaryText }]} />
                    <View style={[styles.dragDot, { backgroundColor: colors.secondaryText }]} />
                  </View>
                ))}
              </View>
            </TouchableOpacity>
            <View style={[styles.exerciseNumber, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.exerciseNumberText, { color: colors.primary }]}>{index + 1}</Text>
            </View>
            <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeExerciseFromWorkout(index)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <View style={[styles.exerciseDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.exerciseInputs}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputGroupLabel, { color: colors.text }]}>Sets</Text>
              <TextInput
                style={[styles.smallInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="3"
                value={exercise.sets}
                onChangeText={(value) => updateExercise(index, 'sets', value.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={2}
                contextMenuHidden={true}
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputGroupLabel, { color: colors.text }]}>Reps</Text>
              <TextInput
                style={[styles.smallInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="8-12"
                value={exercise.reps}
                onChangeText={(value) => updateExercise(index, 'reps', value.replace(/[^0-9\-]/g, ''))}
                keyboardType="numbers-and-punctuation"
                maxLength={7}
                contextMenuHidden={true}
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputGroupLabel, { color: colors.text }]}>Weight</Text>
              <TextInput
                style={[styles.smallInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="135"
                value={exercise.weight}
                onChangeText={(value) => updateExercise(index, 'weight', value.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                maxLength={6}
                contextMenuHidden={true}
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputGroupLabel, { color: colors.text }]}>Rest</Text>
              <RestTimerInput
                value={exercise.restSeconds || ''}
                onChange={(value) => updateExercise(index, 'restSeconds', value)}
                colors={colors}
              />
            </View>
          </View>
        </TouchableOpacity>
    );
  }, [currentDay.exercises, removeExerciseFromWorkout, updateExercise, colors]);

  // Rest day view uses ScrollView
  if (currentDay.isRest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Day {editingDayIndex + 1}</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Configure this workout day</Text>
          </View>

          {/* Rest Day Toggle */}
          <View style={[styles.toggleSection, { backgroundColor: colors.borderLight }]}>
            <TouchableOpacity
              style={[styles.toggleOption, !currentDay.isRest && [styles.toggleOptionActive, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]]}
              onPress={() => currentDay.isRest && toggleRestDay()}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleIcon}>💪</Text>
              <Text style={[styles.toggleText, { color: colors.secondaryText }, !currentDay.isRest && [styles.toggleTextActive, { color: colors.text }]]}>
                Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleOption, currentDay.isRest && [styles.toggleOptionActive, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]]}
              onPress={() => !currentDay.isRest && toggleRestDay()}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleIcon}>😴</Text>
              <Text style={[styles.toggleText, { color: colors.secondaryText }, currentDay.isRest && [styles.toggleTextActive, { color: colors.text }]]}>
                Rest
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.restDayContainer, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <Text style={styles.restDayEmoji}>😴</Text>
            <Text style={[styles.restDayTitle, { color: colors.text }]}>Rest Day</Text>
            <Text style={[styles.restDayText, { color: colors.secondaryText }]}>Take time to recover and let your muscles grow</Text>
          </View>
        </ScrollView>

      </View>
    );
  }

  // Workout day view uses DraggableFlatList as main scroll container
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DraggableFlatList
        data={currentDay.exercises || []}
        extraData={currentDay.exercises}
        keyExtractor={(item, index) => `exercise-${item.id || item.name}-${index}`}
        onDragEnd={handleReorderExercises}
        renderItem={renderExerciseItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={currentDay.exercises?.length > 0 ? renderFooter : null}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Exercise Picker Modal */}
      <Modal
        visible={exercisePickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={() => setExercisePickerVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Exercise</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={openCreateCustomModal}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.createButtonText, { color: colors.primary }]}>Create</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchSection}>
            <View style={[styles.searchBar, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.secondaryText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search exercises..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle.id}
                  style={[
                    styles.filterPill,
                    { backgroundColor: colors.borderLight },
                    selectedMuscleFilter === muscle.id && [styles.filterPillActive, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => setSelectedMuscleFilter(muscle.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.filterPillText,
                    { color: colors.text },
                    selectedMuscleFilter === muscle.id && [styles.filterPillTextActive, { color: colors.onPrimary }]
                  ]}>
                    {muscle.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Exercise List */}
          <ScrollView style={styles.exercisePickerList} contentContainerStyle={styles.exercisePickerContent}>
            {getFilteredExercises().length === 0 && selectedMuscleFilter === 'my_exercises' ? (
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
              getFilteredExercises().map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onPress={() => addExerciseToWorkout(exercise)}
                  compact={true}
                  isCustom={exercise.isCustom}
                />
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Saved Workout Picker Modal */}
      <SavedWorkoutPickerModal
        visible={savedWorkoutPickerVisible}
        onClose={() => setSavedWorkoutPickerVisible(false)}
        savedWorkouts={savedWorkouts}
        loading={loadingSavedWorkouts}
        onSelectWorkout={applySavedWorkout}
      />

      {/* Save Workout Modal */}
      <SaveWorkoutModal
        visible={saveWorkoutModalVisible}
        onClose={() => setSaveWorkoutModalVisible(false)}
        onSave={saveCurrentDayAsWorkout}
        defaultName={currentDay.workoutName || ''}
        defaultDescription={currentDay.workoutDescription || ''}
        exerciseCount={currentDay.exercises?.length || 0}
        saving={savingWorkout}
      />

      {/* Create Custom Exercise Modal */}
      <CreateCustomExerciseModal
        visible={createCustomModalVisible}
        onClose={() => setCreateCustomModalVisible(false)}
        onSave={handleCreateCustomExercise}
      />
    </View>
  );
};

export default EditDayStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  toggleSection: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 24,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  toggleOptionActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleIcon: {
    fontSize: 18,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleTextActive: {
    // color set dynamically
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    // color set dynamically
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  exercisesSection: {
    marginBottom: 24,
  },
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseCounter: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exerciseCounterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  exerciseCounterTextLimit: {
    color: '#EF4444',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addExerciseButtonDisabled: {
    shadowOpacity: 0,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addExerciseTextDisabled: {
    // color set dynamically
  },
  exercisesList: {
    gap: 0,
  },
  dragHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  exerciseCardDragging: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dragHandle: {
    padding: 4,
    marginRight: 4,
  },
  dragDots: {
    flexDirection: 'column',
    gap: 3,
  },
  dragDotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dragDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  exerciseDivider: {
    height: 1,
    marginBottom: 12,
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyStateText: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  restDayContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    borderRadius: 16,
    borderWidth: 1,
  },
  restDayEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  restDayTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  // Modal styles
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalPlaceholder: {
    width: 60,
  },
  searchSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterSection: {
    paddingBottom: 20,
  },
  filterScrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillActive: {
    // backgroundColor set dynamically
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterPillTextActive: {
    // color set dynamically
  },
  exercisePickerList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  exercisePickerContent: {
    paddingBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
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
