import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { storage } from '../../../storage';

export const useExerciseManagement = ({ todaysWorkout, refreshTodaysWorkout }) => {
  const [localExercises, setLocalExercises] = useState([]);

  const handleReorderExercises = useCallback(async ({ data }) => {
    setLocalExercises(data);

    try {
      const currentSplit = await storage.getSplit();
      if (currentSplit) {
        const currentDayIndex = (todaysWorkout?.dayNumber || 1) - 1;
        const updatedSplit = JSON.parse(JSON.stringify(currentSplit));
        const days = updatedSplit.days || updatedSplit.workoutDays;

        if (days && days[currentDayIndex]) {
          days[currentDayIndex].exercises = data;
          await storage.saveSplit(updatedSplit);
          await refreshTodaysWorkout();
        }
      }
    } catch (error) {
      console.error('[Exercise Management] Error saving reordered exercises:', error);
      Alert.alert('Error', 'Failed to save exercise order. Please try again.');
    }
  }, [todaysWorkout, refreshTodaysWorkout]);

  const handleRemoveExercise = useCallback(async (exerciseIndex) => {
    const updatedExercises = localExercises.filter((_, index) => index !== exerciseIndex);
    setLocalExercises(updatedExercises);

    try {
      const currentSplit = await storage.getSplit();
      if (currentSplit) {
        const currentDayIndex = (todaysWorkout?.dayNumber || 1) - 1;
        const updatedSplit = JSON.parse(JSON.stringify(currentSplit));
        const days = updatedSplit.days || updatedSplit.workoutDays;

        if (days && days[currentDayIndex]) {
          days[currentDayIndex].exercises = updatedExercises;
          await storage.saveSplit(updatedSplit);
          await refreshTodaysWorkout();
        }
      }
    } catch (error) {
      console.error('[Exercise Management] Error removing exercise:', error);
      Alert.alert('Error', 'Failed to remove exercise. Please try again.');
    }
  }, [localExercises, todaysWorkout, refreshTodaysWorkout]);

  const handleAddExercise = useCallback(async (selectedExercise, sets, reps) => {
    if (!selectedExercise) {
      Alert.alert('Select Exercise', 'Please select an exercise to add.');
      return;
    }

    const setsInt = parseInt(sets) || 3;
    const repsInt = parseInt(reps) || 10;

    const newExercise = {
      id: selectedExercise.id,
      name: selectedExercise.name,
      sets: setsInt.toString(),
      reps: repsInt.toString(),
      primaryMuscles: selectedExercise.primaryMuscles,
      secondaryMuscles: selectedExercise.secondaryMuscles,
      equipment: selectedExercise.equipment,
    };

    const updatedExercises = [...localExercises, newExercise];
    setLocalExercises(updatedExercises);

    try {
      const currentSplit = await storage.getSplit();
      if (currentSplit) {
        const currentDayIndex = (todaysWorkout?.dayNumber || 1) - 1;
        const updatedSplit = JSON.parse(JSON.stringify(currentSplit));
        const days = updatedSplit.days || updatedSplit.workoutDays;

        if (days && days[currentDayIndex]) {
          days[currentDayIndex].exercises = updatedExercises;
          await storage.saveSplit(updatedSplit);
          await refreshTodaysWorkout();
        }
      }
    } catch (error) {
      console.error('[Exercise Management] Error adding exercise:', error);
      Alert.alert('Error', 'Failed to add exercise. Please try again.');
    }
  }, [localExercises, todaysWorkout, refreshTodaysWorkout]);

  return {
    localExercises,
    setLocalExercises,
    handleReorderExercises,
    handleRemoveExercise,
    handleAddExercise
  };
};
