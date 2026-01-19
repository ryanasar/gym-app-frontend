import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../../storage';

/**
 * Clear the active split from local storage
 * Useful when there's a mismatch between local and backend
 */
export async function clearLocalSplit() {
  try {
    await AsyncStorage.removeItem('@gymvy_active_split');
    await AsyncStorage.removeItem('currentWeek');
    await AsyncStorage.removeItem('currentDayIndex');
    await AsyncStorage.removeItem('lastCompletionDate');
    await AsyncStorage.removeItem('lastCheckDate');

    console.log('[ClearLocalSplit] Successfully cleared local split data');
    return true;
  } catch (error) {
    console.error('[ClearLocalSplit] Error clearing local split:', error);
    return false;
  }
}

/**
 * Force reload split from backend and save to local storage
 * Use this when local split data is corrupted
 */
export async function reloadSplitFromBackend(splitId, userId) {
  try {
    const { getSplitsByUserId } = await import('../api/splitsApi');

    // Fetch all user splits from backend
    const splits = await getSplitsByUserId(userId);

    // Find the split with matching ID
    const split = splits.find(s => s.id === splitId);

    if (!split) {
      console.error('[ReloadSplit] Split not found on backend:', splitId);
      return null;
    }

    console.log('[ReloadSplit] Found split on backend:', split.name);

    // Transform backend split to local format
    const localSplit = {
      id: split.id,
      name: split.name,
      emoji: split.emoji,
      description: split.description,
      totalDays: split.numDays || split.totalDays,
      isPublic: split.isPublic,
      days: split.workoutDays.map((day, index) => ({
        dayIndex: index,
        name: day.workoutName,
        type: day.workoutType,
        emoji: day.emoji,
        isRest: day.isRest || false,
        exercises: (day.exercises || [])
          .map(ex => {
            const exerciseId = ex.exerciseId?.toString() || ex.id?.toString();
            const targetSets = parseInt(ex.targetSets || ex.sets) || 3;
            const targetReps = parseInt(ex.targetReps || ex.reps) || 10;
            const restSeconds = parseInt(ex.restSeconds) || 0;

            if (!exerciseId || exerciseId === 'undefined') {
              console.warn('[ReloadSplit] Skipping invalid exercise:', ex);
              return null;
            }

            return {
              exerciseId,
              targetSets,
              targetReps,
              restSeconds,
            };
          })
          .filter(ex => ex !== null), // Remove invalid exercises
      })),
    };

    // Save to local storage
    await storage.saveSplit(localSplit);

    console.log('[ReloadSplit] Successfully reloaded split from backend');
    console.log('[ReloadSplit] Days:', localSplit.days.length);
    console.log('[ReloadSplit] Total exercises:',
      localSplit.days.reduce((sum, day) => sum + (day.exercises?.length || 0), 0)
    );

    return localSplit;
  } catch (error) {
    console.error('[ReloadSplit] Error reloading split:', error);
    return null;
  }
}

/**
 * Debug function to see what's in local storage
 */
export async function debugLocalSplit() {
  try {
    const split = await storage.getSplit();
    const week = await AsyncStorage.getItem('currentWeek');
    const dayIndex = await AsyncStorage.getItem('currentDayIndex');

    console.log('=== LOCAL STORAGE DEBUG ===');
    console.log('Active Split:', split ? split.name : 'None');
    console.log('Split ID:', split?.id);
    console.log('Total Days:', split?.totalDays);
    console.log('Current Week:', week);
    console.log('Current Day Index:', dayIndex);
    console.log('Days:', split?.days?.map(d => d.name || 'Unnamed'));

    // Show exercise details
    if (split?.days) {
      split.days.forEach((day, i) => {
        console.log(`  Day ${i}: ${day.name || 'Unnamed'} - ${day.exercises?.length || 0} exercises`);
        if (day.exercises) {
          day.exercises.forEach((ex, j) => {
            console.log(`    Ex ${j}: ID=${ex.exerciseId}, Sets=${ex.targetSets}, Reps=${ex.targetReps}`);
          });
        }
      });
    }

    console.log('=========================');

    return split;
  } catch (error) {
    console.error('[DebugLocalSplit] Error:', error);
    return null;
  }
}
