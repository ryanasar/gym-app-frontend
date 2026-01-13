import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../constants/colors';

const TrainingDaysStep = ({ splitData, updateSplitData }) => {
  const dayOptions = [3, 4, 5, 6, 7, 8, 9, 10];

  const handleSelectDays = (numDays) => {
    updateSplitData({ totalDays: numDays });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Split Length</Text>
        <Text style={styles.subtitle}>
          Choose the total length of your split (including rest days)
        </Text>
      </View>

      {/* Picker Container */}
      <View style={styles.pickerContainer}>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={splitData.totalDays}
            onValueChange={(value) => handleSelectDays(value)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {dayOptions.map((numDays) => (
              <Picker.Item
                key={numDays}
                label={numDays.toString()}
                value={numDays}
              />
            ))}
          </Picker>
          <Text style={styles.daysLabel}>days</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
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
    backgroundColor: Colors.light.background,
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
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.secondaryText,
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
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 8,
    shadowColor: Colors.light.shadow,
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
    color: Colors.light.primary,
    height: 200,
  },
  daysLabel: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
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
    color: Colors.light.primary,
    fontWeight: '500',
    lineHeight: 20,
  },
});
