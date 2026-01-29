import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import SimpleLineChart from './SimpleLineChart';
import TimeRangeToggle from './TimeRangeToggle';
import { filterDataByRange, calculateChange, formatLastLogged } from '../../utils/timeRangeUtils';

const ExerciseOneRMCard = ({ exerciseName, data }) => {
  const colors = useThemeColors();
  const [selectedRange, setSelectedRange] = useState('All');

  const filteredData = useMemo(() => {
    const chartData = data ? data.map(e => ({ value: e.value, date: e.date })) : [];
    return filterDataByRange(chartData, selectedRange);
  }, [data, selectedRange]);

  const allData = data ? data.map(e => ({ value: e.value, date: e.date })) : [];
  const latestValue = allData.length > 0 ? allData[allData.length - 1].value : null;
  const lastLoggedDate = allData.length > 0 ? allData[allData.length - 1].date : null;
  const change = calculateChange(filteredData);

  // Green if positive, grey if zero/negative
  const changeColor = change !== null && change > 0 ? colors.accent : colors.secondaryText;

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{exerciseName}</Text>
        <TimeRangeToggle selectedRange={selectedRange} onRangeChange={setSelectedRange} />
      </View>

      <View style={styles.statsContainer}>
        {latestValue !== null ? (
          <>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Est. 1RM</Text>
              <Text style={[styles.lastLogged, { color: colors.secondaryText }]}>
                Last logged: {formatLastLogged(lastLoggedDate)}
              </Text>
            </View>
            <Text style={[styles.mainValue, { color: colors.text }]}>
              {latestValue} lbs
            </Text>
            {change !== null && (
              <Text style={[styles.changeIndicator, { color: changeColor }]}>
                {change >= 0 ? '+' : ''}{change} lbs
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.noData, { color: colors.secondaryText }]}>
            No data yet
          </Text>
        )}
      </View>

      {filteredData.length > 0 ? (
        <SimpleLineChart
          data={filteredData}
          lineColor={colors.accent}
          colors={colors}
        />
      ) : (
        <View style={[styles.emptyChart, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            {allData.length > 0 ? 'No data in selected range' : 'Complete a workout to see data'}
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statsContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  mainValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  changeIndicator: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  lastLogged: {
    fontSize: 13,
  },
  noData: {
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
