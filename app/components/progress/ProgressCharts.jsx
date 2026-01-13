import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 80;
const chartHeight = 180;

const ProgressCharts = ({ weightData = [], oneRMData = [], volumeData = [] }) => {
  const [weightTimeframe, setWeightTimeframe] = useState('3M');
  const [oneRMTimeframe, setOneRMTimeframe] = useState('3M');
  const [volumeTimeframe, setVolumeTimeframe] = useState('3M');

  const TimeframeToggle = ({ timeframe, setTimeframe }) => (
    <View style={styles.timeframeToggle}>
      {['1M', '3M', '6M', '1Y'].map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.timeframeButton,
            timeframe === option && styles.timeframeButtonActive
          ]}
          onPress={() => setTimeframe(option)}
        >
          <Text
            style={[
              styles.timeframeButtonText,
              timeframe === option && styles.timeframeButtonTextActive
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const SimpleLineChart = ({ data, color = Colors.light.primary }) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No data available</Text>
        </View>
      );
    }

    // Calculate min and max values for scaling
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Generate points for the line
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((item.value - minValue) / range) * (chartHeight - 40);
      return { x, y };
    });

    return (
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>{Math.round(maxValue)}</Text>
          <Text style={styles.axisLabel}>{Math.round((maxValue + minValue) / 2)}</Text>
          <Text style={styles.axisLabel}>{Math.round(minValue)}</Text>
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, { top: '50%' }]} />
          <View style={[styles.gridLine, { top: '100%' }]} />

          {/* Data points */}
          {points.map((point, index) => (
            <View
              key={index}
              style={[
                styles.dataPoint,
                {
                  left: point.x,
                  top: point.y,
                  backgroundColor: color,
                }
              ]}
            />
          ))}

          {/* Connect lines between points */}
          {points.map((point, index) => {
            if (index === points.length - 1) return null;
            const nextPoint = points[index + 1];
            const length = Math.sqrt(
              Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
            );
            const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);

            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.dataLine,
                  {
                    left: point.x,
                    top: point.y,
                    width: length,
                    transform: [{ rotate: `${angle}deg` }],
                    backgroundColor: color,
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Weight Over Time Chart */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Weight Over Time</Text>
            <Text style={styles.cardSubtitle}>Track your strength progression</Text>
          </View>
          <TimeframeToggle timeframe={weightTimeframe} setTimeframe={setWeightTimeframe} />
        </View>
        <SimpleLineChart data={weightData} color={Colors.light.primary} />
      </View>

      {/* Estimated 1RM Trend */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Estimated 1RM Trend</Text>
            <Text style={styles.cardSubtitle}>Your maximum strength estimate</Text>
          </View>
          <TimeframeToggle timeframe={oneRMTimeframe} setTimeframe={setOneRMTimeframe} />
        </View>
        <SimpleLineChart data={oneRMData} color="#FF6B6B" />
      </View>

      {/* Weekly Volume */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Weekly Volume</Text>
            <Text style={styles.cardSubtitle}>Total weight lifted per week</Text>
          </View>
          <TimeframeToggle timeframe={volumeTimeframe} setTimeframe={setVolumeTimeframe} />
        </View>
        <SimpleLineChart data={volumeData} color="#4ECDC4" />
      </View>
    </View>
  );
};

export default ProgressCharts;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6E6E6E',
    fontWeight: '500',
  },
  timeframeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.borderLight,
    borderRadius: 8,
    padding: 2,
  },
  timeframeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  timeframeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  timeframeButtonTextActive: {
    color: Colors.light.onPrimary,
  },
  chartContainer: {
    flexDirection: 'row',
    height: chartHeight,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingVertical: 20,
    width: 40,
  },
  axisLabel: {
    fontSize: 11,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.light.borderLight,
    top: 0,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  dataLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  emptyChart: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
  },
  emptyChartText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
});
