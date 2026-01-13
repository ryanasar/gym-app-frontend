import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { exercises, searchExercises } from '../../data/exercises/exerciseDatabase';
import ExerciseCard from '../exercises/ExerciseCard';

const DayBuilder = ({ splitData, updateSplitData }) => {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
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
    { id: 'hamstrings', name: 'Hamstrings' },
    { id: 'glutes', name: 'Glutes' },
    { id: 'calves', name: 'Calves' },
    { id: 'forearms', name: 'Forearms' }
  ];


  // Initialize workout days when component mounts or totalDays changes
  useEffect(() => {
    if (splitData.workoutDays.length !== splitData.totalDays) {
      const newWorkoutDays = Array.from({ length: splitData.totalDays }, (_, index) => ({
        dayIndex: index,
        workoutName: '',
        workoutDescription: '',
        emoji: '💪',
        isRest: false,
        exercises: []
      }));
      updateSplitData({ workoutDays: newWorkoutDays });
    }
  }, [splitData.totalDays]);

  const updateCurrentDay = (updates) => {
    const updatedWorkoutDays = [...splitData.workoutDays];
    updatedWorkoutDays[currentDayIndex] = {
      ...updatedWorkoutDays[currentDayIndex],
      ...updates
    };
    updateSplitData({ workoutDays: updatedWorkoutDays });
  };

  const toggleRestDay = () => {
    const isCurrentlyRest = currentDay.isRest;
    updateCurrentDay({
      isRest: !isCurrentlyRest,
      workoutName: !isCurrentlyRest ? 'Rest Day' : '',
      workoutDescription: !isCurrentlyRest ? '' : currentDay.workoutDescription,
      emoji: !isCurrentlyRest ? '😴' : '💪',
      exercises: !isCurrentlyRest ? [] : currentDay.exercises
    });
  };

  const getFilteredExercises = () => {
    let filtered = [...exercises]; // Create a copy to avoid mutations

    // Apply muscle filter first (only primary muscles)
    if (selectedMuscleFilter !== 'all') {
      filtered = filtered.filter(exercise => {
        const primaryMatch = exercise.primaryMuscles && exercise.primaryMuscles.includes(selectedMuscleFilter);
        return primaryMatch;
      });
    }

    // Then apply search filter to muscle-filtered results
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(lowercaseQuery) ||
        exercise.primaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
        exercise.secondaryMuscles?.some(muscle => muscle.toLowerCase().includes(lowercaseQuery)) ||
        exercise.equipment?.toLowerCase().includes(lowercaseQuery) ||
        exercise.category?.toLowerCase().includes(lowercaseQuery)
      );
    }

    return filtered;
  };

  const addExerciseToWorkout = (exercise) => {
    const currentDay = splitData.workoutDays[currentDayIndex];
    const currentExerciseCount = currentDay.exercises?.length || 0;

    // Check if adding this exercise would exceed the limit
    if (currentExerciseCount >= 20) {
      Alert.alert(
        'Exercise Limit Reached',
        'You can only add up to 20 exercises per workout. Please remove an exercise before adding a new one.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newExercise = {
      ...exercise,
      sets: '',
      reps: '',
      weight: '',
      notes: ''
    };

    const updatedExercises = [...(currentDay.exercises || []), newExercise];

    updateCurrentDay({ exercises: updatedExercises });
    setExercisePickerVisible(false);
  };

  const removeExerciseFromWorkout = (exerciseIndex) => {
    const currentDay = splitData.workoutDays[currentDayIndex];
    const updatedExercises = [...currentDay.exercises];
    updatedExercises.splice(exerciseIndex, 1);
    updateCurrentDay({ exercises: updatedExercises });
  };

  const updateExercise = (exerciseIndex, field, value) => {
    const currentDay = splitData.workoutDays[currentDayIndex];
    const updatedExercises = [...currentDay.exercises];
    updatedExercises[exerciseIndex][field] = value;
    updateCurrentDay({ exercises: updatedExercises });
  };

  const goToNextDay = () => {
    if (currentDayIndex < splitData.totalDays - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const goToPreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const canProceedToNext = () => {
    if (currentDay.isRest) {
      return true; // Rest days can always proceed
    }
    // For workout days, need workout name and at least one exercise
    return currentDay.workoutName?.trim() && currentDay.exercises?.length > 0;
  };

  const currentDay = splitData.workoutDays[currentDayIndex] || {};

  return (
    <View style={styles.container}>
      {/* Combined Header */}
      <View style={styles.combinedHeader}>
        {/* Navigation Row */}
        <View style={styles.navRow}>
          {currentDayIndex > 0 ? (
            <TouchableOpacity
              style={styles.navButtonSecondary}
              onPress={goToPreviousDay}
            >
              <Text style={styles.navButtonSecondaryText}>
                ← Prev
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navButtonPlaceholder} />
          )}

          <View style={styles.dayIndicator}>
            <Text style={styles.dayNumber}>Day {currentDayIndex + 1}</Text>
            <Text style={styles.dayProgress}>
              {currentDayIndex + 1} of {splitData.totalDays}
            </Text>
          </View>

          {currentDayIndex < splitData.totalDays - 1 ? (
            <TouchableOpacity
              style={[
                styles.navButton,
                !canProceedToNext() && styles.navButtonDisabled
              ]}
              onPress={goToNextDay}
              disabled={!canProceedToNext()}
            >
              <Text style={[
                styles.navButtonText,
                !canProceedToNext() && styles.navButtonTextDisabled
              ]}>
                Next →
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navButtonPlaceholder} />
          )}
        </View>

      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} scrollEnabled={!currentDay.isRest}>
        <View style={styles.dayContent}>
          {/* Day Type Toggle */}
          <View style={styles.dayTypeToggleContainer}>
            <View style={styles.dayTypeToggleCard}>
              <TouchableOpacity
                style={[
                  styles.dayTypeOption,
                  !currentDay.isRest && styles.dayTypeOptionActive
                ]}
                onPress={() => !currentDay.isRest ? null : toggleRestDay()}
                activeOpacity={0.8}
              >
                <Text style={styles.dayTypeIcon}>💪</Text>
                <Text style={[
                  styles.dayTypeText,
                  !currentDay.isRest && styles.dayTypeTextActive
                ]}>
                  Workout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dayTypeOption,
                  currentDay.isRest && styles.dayTypeOptionActive
                ]}
                onPress={() => currentDay.isRest ? null : toggleRestDay()}
                activeOpacity={0.8}
              >
                <Text style={styles.dayTypeIcon}>😴</Text>
                <Text style={[
                  styles.dayTypeText,
                  currentDay.isRest && styles.dayTypeTextActive
                ]}>
                  Rest
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Workout Name Section */}
          {!currentDay.isRest && (
            <View style={styles.workoutNameSection}>
              <View style={styles.sectionLabelContainer}>
                <Text style={styles.sectionLabel}>Workout Name</Text>
                <Text style={styles.sectionRequiredIndicator}>Required</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Give this workout a descriptive name
              </Text>

              <View style={styles.workoutNameCard}>
                <TextInput
                  style={styles.workoutNameInput}
                  placeholder="e.g., Push Day, Upper Body, Chest & Triceps"
                  value={currentDay.workoutName}
                  onChangeText={(value) => updateCurrentDay({ workoutName: value })}
                  maxLength={50}
                  placeholderTextColor={Colors.light.secondaryText}
                />
              </View>
            </View>
          )}

          {/* Rest Day Message */}
          {currentDay.isRest && (
            <View style={styles.restDayContainer}>
              <Text style={styles.restDayEmoji}>😴</Text>
              <Text style={styles.restDayTitle}>Rest Day</Text>
              <Text style={styles.restDayDescription}>
                Take time to recover and let your muscles grow. You can do light stretching or mobility work.
              </Text>
            </View>
          )}

          {/* Exercises Section */}
          {!currentDay.isRest && (
            <View style={styles.exercisesSection}>
              <View style={styles.sectionLabelContainer}>
                <Text style={styles.sectionLabel}>Exercises</Text>
                <Text style={styles.sectionRequiredIndicator}>At least 1 required</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Add exercises to complete this workout
              </Text>

              <View style={styles.exercisesHeader}>
                <TouchableOpacity
                  style={[
                    styles.addExerciseButton,
                    (currentDay.exercises?.length >= 20) && styles.addExerciseButtonDisabled
                  ]}
                  onPress={() => setExercisePickerVisible(true)}
                  disabled={currentDay.exercises?.length >= 20}
                >
                  <Text style={[
                    styles.addExerciseText,
                    (currentDay.exercises?.length >= 20) && styles.addExerciseTextDisabled
                  ]}>
                    + Add Exercise
                  </Text>
                </TouchableOpacity>
                <View style={styles.exerciseCounter}>
                  <Text style={[
                    styles.exerciseCounterText,
                    (currentDay.exercises?.length >= 20) && styles.exerciseCounterTextLimit
                  ]}>
                    {currentDay.exercises?.length || 0}/20
                  </Text>
                </View>
              </View>

              {currentDay.exercises && currentDay.exercises.length > 0 ? (
                <View style={styles.exercisesList}>
                  {currentDay.exercises.map((exercise, exerciseIndex) => (
                    <View key={exerciseIndex} style={styles.exerciseCard}>
                      <View style={styles.exerciseCardHeader}>
                        <View style={styles.exerciseNumberContainer}>
                          <Text style={styles.exerciseNumber}>{exerciseIndex + 1}</Text>
                        </View>
                        <Text style={styles.exerciseName}>
                          {exercise.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeExerciseFromWorkout(exerciseIndex)}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.exerciseDivider} />

                      <View style={styles.exerciseInputs}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Sets</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="3"
                            value={exercise.sets}
                            onChangeText={(value) => updateExercise(exerciseIndex, 'sets', value)}
                            keyboardType="numeric"
                            placeholderTextColor={Colors.light.secondaryText}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Reps</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="8-10"
                            value={exercise.reps}
                            onChangeText={(value) => updateExercise(exerciseIndex, 'reps', value)}
                            placeholderTextColor={Colors.light.secondaryText}
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Weight</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="135 lbs"
                            value={exercise.weight}
                            onChangeText={(value) => updateExercise(exerciseIndex, 'weight', value)}
                            placeholderTextColor={Colors.light.secondaryText}
                          />
                        </View>

                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyExercises}>
                  <Text style={styles.emptyExercisesText}>
                    No exercises added yet. Tap "Add Exercise" to get started.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Workout Description */}
          {!currentDay.isRest && (
            <View style={styles.descriptionSection}>
              <View style={styles.sectionLabelContainer}>
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.sectionOptionalIndicator}>Optional</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Add any notes or focus areas for this workout
              </Text>

              <View style={styles.descriptionCard}>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Describe this workout..."
                  value={currentDay.workoutDescription}
                  onChangeText={(value) => updateCurrentDay({ workoutDescription: value })}
                  maxLength={200}
                  multiline={true}
                  numberOfLines={3}
                  placeholderTextColor={Colors.light.secondaryText}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

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

          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={Colors.light.secondaryText}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Filter Pill Selector */}
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScrollView}
              contentContainerStyle={styles.filterScrollContent}
            >
              {muscleGroups.map((muscle) => (
                <TouchableOpacity
                  key={muscle.id}
                  style={[
                    styles.filterPill,
                    selectedMuscleFilter === muscle.id && styles.filterPillActive
                  ]}
                  onPress={() => {
                    setSelectedMuscleFilter(muscle.id);
                    // Clear search when switching muscle filters for better UX
                    if (muscle.id !== 'all' && searchQuery.trim()) {
                      setSearchQuery('');
                    }
                  }}
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
          <ScrollView
            style={styles.exercisePickerList}
            contentContainerStyle={styles.exercisePickerContent}
            showsVerticalScrollIndicator={false}
          >
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

export default DayBuilder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  combinedHeader: {
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  navButtonDisabled: {
    backgroundColor: Colors.light.borderLight,
    shadowOpacity: 0,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.onPrimary,
  },
  navButtonTextDisabled: {
    color: Colors.light.secondaryText,
  },
  navButtonSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  navButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  navButtonPlaceholder: {
    width: 56,
    height: 28,
  },
  dayIndicator: {
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary + '20',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  dayProgress: {
    fontSize: 11,
    color: Colors.light.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.light.primary,
  },
  progressDotCompleted: {
    backgroundColor: Colors.light.primary + '80',
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.onPrimary,
  },
  content: {
    flex: 1,
  },
  dayContent: {
    padding: 24,
    gap: 40, // Increased spacing hierarchy between sections
  },

  // Section spacing and labels
  workoutNameSection: {
    marginBottom: 8,
  },
  exercisesSection: {
    marginBottom: 8,
  },
  descriptionSection: {
    marginBottom: 8,
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionRequiredIndicator: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.primary,
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionOptionalIndicator: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.secondaryText,
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginBottom: 16,
    lineHeight: 18,
  },

  // Day Type Toggle (Segmented Control)
  dayTypeToggleContainer: {
    marginBottom: 8,
  },
  dayTypeToggleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.borderLight,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  dayTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 7,
    gap: 6,
  },
  dayTypeOptionActive: {
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dayTypeIcon: {
    fontSize: 16,
  },
  dayTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  dayTypeTextActive: {
    color: Colors.light.text,
  },

  // Workout Name Card
  workoutNameCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  workoutNameInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },

  // Description Card
  descriptionCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  descriptionInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: Colors.light.text,
    height: 90,
    textAlignVertical: 'top',
  },
  restDayContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
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
  restDayDescription: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  exercisesHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addExerciseButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
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
    color: Colors.light.onPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  addExerciseTextDisabled: {
    color: Colors.light.secondaryText,
  },
  exerciseCounter: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  exerciseCounterText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  exerciseCounterTextLimit: {
    color: '#EF4444',
  },
  exercisesList: {
    gap: 20, // Improved spacing between exercise cards
  },
  exerciseCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  exerciseNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    lineHeight: 20,
  },
  removeButton: {
    width: 28,
    height: 28,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    lineHeight: 16,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyExercisesText: {
    fontSize: 15,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
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
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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

  // Search Section
  searchSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchBarContainer: {
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: Colors.light.secondaryText,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },

  // Filter Section
  filterSection: {
    paddingBottom: 20,
  },
  filterScrollView: {
    paddingHorizontal: 24,
  },
  filterScrollContent: {
    paddingRight: 24,
    gap: 12,
  },
  filterPill: {
    backgroundColor: Colors.light.borderLight + '80',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  filterPillTextActive: {
    color: Colors.light.onPrimary,
  },

  // Exercise List
  exercisePickerList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  exercisePickerContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
});