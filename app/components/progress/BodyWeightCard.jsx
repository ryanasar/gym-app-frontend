import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import SimpleLineChart from './SimpleLineChart';
import LogWeightModal from './LogWeightModal';
import TimeRangeToggle from './TimeRangeToggle';
import { filterDataByRange, calculateChange, formatLastLogged } from '../../utils/timeRangeUtils';

const BodyWeightCard = ({ data, onLogWeight }) => {
  const colors = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState('All');

  // Convert data to chart format and filter by range
  const allChartData = useMemo(() => {
    return data ? data.map(e => ({ value: e.weight, date: e.date })) : [];
  }, [data]);

  const filteredData = useMemo(() => {
    return filterDataByRange(allChartData, selectedRange);
  }, [allChartData, selectedRange]);

  const latestWeight = allChartData.length > 0 ? allChartData[allChartData.length - 1].value : null;
  const lastLoggedDate = allChartData.length > 0 ? allChartData[allChartData.length - 1].date : null;
  const change = calculateChange(filteredData);

  const handleSave = (weight) => {
    onLogWeight(weight);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Body Weight</Text>
        <TimeRangeToggle selectedRange={selectedRange} onRangeChange={setSelectedRange} />
      </View>

      <View style={styles.statsContainer}>
        {latestWeight !== null ? (
          <>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Current</Text>
              <Text style={[styles.lastLogged, { color: colors.secondaryText }]}>
                Last logged: {formatLastLogged(lastLoggedDate)}
              </Text>
            </View>
            <Text style={[styles.mainValue, { color: colors.text }]}>
              {latestWeight} lbs
            </Text>
            {change !== null && (
              <Text style={[styles.changeIndicator, { color: colors.accent }]}>
                {change >= 0 ? '+' : ''}{change} lbs
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.noData, { color: colors.secondaryText }]}>
            No entries yet
          </Text>
        )}
      </View>

      {filteredData.length > 0 ? (
        <SimpleLineChart
          data={filteredData}
          lineColor={colors.primary}
          colors={colors}
        />
      ) : (
        <View style={[styles.emptyChart, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            {allChartData.length > 0 ? 'No data in selected range' : 'Log your weight to start tracking'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.logButton, { backgroundColor: colors.primary }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={18} color={colors.onPrimary} />
        <Text style={[styles.logButtonText, { color: colors.onPrimary }]}>Log Weight</Text>
      </TouchableOpacity>

      <LogWeightModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
};

export default BodyWeightCard;

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
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 12,
  },
  logButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
