import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

const LoadingSpinner = ({ size = 'large', color, fullScreen = false }) => {
  const colors = useThemeColors();
  const indicatorColor = color || colors.primary;

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={indicatorColor} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={indicatorColor} />;
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;
