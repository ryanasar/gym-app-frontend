/**
 * OfflineBanner - Subtle banner indicating offline status
 * Shows when the app is offline and hides when back online
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSync } from '../../contexts/SyncContext';

export function OfflineBanner() {
  const { isOffline, isInitialized } = useNetwork();
  const sync = useSync();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const translateY = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!isInitialized) return;

    if (isOffline) {
      setVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [isOffline, isInitialized]);

  if (!visible) return null;

  const pendingCount = sync?.pendingCount || 0;
  const pendingText = pendingCount > 0
    ? ` - ${pendingCount} pending`
    : '';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 4,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.dot} />
        <Text style={styles.text}>
          Offline mode{pendingText}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#374151',
    zIndex: 9999,
    paddingBottom: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FCD34D',
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default OfflineBanner;
