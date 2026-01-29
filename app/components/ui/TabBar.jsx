import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';

const TabBar = ({ tabs, activeTab, onTabPress, style, completed, lockedTab }) => {
  const colors = useThemeColors();

  // Green color for completed state background
  const completedColor = '#4CAF50';

  // When a workout is completed, lock to that tab
  const isLocked = completed && lockedTab;

  return (
    <View style={[
      styles.container,
      { borderBottomColor: completed ? completedColor : colors.borderLight },
      style,
      completed && { backgroundColor: completedColor },
    ]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const isDisabled = isLocked && tab.key !== lockedTab;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab]}
            onPress={() => !isDisabled && onTabPress(tab.key)}
            activeOpacity={isDisabled ? 1 : 0.7}
            disabled={isDisabled}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: isActive
                  ? (completed ? '#FFFFFF' : colors.primary)
                  : (isDisabled
                    ? (completed ? 'rgba(255,255,255,0.35)' : colors.secondaryText + '50')
                    : (completed ? 'rgba(255,255,255,0.7)' : colors.secondaryText))
                },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View style={[styles.indicator, { backgroundColor: completed ? '#FFFFFF' : colors.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  tabLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.xl,
    right: Spacing.xl,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});

export default TabBar;
