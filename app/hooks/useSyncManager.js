/**
 * useSyncManager Hook
 * Manages background sync of pending workouts
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { backgroundSync, getSyncStatus } from '../../storage';
import { useAuth } from '../auth/auth';

/**
 * Hook to manage background sync
 * @param {object} options - Configuration options
 * @param {number} options.syncInterval - Sync interval in milliseconds (default: 5 minutes)
 * @param {boolean} options.syncOnMount - Sync on component mount (default: true)
 * @param {boolean} options.syncOnForeground - Sync when app comes to foreground (default: true)
 */
export function useSyncManager(options = {}) {
  const {
    syncInterval = 5 * 60 * 1000, // 5 minutes
    syncOnMount = true,
    syncOnForeground = true,
  } = options;

  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const syncIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  /**
   * Performs a sync operation
   */
  const performSync = useCallback(async () => {
    if (!user?.id || isSyncing) {
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      const result = await backgroundSync(user.id);

      setLastSyncTime(Date.now());

      if (result && result.failed > 0) {
        setSyncError(`Failed to sync ${result.failed} workout(s)`);
      }

      // Update pending count
      const status = await getSyncStatus();
      setPendingCount(status.pendingCount);
    } catch (error) {
      console.error('[useSyncManager] Sync failed:', error);
      setSyncError('Sync failed. Will retry later.');
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, isSyncing]);

  /**
   * Updates the pending count
   */
  const updatePendingCount = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      setPendingCount(status.pendingCount);
    } catch (error) {
      console.error('[useSyncManager] Failed to update pending count:', error);
    }
  }, []);

  // Sync on mount
  useEffect(() => {
    if (syncOnMount && user?.id) {
      performSync();
    }
  }, [syncOnMount, user?.id]);

  // Set up periodic sync
  useEffect(() => {
    if (!user?.id || syncInterval <= 0) {
      return;
    }

    syncIntervalRef.current = setInterval(() => {
      performSync();
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [user?.id, syncInterval, performSync]);

  // Sync when app comes to foreground
  useEffect(() => {
    if (!syncOnForeground || !user?.id) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        performSync();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [syncOnForeground, user?.id, performSync]);

  // Update pending count whenever user changes
  useEffect(() => {
    if (user?.id) {
      updatePendingCount();
    }
  }, [user?.id, updatePendingCount]);

  return {
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncError,
    manualSync: performSync,
    updatePendingCount,
  };
}
