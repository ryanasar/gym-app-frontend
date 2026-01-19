import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import { useWorkout } from '../contexts/WorkoutContext';
import { useAuth } from '../auth/auth';
import { useSync } from '../contexts/SyncContext';
import { getSplitsByUserId } from '../api/splitsApi';

// Import split creation steps
import SplitNameStep from '../components/splitCreation/SplitNameStep';
import TrainingDaysStep from '../components/splitCreation/TrainingDaysStep';
import SplitOverviewStep from '../components/splitCreation/SplitOverviewStep';
import EditDayStep from '../components/splitCreation/EditDayStep';
import SplitReview from '../components/splitCreation/SplitReview';

const CreateSplitScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { activeSplit, updateActiveSplit, changeActiveSplit } = useWorkout();
  const { user } = useAuth();
  const { manualSync } = useSync();
  const [currentStep, setCurrentStep] = useState(1);

  // Check if we're in edit mode
  const isEditMode = params.editMode === 'true';
  const editingSplitId = params.splitId;

  const [splitData, setSplitData] = useState({
    name: '',
    emoji: '💪',
    totalDays: 4,
    description: '',
    workoutDays: [],
    isPublic: false
  });

  // Track which day is being edited (for step 4)
  const [editingDayIndex, setEditingDayIndex] = useState(null);

  // Load existing split data if in edit mode
  useEffect(() => {
    if (isEditMode && params.splitData) {
      try {
        const existingSplit = JSON.parse(params.splitData);
        setSplitData({
          name: existingSplit.name || '',
          emoji: existingSplit.emoji || '💪',
          totalDays: existingSplit.totalDays || 3,
          description: existingSplit.description || '',
          workoutDays: existingSplit.workoutDays || [],
          isPublic: existingSplit.isPublic || false
        });
      } catch (error) {
        console.error('Failed to parse split data:', error);
        Alert.alert('Error', 'Failed to load split data');
      }
    }
  }, [isEditMode, params.splitData]);

  const steps = [
    { id: 1, title: 'Name', component: SplitNameStep },
    { id: 2, title: 'Days', component: TrainingDaysStep },
    { id: 3, title: 'Overview', component: SplitOverviewStep },
    { id: 4, title: 'Edit Day', component: EditDayStep },
    { id: 5, title: 'Review', component: SplitReview }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);
  const CurrentStepComponent = currentStepData.component;

  // Handle editing a specific day (navigate to step 4)
  const handleEditDay = (dayIndex) => {
    setEditingDayIndex(dayIndex);
    setCurrentStep(4);
  };

  // Handle saving day and returning to overview
  const handleSaveDay = () => {
    setEditingDayIndex(null);
    setCurrentStep(3);
  };

  const handleNext = () => {
    // Special handling for step 4 (Edit Day) - go back to step 3 (Overview)
    if (currentStep === 4) {
      handleSaveDay();
      return;
    }

    // Skip step 4 when going from step 3 to step 5
    if (currentStep === 3) {
      setCurrentStep(5);
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const handlePrevious = () => {
    // Special handling for step 4 (Edit Day) - go back to step 3 (Overview)
    if (currentStep === 4) {
      handleSaveDay();
      return;
    }

    // Special handling for step 5 (Review) - go back to step 3 (Overview), skip step 4
    if (currentStep === 5) {
      setCurrentStep(3);
      return;
    }

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      handleCancel();
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Split Creation',
      'Are you sure you want to cancel? All progress will be lost.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please sign in again.');
      return;
    }

    try {
      // Check split count before creating (frontend validation)
      if (!isEditMode) {
        const userSplits = await getSplitsByUserId(user.id);
        if (userSplits.length >= 3) {
          Alert.alert(
            'Split Limit Reached',
            'You can only have 3 splits at once. Please delete one of your existing splits to create a new one.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Validate exercise limits
      for (const day of splitData.workoutDays) {
        if (day.exercises && Array.isArray(day.exercises) && day.exercises.length > 20) {
          Alert.alert(
            'Exercise Limit Exceeded',
            `Workout "${day.workoutName || 'Unnamed'}" has ${day.exercises.length} exercises. Maximum is 20 exercises per workout.`,
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Format data for backend
      const splitPayload = {
        userId: user.id,
        name: splitData.name,
        emoji: splitData.emoji,
        description: splitData.description,
        isPublic: splitData.isPublic,
        numDays: splitData.totalDays,
        workoutDays: splitData.workoutDays.map((day, index) => ({
          dayIndex: index,
          workoutName: day.workoutName,
          workoutDescription: day.workoutDescription,
          workoutType: day.workoutType,
          emoji: day.emoji,
          isRest: day.isRest,
          exercises: (day.exercises || []).map(ex => {
            // Transform exercise to backend format
            const exerciseId = ex.id?.toString() || ex.exerciseId || ex.name;
            const targetSets = parseInt(ex.sets || ex.targetSets) || 3;
            const targetReps = parseInt(ex.reps || ex.targetReps) || 10;
            const restSeconds = parseInt(ex.restSeconds) || 0;

            return {
              ...ex,
              exerciseId,
              targetSets,
              targetReps,
              restSeconds
            };
          })
        }))
      };

      if (isEditMode) {
        // Update existing split
        const { updateSplit } = require('../api/splitsApi');
        await updateSplit(parseInt(editingSplitId), splitPayload);

        // If this is the active split, update it locally so today's workout reflects changes
        if (activeSplit && activeSplit.id === parseInt(editingSplitId)) {
          const updatedActiveSplit = {
            ...activeSplit,
            name: splitData.name,
            emoji: splitData.emoji,
            description: splitData.description,
            totalDays: splitData.totalDays,
            days: splitData.workoutDays.map((day, index) => ({
              dayIndex: index,
              name: day.workoutName,
              type: day.workoutType,
              emoji: day.emoji,
              isRest: day.isRest,
              exercises: (day.exercises || []).map(ex => ({
                ...ex,
                exerciseId: ex.id?.toString() || ex.exerciseId,
                targetSets: parseInt(ex.sets || ex.targetSets) || 3,
                targetReps: parseInt(ex.reps || ex.targetReps) || 10,
                restSeconds: parseInt(ex.restSeconds) || 0,
              }))
            }))
          };
          await updateActiveSplit(updatedActiveSplit);
        }

        // Trigger automatic sync
        manualSync();

        Alert.alert('Success', 'Split updated successfully!', [
          { text: 'OK', onPress: () => {
            router.back();
            router.setParams({ refreshSplits: 'true' });
          }}
        ]);
      } else {
        // Create new split
        const { createSplit } = require('../api/splitsApi');
        const createdSplit = await createSplit(splitPayload);

        // Trigger automatic sync
        manualSync();

        // Ask if user wants to set as active split
        Alert.alert(
          'Split Created!',
          'Would you like to set this as your active split?',
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => {
                router.back();
                router.setParams({ refreshSplits: 'true' });
              }
            },
            {
              text: 'Set as Active',
              onPress: () => {
                // Format the split data for the context
                const formattedSplit = {
                  id: createdSplit.id,
                  name: splitData.name,
                  emoji: splitData.emoji,
                  description: splitData.description,
                  totalDays: splitData.totalDays,
                  started: createdSplit.started || false,
                  workoutDays: splitData.workoutDays.map((day, index) => ({
                    dayIndex: index,
                    name: day.workoutName,
                    type: day.workoutType,
                    exercises: day.exercises || []
                  })),
                  days: splitData.workoutDays.map((day, index) => ({
                    dayIndex: index,
                    name: day.workoutName,
                    type: day.workoutType,
                    emoji: day.emoji,
                    isRest: day.isRest,
                    exercises: day.exercises || []
                  }))
                };
                changeActiveSplit(formattedSplit);
                router.back();
                router.setParams({ refreshSplits: 'true' });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} split:`, error);

      // Handle specific backend errors
      if (error.response?.data?.error) {
        Alert.alert('Error', error.response.data.error);
      } else {
        Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} split. Please try again.`);
      }
    }
  };

  const updateSplitData = (updates) => {
    setSplitData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Name step
        return splitData.name.trim() !== '';
      case 2: // Training days step
        return splitData.totalDays >= 3 && splitData.totalDays <= 10;
      case 3: // Overview step
        // Can proceed if all days are configured
        return splitData.workoutDays.length === splitData.totalDays;
      case 4: // Edit day step
        // Can always go back to overview from edit day
        return true;
      case 5: // Review step
        return true;
      default:
        return false;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Split' : 'Create Split'}</Text>
        {isEditMode ? (
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Progress Indicator - Hide step 4 (Edit Day) as it's accessed via step 3 */}
      <View style={styles.progressContainer}>
        {steps.filter(step => step.id !== 4).map((step, index) => {
          // Adjust displayed step number for step 5 (Review) to show as step 4
          const displayStepId = step.id > 4 ? step.id - 1 : step.id;
          const isActive = currentStep === step.id || (currentStep === 4 && step.id === 3);

          return (
            <View key={step.id} style={styles.progressStep}>
              <View style={[
                styles.progressCircle,
                isActive && styles.progressCircleActive
              ]}>
                <Text style={[
                  styles.progressNumber,
                  isActive && styles.progressNumberActive
                ]}>
                  {displayStepId}
                </Text>
              </View>
              <Text style={[
                styles.progressLabel,
                isActive && styles.progressLabelActive
              ]}>
                {step.title}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Current Step Content */}
      <View style={styles.content}>
        <CurrentStepComponent
          splitData={splitData}
          updateSplitData={updateSplitData}
          editingDayIndex={editingDayIndex}
          onEditDay={handleEditDay}
          onSaveDay={handleSaveDay}
        />
      </View>

      {/* Main Navigation Buttons */}
      <View style={styles.mainNavigation}>
        <TouchableOpacity
          style={styles.mainPreviousButton}
          onPress={handlePrevious}
        >
          <Text style={styles.mainPreviousButtonText}>
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainNextButton, !canProceed() && styles.mainNextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={[styles.mainNextButtonText, !canProceed() && styles.mainNextButtonTextDisabled]}>
            {currentStep === 4 ? 'Save Day' : currentStep === steps.length ? (isEditMode ? 'Save' : 'Create Split') : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default CreateSplitScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelButton: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  saveButton: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholder: {
    width: 60, // Balance the cancel button
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.light.cardBackground,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCircleActive: {
    backgroundColor: Colors.light.primary,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  progressNumberActive: {
    color: Colors.light.onPrimary,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  mainNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  mainPreviousButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.cardBackground,
  },
  mainPreviousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  mainNextButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mainNextButtonDisabled: {
    backgroundColor: Colors.light.borderLight,
    shadowOpacity: 0,
  },
  mainNextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.onPrimary,
  },
  mainNextButtonTextDisabled: {
    color: Colors.light.secondaryText,
  },
});