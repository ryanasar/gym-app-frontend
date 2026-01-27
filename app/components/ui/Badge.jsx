import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';

const Badge = ({ label, color, icon, onPress, size = 'md', style }) => {
  const colors = useThemeColors();
  const bgColor = color ? color + '20' : colors.borderLight;
  const textColor = color || colors.secondaryText;
  const isSmall = size === 'sm';

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
          paddingVertical: isSmall ? 2 : Spacing.xs,
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={isSmall ? 10 : 12}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontSize: isSmall ? FontSize.xs : FontSize.sm,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontWeight: FontWeight.semibold,
  },
});

export default Badge;
