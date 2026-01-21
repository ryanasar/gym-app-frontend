/**
 * useOfflineAware Hook
 * Provides utilities for handling offline-aware actions
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';
import { useAuth } from '../auth/auth';
import { isBlockedOffline, queueAction, canQueueAction } from '../../services/offlineQueue';

/**
 * Hook for handling offline-aware actions
 * @returns {Object}
 */
export function useOfflineAware() {
  const { isOffline, refreshNetworkStatus } = useNetwork();
  const { user, isOfflineSession } = useAuth();

  /**
   * Execute an action that requires network
   * Shows an alert if offline and action is blocked
   * @param {Function} action - The action to execute
   * @param {Object} options
   * @param {string} options.actionType - Type of action (for queue)
   * @param {Object} options.payload - Payload for queue
   * @param {boolean} options.canQueue - Whether action can be queued
   * @param {string} options.offlineMessage - Custom offline message
   * @returns {Promise<{success: boolean, queued: boolean}>}
   */
  const executeOnlineAction = useCallback(
    async (action, options = {}) => {
      const {
        actionType,
        payload,
        canQueue = false,
        offlineMessage = 'This action requires an internet connection.',
      } = options;

      // Check current network status
      const online = await refreshNetworkStatus();

      if (online) {
        try {
          await action();
          return { success: true, queued: false };
        } catch (error) {
          console.error('[useOfflineAware] Action failed:', error);
          throw error;
        }
      }

      // Offline - check if we can queue
      if (canQueue && actionType && canQueueAction(actionType) && user?.id) {
        await queueAction(actionType, payload, user.id);
        return { success: true, queued: true };
      }

      // Action blocked offline
      Alert.alert(
        'Offline',
        offlineMessage + '\n\nYour data will sync when you\'re back online.',
        [{ text: 'OK' }]
      );

      return { success: false, queued: false };
    },
    [isOffline, refreshNetworkStatus, user?.id]
  );

  /**
   * Check if an action should be blocked
   * @param {string} actionType
   * @returns {boolean}
   */
  const shouldBlockAction = useCallback(
    (actionType) => {
      return isOffline && isBlockedOffline(actionType);
    },
    [isOffline]
  );

  /**
   * Show offline alert for blocked actions
   * @param {string} actionName - Human-readable action name
   */
  const showOfflineAlert = useCallback((actionName = 'This action') => {
    Alert.alert(
      'Offline',
      `${actionName} requires an internet connection. Please try again when you're back online.`,
      [{ text: 'OK' }]
    );
  }, []);

  /**
   * Wrap an async function to handle offline state
   * @param {Function} fn - Async function to wrap
   * @param {Object} options
   * @returns {Function}
   */
  const withOfflineHandling = useCallback(
    (fn, options = {}) => {
      return async (...args) => {
        const { blockIfOffline = true, offlineMessage } = options;

        if (blockIfOffline && isOffline) {
          showOfflineAlert(offlineMessage);
          return null;
        }

        try {
          return await fn(...args);
        } catch (error) {
          // Check if error is due to network
          if (
            error.message?.includes('Network') ||
            error.message?.includes('network') ||
            error.code === 'NETWORK_ERROR'
          ) {
            showOfflineAlert();
            return null;
          }
          throw error;
        }
      };
    },
    [isOffline, showOfflineAlert]
  );

  return {
    isOffline,
    isOfflineSession,
    executeOnlineAction,
    shouldBlockAction,
    showOfflineAlert,
    withOfflineHandling,
    refreshNetworkStatus,
  };
}

export default useOfflineAware;
