/**
 * Network Service
 * Handles network connectivity monitoring and state management
 * Uses periodic checks since NetInfo isn't available
 */

import { AppState } from 'react-native';

// Singleton state
let isOnline = true;
let listeners = new Set();
let checkIntervalId = null;
let appStateSubscription = null;

const CHECK_INTERVAL = 10000; // Check every 10 seconds when active

/**
 * Perform a network connectivity check
 * @returns {Promise<boolean>}
 */
async function performNetworkCheck() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 204;
  } catch (error) {
    return false;
  }
}

/**
 * Update network state and notify listeners if changed
 * @param {boolean} online
 */
function updateNetworkState(online) {
  const wasOnline = isOnline;
  isOnline = online;

  if (wasOnline !== isOnline) {
    console.log('[NetworkService] Network state changed:', isOnline ? 'online' : 'offline');
    notifyListeners(isOnline);
  }
}

/**
 * Initialize the network monitoring service
 * Call this once at app startup
 */
export async function initNetworkService() {
  if (checkIntervalId) {
    return; // Already initialized
  }

  // Get initial state
  const initialOnline = await performNetworkCheck();
  updateNetworkState(initialOnline);
  console.log('[NetworkService] Initial network state:', isOnline ? 'online' : 'offline');

  // Set up periodic checks
  checkIntervalId = setInterval(async () => {
    const online = await performNetworkCheck();
    updateNetworkState(online);
  }, CHECK_INTERVAL);

  // Check network when app comes to foreground
  appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
    if (nextAppState === 'active') {
      const online = await performNetworkCheck();
      updateNetworkState(online);
    }
  });
}

/**
 * Cleanup the network service
 * Call this when the app is closing
 */
export function cleanupNetworkService() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  listeners.clear();
}

/**
 * Get current network status synchronously
 * @returns {boolean}
 */
export function getNetworkStatus() {
  return isOnline;
}

/**
 * Check network status asynchronously (more accurate)
 * Uses a real network request to verify connectivity
 * @returns {Promise<boolean>}
 */
export async function checkNetworkStatus() {
  const online = await performNetworkCheck();
  updateNetworkState(online);
  return online;
}

/**
 * Subscribe to network state changes
 * @param {(isOnline: boolean) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToNetworkChanges(callback) {
  listeners.add(callback);

  // Immediately call with current state
  callback(isOnline);

  return () => {
    listeners.delete(callback);
  };
}

/**
 * Notify all listeners of network state change
 * @param {boolean} online
 */
function notifyListeners(online) {
  listeners.forEach((listener) => {
    try {
      listener(online);
    } catch (error) {
      console.error('[NetworkService] Listener error:', error);
    }
  });
}

/**
 * Wait for network to become available
 * Useful for operations that need network
 * @param {number} timeoutMs - Maximum time to wait (default: 30000ms)
 * @returns {Promise<boolean>} - Resolves true if online, false if timeout
 */
export function waitForNetwork(timeoutMs = 30000) {
  return new Promise((resolve) => {
    if (isOnline) {
      resolve(true);
      return;
    }

    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, timeoutMs);

    const unsubscribe = subscribeToNetworkChanges((online) => {
      if (online) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      }
    });
  });
}

/**
 * Force an immediate network check
 * @returns {Promise<boolean>}
 */
export async function forceNetworkCheck() {
  return checkNetworkStatus();
}

export default {
  initNetworkService,
  cleanupNetworkService,
  getNetworkStatus,
  checkNetworkStatus,
  subscribeToNetworkChanges,
  waitForNetwork,
  forceNetworkCheck,
};
