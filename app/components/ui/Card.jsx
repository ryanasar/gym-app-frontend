import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Radius, Spacing, Shadows } from '../../constants/theme';

const Card = ({ children, variant = 'elevated', padding = Spacing.lg, style, onPress }) => {
  const colors = useThemeColors();

  const cardStyle = [
    styles.base,
    { backgroundColor: colors.cardBackground, padding },
    variant === 'elevated' && { ...Shadows.md, shadowColor: colors.shadow },
    variant === 'outlined' && { borderWidth: 1, borderColor: colors.borderLight },
    variant === 'flat' && { shadowOpacity: 0 },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
});

export default Card;
