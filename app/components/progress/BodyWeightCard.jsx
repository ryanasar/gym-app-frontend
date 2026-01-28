import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import SimpleLineChart from './SimpleLineChart';
import LogWeightModal from './LogWeightModal';

const BodyWeightCard = ({ data, onLogWeight }) => {
  const colors = useThemeColors();
  const [modalVisible, setModalVisible] = useState(false);

  const latestWeight = data && data.length > 0 ? data[data.length - 1].weight : null;
  const chartData = data ? data.map(e => ({ value: e.weight })) : [];

  const handleSave = (weight) => {
    onLogWeight(weight);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Body Weight</Text>
          {latestWeight !== null ? (
            <Text style={[styles.cardSubtitle, { color: colors.secondaryText }]}>
              {latestWeight} lbs
            </Text>
          ) : (
            <Text style={[styles.cardSubtitle, { color: colors.secondaryText }]}>
              No entries yet
            </Text>
          )}
        </View>
      </View>

      {chartData.length > 0 ? (
        <SimpleLineChart
          data={chartData}
          lineColor={colors.primary}
          colors={colors}
        />
      ) : (
        <View style={[styles.emptyChart, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Log your weight to start tracking
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
