import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage, unmarkTodayCompleted } from '../../../storage';
import { updateSplit } from '../../api/splitsApi';

export const handleDaySelection = async (dayIndex, activeSplit, markWorkoutCompleted, refreshTodaysWorkout) => {
  try {
    // Clear any existing completion for today when changing days
    await unmarkTodayCompleted();

    // Clear all completion state in storage and context
    await AsyncStorage.multiRemove([
      'completedSessionId',
      'lastCompletionDate',
      'lastCheckDate'
    ]);

    // Clear completion in context
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

    // Refresh to show the selected workout
    await refreshTodaysWorkout();
  } catch (error) {
    console.error('[Split Management] Error starting split:', error);
    Alert.alert('Error', 'Failed to start split. Please try again.');
    throw error;
  }
};

export const clearLocalSplitData = async (refreshTodaysWorkout) => {
  return new Promise((resolve) => {
    Alert.alert(
      'Clear Local Data?',
      'This will remove the local split and reset your progress. You can then select a new split from the Program tab.\n\nYour workout history is safe.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const { clearLocalSplit } = await import('../../utils/clearLocalSplit');
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
              resolve(true);
            } else {
              Alert.alert('Error', 'Failed to clear local data.');
              resolve(false);
            }
          },
        },
      ]
    );
  });
};
