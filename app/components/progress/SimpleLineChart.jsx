import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const defaultChartWidth = screenWidth - 120;
const Y_AXIS_WIDTH = 40;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `${month}/${day}`;
};

const SimpleLineChart = ({ data, lineColor, colors, chartHeight = 160 }) => {
  const chartWidth = defaultChartWidth;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyChart, { height: chartHeight, backgroundColor: colors.background }]}>
        <Text style={[styles.emptyChartText, { color: colors.secondaryText }]}>No data available</Text>
      </View>
    );
  }

  const values = data.map(d => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const isSingleValue = rawMin === rawMax;

  const padding = isSingleValue ? Math.max(rawMax * 0.1, 5) : 0;
  const minValue = rawMin - padding;
  const maxValue = rawMax + padding;
  const range = maxValue - minValue;

  const singlePoint = data.length === 1;

  const points = data.map((item, index) => {
    const x = singlePoint ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item.value - minValue) / range) * (chartHeight - 40);
    return { x, y, value: item.value };
  });

  // Pick X-axis date labels: first, middle (if 3+), last
  const dateLabels = [];
  if (data.length === 1) {
    dateLabels.push({ label: formatDate(data[0].date), x: points[0].x });
  } else if (data.length === 2) {
    dateLabels.push({ label: formatDate(data[0].date), x: points[0].x, align: 'left' });
    dateLabels.push({ label: formatDate(data[data.length - 1].date), x: points[points.length - 1].x, align: 'right' });
  } else {
    const midIdx = Math.floor(data.length / 2);
    dateLabels.push({ label: formatDate(data[0].date), x: points[0].x, align: 'left' });
    dateLabels.push({ label: formatDate(data[midIdx].date), x: points[midIdx].x, align: 'center' });
    dateLabels.push({ label: formatDate(data[data.length - 1].date), x: points[points.length - 1].x, align: 'right' });
  }

  return (
    <View>
      <View style={[styles.chartContainer, { height: chartHeight }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          <Text style={[styles.axisLabel, { color: colors.secondaryText }]}>{Math.round(maxValue)}</Text>
          <Text style={[styles.axisLabel, { color: colors.secondaryText }]}>{Math.round((maxValue + minValue) / 2)}</Text>
          <Text style={[styles.axisLabel, { color: colors.secondaryText }]}>{Math.round(minValue)}</Text>
        </View>

        {/* Chart area */}
        <View style={[styles.chartArea, { backgroundColor: colors.background }]}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { backgroundColor: colors.borderLight }]} />
          <View style={[styles.gridLine, { top: '50%', backgroundColor: colors.borderLight }]} />
          <View style={[styles.gridLine, { top: '100%', backgroundColor: colors.borderLight }]} />

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
                    backgroundColor: lineColor,
                  }
                ]}
              />
            );
          })}

          {/* Data points */}
          {points.map((point, index) => (
            <View
              key={index}
              style={[
                singlePoint ? styles.dataPointLarge : styles.dataPoint,
                {
                  left: point.x,
                  top: point.y,
                  backgroundColor: lineColor,
                }
              ]}
            />
          ))}

          {/* Value label for single data point */}
          {singlePoint && points[0] && (
            <Text
              style={[
                styles.singleValueLabel,
                { left: points[0].x + 12, top: points[0].y - 8, color: lineColor },
              ]}
            >
              {Math.round(points[0].value)}
            </Text>
          )}
        </View>
      </View>

      {/* X-axis date labels */}
      <View style={styles.xAxisRow}>
        <View style={styles.xAxisSpacer} />
        <View style={styles.xAxisLabels}>
          {dateLabels.map((dl, i) => (
            <Text
              key={i}
              style={[
                styles.xAxisLabel,
                {
                  left: dl.x,
                  color: colors.secondaryText,
                  textAlign: dl.align || 'center',
                },
              ]}
            >
              {dl.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

export default SimpleLineChart;

const styles = StyleSheet.create({
  chartContainer: {
    flexDirection: 'row',
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingVertical: 20,
    width: Y_AXIS_WIDTH,
  },
  axisLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    borderRadius: 12,
    padding: 20,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
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
  dataPointLarge: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    marginTop: -6,
  },
  singleValueLabel: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '700',
  },
  dataLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  xAxisRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  xAxisSpacer: {
    width: Y_AXIS_WIDTH,
  },
  xAxisLabels: {
    flex: 1,
    position: 'relative',
    height: 16,
    marginHorizontal: 20,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '500',
    transform: [{ translateX: '-50%' }],
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyChartText: {
    fontSize: 14,
  },
});
