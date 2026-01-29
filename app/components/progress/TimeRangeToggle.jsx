import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

const RANGES = ['3m', '6m', '1y', 'All'];

const TimeRangeToggle = ({ selectedRange, onRangeChange }) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {RANGES.map((range) => {
        const isSelected = selectedRange === range;
        return (
          <TouchableOpacity
            key={range}
            style={[
              styles.button,
              {
                backgroundColor: isSelected ? colors.primary : colors.background,
                borderColor: isSelected ? colors.primary : colors.borderLight,
              },
            ]}
            onPress={() => onRangeChange(range)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: isSelected ? colors.onPrimary : colors.secondaryText,
                  fontWeight: isSelected ? '600' : '500',
                },
              ]}
            >
              {range}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TimeRangeToggle;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 13,
  },
});
