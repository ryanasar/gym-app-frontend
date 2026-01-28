import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import SimpleLineChart from './SimpleLineChart';

const ExerciseOneRMCard = ({ exerciseName, data }) => {
  const colors = useThemeColors();

  const latestValue = data && data.length > 0 ? data[data.length - 1].value : null;
  const chartData = data ? data.map(e => ({ value: e.value })) : [];

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{exerciseName}</Text>
        {latestValue !== null ? (
          <Text style={[styles.cardSubtitle, { color: colors.secondaryText }]}>
            Est. 1RM: {latestValue} lbs
          </Text>
        ) : (
          <Text style={[styles.cardSubtitle, { color: colors.secondaryText }]}>
            No data yet
          </Text>
        )}
      </View>

      {chartData.length > 0 ? (
        <SimpleLineChart
          data={chartData}
          lineColor={colors.accent}
          colors={colors}
        />
      ) : (
        <View style={[styles.emptyChart, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Complete a workout to see data
          </Text>
        </View>
      )}
    </View>
  );
};

export default ExerciseOneRMCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyChart: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
