import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';

const ScreenHeader = ({ title, subtitle, leftAction, rightAction, style }) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {leftAction && <View style={styles.leftAction}>{leftAction}</View>}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{subtitle}</Text>
          )}
        </View>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftAction: {
    marginRight: Spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  rightAction: {
    marginLeft: Spacing.md,
  },
});

export default ScreenHeader;
