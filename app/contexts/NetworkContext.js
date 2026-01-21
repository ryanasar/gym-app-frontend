/**
 * NetworkContext - Global network state provider
 * Provides network connectivity state throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initNetworkService,
  cleanupNetworkService,
  subscribeToNetworkChanges,
  checkNetworkStatus,
  getNetworkStatus,
} from '../../services/networkService';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize network service
    initNetworkService().then(() => {
      setIsInitialized(true);
    });

    // Subscribe to network changes
    const unsubscribe = subscribeToNetworkChanges((online) => {
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
      cleanupNetworkService();
    };
  }, []);

  const refreshNetworkStatus = useCallback(async () => {
    const online = await checkNetworkStatus();
    setIsOnline(online);
    return online;
  }, []);

  const value = {
    isOnline,
    isOffline: !isOnline,
    isInitialized,
    refreshNetworkStatus,
    getNetworkStatus: () => getNetworkStatus(),
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

export default NetworkContext;
