/**
 * SyncContext - Global sync manager
 * Handles background sync of pending workouts throughout the app
 */

import React, { createContext, useContext } from 'react';
import { useSyncManager } from '../hooks/useSyncManager';

const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  const syncState = useSyncManager({
    syncInterval: 5 * 60 * 1000, // Sync every 5 minutes
    syncOnMount: true, // Sync when app starts
    syncOnForeground: true, // Sync when app comes to foreground
  });

  return (
    <SyncContext.Provider value={syncState}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
