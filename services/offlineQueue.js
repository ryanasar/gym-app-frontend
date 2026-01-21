/**
 * Offline Action Queue Service
 * Handles queuing and replaying actions when offline
 *
 * Queued actions are stored locally and replayed in order when back online.
 * Each action includes type, payload, timestamp, and userId.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkNetworkStatus } from './networkService';

const OFFLINE_QUEUE_KEY = '@gymvy/offline_action_queue';

// Action types that can be queued
export const ACTION_TYPES = {
  COMPLETE_WORKOUT: 'COMPLETE_WORKOUT',
  CREATE_POST: 'CREATE_POST',
  LIKE_POST: 'LIKE_POST',
  UNLIKE_POST: 'UNLIKE_POST',
  FOLLOW_USER: 'FOLLOW_USER',
  UNFOLLOW_USER: 'UNFOLLOW_USER',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  REST_DAY: 'REST_DAY',
};

// Actions that are blocked while offline (cannot be queued)
export const BLOCKED_OFFLINE_ACTIONS = [
  'FOLLOW_USER',
  'UNFOLLOW_USER',
  'CREATE_POST',
  'LIKE_POST',
  'UNLIKE_POST',
];

/**
 * @typedef {Object} QueuedAction
 * @property {string} id - Unique action ID
 * @property {string} type - Action type from ACTION_TYPES
 * @property {Object} payload - Action payload
 * @property {number} timestamp - When the action was queued
 * @property {string} userId - User who initiated the action
 * @property {number} retryCount - Number of retry attempts
 */

/**
 * Get all queued actions
 * @returns {Promise<QueuedAction[]>}
 */
export async function getQueuedActions() {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[OfflineQueue] Failed to get queued actions:', error);
    return [];
  }
}

/**
 * Add an action to the queue
 * @param {string} type - Action type
 * @param {Object} payload - Action payload
 * @param {string} userId - User ID
 * @returns {Promise<QueuedAction>}
 */
export async function queueAction(type, payload, userId) {
  try {
    const action = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      userId,
      retryCount: 0,
    };

    const queue = await getQueuedActions();
    queue.push(action);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

    console.log('[OfflineQueue] Action queued:', { type, id: action.id });
    return action;
  } catch (error) {
    console.error('[OfflineQueue] Failed to queue action:', error);
    throw error;
  }
}

/**
 * Remove an action from the queue
 * @param {string} actionId
 * @returns {Promise<void>}
 */
export async function removeAction(actionId) {
  try {
    const queue = await getQueuedActions();
    const filtered = queue.filter((a) => a.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[OfflineQueue] Failed to remove action:', error);
  }
}

/**
 * Update an action in the queue (e.g., increment retry count)
 * @param {string} actionId
 * @param {Partial<QueuedAction>} updates
 * @returns {Promise<void>}
 */
export async function updateAction(actionId, updates) {
  try {
    const queue = await getQueuedActions();
    const index = queue.findIndex((a) => a.id === actionId);
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates };
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.error('[OfflineQueue] Failed to update action:', error);
  }
}

/**
 * Clear all queued actions
 * @returns {Promise<void>}
 */
export async function clearQueue() {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log('[OfflineQueue] Queue cleared');
  } catch (error) {
    console.error('[OfflineQueue] Failed to clear queue:', error);
  }
}

/**
 * Get queue status
 * @returns {Promise<{count: number, types: Object}>}
 */
export async function getQueueStatus() {
  const queue = await getQueuedActions();
  const types = {};

  queue.forEach((action) => {
    types[action.type] = (types[action.type] || 0) + 1;
  });

  return {
    count: queue.length,
    types,
  };
}

/**
 * Check if an action type can be queued (vs blocked offline)
 * @param {string} actionType
 * @returns {boolean}
 */
export function canQueueAction(actionType) {
  return !BLOCKED_OFFLINE_ACTIONS.includes(actionType);
}

/**
 * Check if an action type is blocked while offline
 * @param {string} actionType
 * @returns {boolean}
 */
export function isBlockedOffline(actionType) {
  return BLOCKED_OFFLINE_ACTIONS.includes(actionType);
}

/**
 * Process the queue when back online
 * @param {Object} handlers - Map of action type to handler function
 * @returns {Promise<{processed: number, failed: number, errors: Array}>}
 */
export async function processQueue(handlers) {
  const online = await checkNetworkStatus();
  if (!online) {
    console.log('[OfflineQueue] Cannot process queue - still offline');
    return { processed: 0, failed: 0, errors: [] };
  }

  const queue = await getQueuedActions();
  if (queue.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }

  console.log('[OfflineQueue] Processing queue:', queue.length, 'actions');

  let processed = 0;
  let failed = 0;
  const errors = [];
  const MAX_RETRIES = 3;

  // Process in order (oldest first)
  for (const action of queue) {
    const handler = handlers[action.type];

    if (!handler) {
      console.warn('[OfflineQueue] No handler for action type:', action.type);
      // Remove unknown actions
      await removeAction(action.id);
      continue;
    }

    try {
      await handler(action.payload, action.userId);
      await removeAction(action.id);
      processed++;
      console.log('[OfflineQueue] Action processed:', action.id);
    } catch (error) {
      const newRetryCount = action.retryCount + 1;

      if (newRetryCount >= MAX_RETRIES) {
        // Max retries reached, remove from queue
        console.error('[OfflineQueue] Max retries reached, removing action:', action.id);
        await removeAction(action.id);
        failed++;
        errors.push({ actionId: action.id, error: error.message });
      } else {
        // Increment retry count
        await updateAction(action.id, { retryCount: newRetryCount });
        failed++;
        errors.push({ actionId: action.id, error: error.message, retryCount: newRetryCount });
      }
    }
  }

  return { processed, failed, errors };
}

export default {
  getQueuedActions,
  queueAction,
  removeAction,
  clearQueue,
  getQueueStatus,
  canQueueAction,
  isBlockedOffline,
  processQueue,
  ACTION_TYPES,
  BLOCKED_OFFLINE_ACTIONS,
};
