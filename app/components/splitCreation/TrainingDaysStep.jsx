import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const TrainingDaysStep = ({ splitData, updateSplitData }) => {
  const colors = useThemeColors();
  const dayOptions = [3, 4, 5, 6, 7, 8, 9, 10];

  const handleSelectDays = (numDays) => {
    updateSplitData({ totalDays: numDays });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Split Length</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Choose the total length of your split (including rest days)
        </Text>
      </View>

      {/* Picker Container */}
      <View style={styles.pickerContainer}>
        <View style={[styles.pickerWrapper, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Picker
            selectedValue={splitData.totalDays}
            onValueChange={(value) => handleSelectDays(value)}
            style={styles.picker}
            itemStyle={[styles.pickerItem, { color: colors.primary }]}
          >
            {dayOptions.map((numDays) => (
              <Picker.Item
                key={numDays}
                label={numDays.toString()}
                value={numDays}
              />
            ))}
          </Picker>
          <Text style={[styles.daysLabel, { color: colors.text }]}>days</Text>
        </View>
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={[styles.infoText, { color: colors.primary }]}>
          Don't worry—you can adjust this later if needed
        </Text>
      </View>
    </ScrollView>
  );
};

export default TrainingDaysStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  picker: {
    width: 120,
    height: 200,
  },
  pickerItem: {
    fontSize: 48,
    fontWeight: '700',
    height: 200,
  },
  daysLabel: {
    fontSize: 32,
    fontWeight: '600',
    marginLeft: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
