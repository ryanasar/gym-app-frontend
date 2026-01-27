import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Radius, Spacing, FontSize, FontWeight } from '../../constants/theme';

const SIZE_CONFIG = {
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, fontSize: FontSize.body, iconSize: 16 },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, fontSize: FontSize.md, iconSize: 20 },
  lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl, fontSize: FontSize.lg, iconSize: 24 },
};

const Button = ({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style }) => {
  const colors = useThemeColors();
  const sizeConfig = SIZE_CONFIG[size];

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: colors.primary },
          text: { color: colors.onPrimary },
          iconColor: colors.onPrimary,
        };
      case 'secondary':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
          text: { color: colors.primary },
          iconColor: colors.primary,
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: colors.primary },
          iconColor: colors.primary,
        };
      default:
        return {
          container: { backgroundColor: colors.primary },
          text: { color: colors.onPrimary },
          iconColor: colors.onPrimary,
        };
    }
  };

  const variantStyle = getVariantStyle();

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
        },
        variantStyle.container,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.text.color} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={sizeConfig.iconSize}
              color={variantStyle.iconColor}
              style={title ? styles.iconMargin : undefined}
            />
          )}
          {title && (
            <Text style={[styles.text, { fontSize: sizeConfig.fontSize }, variantStyle.text]}>
              {title}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  text: {
    fontWeight: FontWeight.semibold,
  },
  iconMargin: {
    marginRight: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
