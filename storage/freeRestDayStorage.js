/**
 * Free Rest Day Storage
 * Tracks weekly free rest day usage via AsyncStorage.
 * Users get 1 free rest day per week (resets Sunday).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FREE_REST_DAY_KEY = '@gymvy_free_rest_day_last_used';

/**
 * Get the start of the week (Sunday at 00:00) for a given date.
 * @param {Date} date
 * @returns {Date}
 */
function getStartOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - dayOfWeek);
  return d;
}

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
 * Check if a free rest day is available this week.
 * Returns true if lastUsedDate is null or falls in a previous week.
 * @returns {Promise<boolean>}
 */
export async function isFreeRestDayAvailable() {
  try {
    const lastUsedDate = await AsyncStorage.getItem(FREE_REST_DAY_KEY);
    if (!lastUsedDate) return true;

    // Parse the stored date
    const [year, month, day] = lastUsedDate.split('-').map(Number);
    const lastUsed = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentWeekStart = getStartOfWeek(today);
    const lastUsedWeekStart = getStartOfWeek(lastUsed);

    // Available if the last usage was in a previous week
    return lastUsedWeekStart.getTime() < currentWeekStart.getTime();
  } catch (error) {
    console.error('[FreeRestDayStorage] Error checking availability:', error);
    return false;
  }
}

/**
 * Mark today as the free rest day usage date.
 * @returns {Promise<void>}
 */
export async function useFreeRestDay() {
  try {
    const today = getTodayDateString();
    await AsyncStorage.setItem(FREE_REST_DAY_KEY, today);
  } catch (error) {
    console.error('[FreeRestDayStorage] Error marking free rest day used:', error);
    throw error;
  }
}

/**
 * Clear free rest day usage if it was used today (for un-complete flow).
 * @returns {Promise<void>}
 */
export async function clearFreeRestDayUsageForToday() {
  try {
    const lastUsedDate = await AsyncStorage.getItem(FREE_REST_DAY_KEY);
    const today = getTodayDateString();

    if (lastUsedDate === today) {
      await AsyncStorage.removeItem(FREE_REST_DAY_KEY);
    }
  } catch (error) {
    console.error('[FreeRestDayStorage] Error clearing free rest day usage:', error);
    throw error;
  }
}
