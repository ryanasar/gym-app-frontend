/**
 * Local Calendar Storage
 * Stores workout completion dates for the calendar view
 * Only stores simple completion status - not full workout data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_STORAGE_KEY = '@gymvy_workout_calendar';
const DAYS_TO_KEEP = 60; // Keep last 60 days of data

/**
 * Get today's date string in YYYY-MM-DD format (local timezone)
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get calendar data
 * Returns object with dates as keys, completion info as values
 * @returns {Promise<Object>}
 */
export async function getCalendarData() {
  try {
    const data = await AsyncStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!data) {
      return {};
    }

    const calendar = JSON.parse(data);

    // Clean up old entries (older than DAYS_TO_KEEP)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);
    const cutoffString = cutoffDate.toISOString().split('T')[0];

    const cleaned = {};
    Object.keys(calendar).forEach(dateStr => {
      if (dateStr >= cutoffString) {
        cleaned[dateStr] = calendar[dateStr];
      }
    });

    return cleaned;
  } catch (error) {
    console.error('[CalendarStorage] Error getting calendar data:', error);
    return {};
  }
}

/**
 * Mark today as completed (workout or rest day)
 * @param {boolean} isRestDay - Whether today is a rest day
 * @returns {Promise<void>}
 */
export async function markTodayCompleted(isRestDay = false) {
  try {
    const calendar = await getCalendarData();
    const today = getTodayDateString();

    calendar[today] = {
      completed: true,
      isRestDay: isRestDay,
      timestamp: new Date().toISOString()
    };

    await AsyncStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(calendar));
  } catch (error) {
    console.error('[CalendarStorage] Error marking today as completed:', error);
    throw error;
  }
}

/**
 * Mark today as not completed (uncomplete)
 * Only today can be uncompleted - past dates are finalized
 * @returns {Promise<void>}
 */
export async function unmarkTodayCompleted() {
  try {
    const calendar = await getCalendarData();
    const today = getTodayDateString();

    // Only allow unmarking today
    if (calendar[today]) {
      delete calendar[today];
      await AsyncStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(calendar));
    }
  } catch (error) {
    console.error('[CalendarStorage] Error unmarking today as completed:', error);
    throw error;
  }
}

/**
 * Check if today is marked as completed
 * @returns {Promise<boolean>}
 */
export async function isTodayCompleted() {
  try {
    const calendar = await getCalendarData();
    const today = getTodayDateString();
    return !!calendar[today];
  } catch (error) {
    console.error('[CalendarStorage] Error checking if today is completed:', error);
    return false;
  }
}

/**
 * Get calendar data in the format expected by WorkoutCalendar component
 * @returns {Promise<Array>} Array of {date, volume, isRestDay}
 */
export async function getCalendarDataForDisplay() {
  try {
    const calendar = await getCalendarData();

    return Object.entries(calendar).map(([date, data]) => ({
      date,
      volume: data.isRestDay ? 0 : 1, // Just for display purposes
      isRestDay: data.isRestDay || false
    }));
  } catch (error) {
    console.error('[CalendarStorage] Error getting calendar data for display:', error);
    return [];
  }
}

/**
 * Backfill calendar data from backend workout sessions
 * Used to populate historical data when first loaded or to sync
 * Does NOT overwrite today's data
 * @param {Array} workoutSessions - Array of workout session objects from backend
 * @returns {Promise<void>}
 */
export async function backfillCalendarFromBackend(workoutSessions) {
  try {
    const calendar = await getCalendarData();
    const today = getTodayDateString();

    workoutSessions.forEach(session => {
      if (session.completedAt) {
        const date = new Date(session.completedAt).toISOString().split('T')[0];

        // Don't overwrite today's data (it might be more recent)
        if (date !== today && !calendar[date]) {
          const isRestDay = session.type === 'rest_day' ||
                          (session.exercises?.length === 0 && session.dayName === 'Rest Day');

          calendar[date] = {
            completed: true,
            isRestDay: isRestDay,
            timestamp: session.completedAt
          };
        }
      }
    });

    await AsyncStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(calendar));
  } catch (error) {
    console.error('[CalendarStorage] Error backfilling calendar:', error);
    throw error;
  }
}

/**
 * Clear all calendar data (for testing/debugging)
 * @returns {Promise<void>}
 */
export async function clearCalendarData() {
  try {
    await AsyncStorage.removeItem(CALENDAR_STORAGE_KEY);
  } catch (error) {
    console.error('[CalendarStorage] Error clearing calendar data:', error);
    throw error;
  }
}
