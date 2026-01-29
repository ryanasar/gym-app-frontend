import { useState } from 'react';
import { Alert } from 'react-native';
import { storage, calculateStreakFromLocal } from '../../../storage';

export const useWorkoutCompletion = ({
  markWorkoutCompleted,
  updatePendingCount,
  todaysWorkout,
  activeSplit,
  isRestDay,
  completedSessionId
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleCompletion = async (isCompleted) => {
    if (isToggling) return;

    if (isCompleted) {
      // Un-complete workflow - alert is shown by the calling component
      try {
        setIsToggling(true);

        if (completedSessionId) {
          const databaseId = await storage.getWorkoutDatabaseId(completedSessionId);

          if (databaseId) {
            try {
              const { deleteWorkoutSession } = require('../../api/workoutSessionsApi');
              await deleteWorkoutSession(databaseId);
              console.log('[Workout Completion] Deleted workout from backend:', databaseId);
            } catch (error) {
              if (error.response?.status !== 404) {
                console.error('[Workout Completion] Error deleting workout from backend:', error);
                Alert.alert('Error', 'Failed to delete from server. Please try again.');
                setIsToggling(false);
                return;
              }
            }

            await storage.deleteWorkoutDatabaseId(completedSessionId);
          }

          await storage.markWorkoutSynced(completedSessionId);
          await storage.removeFromCompletedHistory(completedSessionId);
        }

        await markWorkoutCompleted(null);
        await updatePendingCount();
      } catch (error) {
        console.error('[Workout Completion] Error deleting workout:', error);
        Alert.alert('Error', 'Failed to delete workout progress. Please try again.');
      } finally {
        setIsToggling(false);
      }
    } else {
      // Mark as complete workflow
      try {
        setIsToggling(true);

        if (todaysWorkout && activeSplit) {
          const { startWorkout: localStartWorkout, completeWorkout: localCompleteWorkout } = await import('../../../storage');

          const splitId = activeSplit.id;
          const dayIndex = (todaysWorkout.dayNumber || 1) - 1;
          const workout = await localStartWorkout(splitId, dayIndex);

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

          await storage.saveActiveWorkout(workout);
          await localCompleteWorkout(workout.id);
          await markWorkoutCompleted(workout.id, isRestDay);

          try {
            await calculateStreakFromLocal();
          } catch (error) {
            console.error('[Workout Completion] Error calculating streak:', error);
          }

          await updatePendingCount();
          return workout.id;
        }
      } catch (error) {
        console.error('[Workout Completion] Error saving quick workout completion:', error);
        Alert.alert('Error', 'Failed to save workout progress. Please try again.');
        setIsToggling(false);
        throw error;
      }
    }
  };

  return {
    isToggling,
    setIsToggling,
    handleToggleCompletion
  };
};
