import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { exercises } from '../../data/exercises/exerciseDatabase';
import ExerciseCard from '../exercises/ExerciseCard';
import EmptyState from '../common/EmptyState';

// Rest Timer Input Component with digit selection
const RestTimerInput = ({ value, onChange }) => {
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
    <View style={restTimerStyles.container}>
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
          selectedDigit === 0 && restTimerStyles.digitSelected
        ]}
        onPress={() => handleDigitPress(0)}
        activeOpacity={0.7}
      >
        <Text style={[
          restTimerStyles.digitText,
          selectedDigit === 0 && restTimerStyles.digitTextSelected
        ]}>
          {minutes}
        </Text>
      </TouchableOpacity>
      <Text style={restTimerStyles.colon}>:</Text>
      <TouchableOpacity
        style={[
          restTimerStyles.digit,
          selectedDigit === 1 && restTimerStyles.digitSelected
        ]}
        onPress={() => handleDigitPress(1)}
        activeOpacity={0.7}
      >
        <Text style={[
          restTimerStyles.digitText,
          selectedDigit === 1 && restTimerStyles.digitTextSelected
        ]}>
          {sec1}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          restTimerStyles.digit,
          selectedDigit === 2 && restTimerStyles.digitSelected
        ]}
        onPress={() => handleDigitPress(2)}
        activeOpacity={0.7}
      >
        <Text style={[
          restTimerStyles.digitText,
          selectedDigit === 2 && restTimerStyles.digitTextSelected
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
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    backgroundColor: Colors.light.primary,
  },
  digitText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  digitTextSelected: {
    color: Colors.light.onPrimary,
  },
  colon: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
});

const EditDayStep = ({ splitData, updateSplitData, editingDayIndex }) => {
  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState('all');

  const muscleGroups = [
    { id: 'all', name: 'All Exercises' },
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
        <Text style={styles.errorText}>No day selected</Text>
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
    let filtered = [...exercises];

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

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Day {editingDayIndex + 1}</Text>
        <Text style={styles.subtitle}>Configure this workout day</Text>
      </View>

      {/* Rest Day Toggle */}
      <View style={styles.toggleSection}>
        <TouchableOpacity
          style={[styles.toggleOption, !currentDay.isRest && styles.toggleOptionActive]}
          onPress={() => currentDay.isRest && toggleRestDay()}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleIcon}>💪</Text>
          <Text style={[styles.toggleText, !currentDay.isRest && styles.toggleTextActive]}>
            Workout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleOption, currentDay.isRest && styles.toggleOptionActive]}
          onPress={() => !currentDay.isRest && toggleRestDay()}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleIcon}>😴</Text>
          <Text style={[styles.toggleText, currentDay.isRest && styles.toggleTextActive]}>
            Rest
          </Text>
        </TouchableOpacity>
      </View>

      {/* Workout Name */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Workout Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Push Day, Leg Day"
          placeholderTextColor={Colors.light.secondaryText}
          value={currentDay.workoutName}
          onChangeText={(value) => updateCurrentDay({ workoutName: value })}
          maxLength={50}
        />
      </View>

      {/* Exercises Header */}
      <View style={styles.exercisesSection}>
        <View style={styles.exercisesHeader}>
          <Text style={styles.sectionLabel}>Exercises</Text>
          <View style={styles.exerciseCounter}>
            <Text style={[
              styles.exerciseCounterText,
              (currentDay.exercises?.length >= 20) && styles.exerciseCounterTextLimit
            ]}>
              {currentDay.exercises?.length || 0}/20
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addExerciseButton,
            (currentDay.exercises?.length >= 20) && styles.addExerciseButtonDisabled
          ]}
          onPress={() => setExercisePickerVisible(true)}
          disabled={currentDay.exercises?.length >= 20}
        >
          <Ionicons name="add-circle" size={20} color={currentDay.exercises?.length >= 20 ? Colors.light.secondaryText : Colors.light.onPrimary} />
          <Text style={[
            styles.addExerciseText,
            (currentDay.exercises?.length >= 20) && styles.addExerciseTextDisabled
          ]}>
            Add Exercise
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderFooter = () => (
    <Text style={styles.dragHint}>Hold and drag to reorder exercises</Text>
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
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.exerciseCard,
            isActive && styles.exerciseCardDragging
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
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                    <View style={styles.dragDot} />
                  </View>
                ))}
              </View>
            </TouchableOpacity>
            <View style={styles.exerciseNumber}>
              <Text style={styles.exerciseNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeExerciseFromWorkout(index)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.exerciseDivider} />

          <View style={styles.exerciseInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputGroupLabel}>Sets</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="3"
                value={exercise.sets}
                onChangeText={(value) => updateExercise(index, 'sets', value)}
                keyboardType="numeric"
                placeholderTextColor={Colors.light.secondaryText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputGroupLabel}>Reps</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="8-10"
                value={exercise.reps}
                onChangeText={(value) => updateExercise(index, 'reps', value)}
                placeholderTextColor={Colors.light.secondaryText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputGroupLabel}>Weight</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="135 lbs"
                value={exercise.weight}
                onChangeText={(value) => updateExercise(index, 'weight', value)}
                placeholderTextColor={Colors.light.secondaryText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputGroupLabel}>Rest</Text>
              <RestTimerInput
                value={exercise.restSeconds || ''}
                onChange={(value) => updateExercise(index, 'restSeconds', value)}
              />
            </View>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }, [currentDay.exercises, removeExerciseFromWorkout, updateExercise]);

  // Rest day view uses ScrollView
  if (currentDay.isRest) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Day {editingDayIndex + 1}</Text>
            <Text style={styles.subtitle}>Configure this workout day</Text>
          </View>

          {/* Rest Day Toggle */}
          <View style={styles.toggleSection}>
            <TouchableOpacity
              style={[styles.toggleOption, !currentDay.isRest && styles.toggleOptionActive]}
              onPress={() => currentDay.isRest && toggleRestDay()}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleIcon}>💪</Text>
              <Text style={[styles.toggleText, !currentDay.isRest && styles.toggleTextActive]}>
                Workout
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleOption, currentDay.isRest && styles.toggleOptionActive]}
              onPress={() => !currentDay.isRest && toggleRestDay()}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleIcon}>😴</Text>
              <Text style={[styles.toggleText, currentDay.isRest && styles.toggleTextActive]}>
                Rest
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.restDayContainer}>
            <Text style={styles.restDayEmoji}>😴</Text>
            <Text style={styles.restDayTitle}>Rest Day</Text>
            <Text style={styles.restDayText}>Take time to recover and let your muscles grow</Text>
          </View>
        </ScrollView>

      </View>
    );
  }

  // Workout day view uses DraggableFlatList as main scroll container
  return (
    <View style={styles.container}>
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
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setExercisePickerVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          {/* Search */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={Colors.light.secondaryText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search exercises..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.light.secondaryText}
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
                    selectedMuscleFilter === muscle.id && styles.filterPillActive
                  ]}
                  onPress={() => setSelectedMuscleFilter(muscle.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.filterPillText,
                    selectedMuscleFilter === muscle.id && styles.filterPillTextActive
                  ]}>
                    {muscle.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Exercise List */}
          <ScrollView style={styles.exercisePickerList} contentContainerStyle={styles.exercisePickerContent}>
            {getFilteredExercises().map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onPress={() => addExerciseToWorkout(exercise)}
                compact={true}
              />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default EditDayStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
  toggleSection: {
    flexDirection: 'row',
    backgroundColor: Colors.light.borderLight,
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
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
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
    color: Colors.light.secondaryText,
  },
  toggleTextActive: {
    color: Colors.light.text,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.light.primary,
  },
  input: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
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
    color: Colors.light.text,
  },
  exerciseCounter: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exerciseCounterText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  exerciseCounterTextLimit: {
    color: '#EF4444',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addExerciseButtonDisabled: {
    backgroundColor: Colors.light.borderLight,
    shadowOpacity: 0,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.onPrimary,
  },
  addExerciseTextDisabled: {
    color: Colors.light.secondaryText,
  },
  exercisesList: {
    gap: 0,
  },
  dragHint: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  exerciseCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: 12,
  },
  exerciseCardDragging: {
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    borderColor: Colors.light.primary,
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
    backgroundColor: Colors.light.secondaryText,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  removeButton: {
    padding: 4,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
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
    color: Colors.light.text,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  smallInput: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
  },
  restDayContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  restDayEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  restDayTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
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
    color: Colors.light.secondaryText,
  },
  // Modal styles
  modal: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
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
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  filterSection: {
    paddingBottom: 20,
  },
  filterScrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterPill: {
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: Colors.light.primary,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  filterPillTextActive: {
    color: Colors.light.onPrimary,
  },
  exercisePickerList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  exercisePickerContent: {
    paddingBottom: 32,
  },
});
