import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';

const TabBar = ({ tabs, activeTab, onTabPress, style }) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { borderBottomColor: colors.borderLight }, style]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab]}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? colors.primary : colors.secondaryText },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
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
