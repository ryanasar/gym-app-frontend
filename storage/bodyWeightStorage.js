/**
 * Body Weight Local Storage
 * Stores body weight entries for the progress charts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types/storage.js';

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
 * Get all body weight entries, sorted by date ascending
 * @returns {Promise<Array<{date: string, weight: number, timestamp: string}>>}
 */
export async function getBodyWeightLog() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BODY_WEIGHT_LOG);
    if (!data) return [];

    const entries = JSON.parse(data);
    return entries.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('[BodyWeightStorage] Error getting body weight log:', error);
    return [];
  }
}

/**
 * Add or update a body weight entry for today
 * @param {number} weight - Weight in lbs
 * @returns {Promise<void>}
 */
export async function addBodyWeightEntry(weight) {
  try {
    const entries = await getBodyWeightLog();
    const today = getTodayDateString();

    const existingIndex = entries.findIndex(e => e.date === today);
    const entry = { date: today, weight, timestamp: new Date().toISOString() };

    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.BODY_WEIGHT_LOG, JSON.stringify(entries));
  } catch (error) {
    console.error('[BodyWeightStorage] Error adding body weight entry:', error);
    throw error;
  }
}

/**
 * Clear all body weight data
 * @returns {Promise<void>}
 */
export async function clearBodyWeightLog() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.BODY_WEIGHT_LOG);
  } catch (error) {
    console.error('[BodyWeightStorage] Error clearing body weight log:', error);
    throw error;
  }
}
