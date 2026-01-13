import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const SplitOverviewStep = ({ splitData, updateSplitData, onEditDay }) => {
  // Initialize workout days if not already done
  useEffect(() => {
    if (splitData.workoutDays.length !== splitData.totalDays) {
      const newWorkoutDays = Array.from({ length: splitData.totalDays }, (_, index) => {
        // Check if we already have data for this day
        const existingDay = splitData.workoutDays[index];
        if (existingDay) {
          return existingDay;
        }

        // Create new day with defaults
        return {
          dayIndex: index,
          workoutName: '',
          workoutDescription: '',
          workoutType: '',
          emoji: '💪',
          isRest: false,
          exercises: []
        };
      });
      updateSplitData({ workoutDays: newWorkoutDays });
    }
  }, [splitData.totalDays]);

  const getDayStatus = (day) => {
    if (day.isRest) {
      return { label: 'Rest Day', color: Colors.light.secondaryText, icon: 'moon' };
    }
    if (day.workoutName && day.exercises && day.exercises.length > 0) {
      return { label: 'Configured', color: '#4CAF50', icon: 'checkmark-circle' };
    }
    if (day.workoutName) {
      return { label: 'In Progress', color: '#FF9800', icon: 'time' };
    }
    return { label: 'Not Set', color: Colors.light.secondaryText, icon: 'add-circle-outline' };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Build your split</Text>
        <Text style={styles.subtitle}>
          Tap each day to configure its workout
        </Text>
      </View>

      <View style={styles.daysContainer}>
        {splitData.workoutDays.map((day, index) => {
          const status = getDayStatus(day);

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayCard}
              onPress={() => onEditDay(index)}
              activeOpacity={0.7}
            >
              <View style={styles.dayCardHeader}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayNumber}>Day {index + 1}</Text>
                  {day.emoji && <Text style={styles.dayEmoji}>{day.emoji}</Text>}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                  <Ionicons name={status.icon} size={14} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={styles.dayCardContent}>
                {day.workoutName ? (
                  <>
                    <Text style={styles.dayName}>{day.workoutName}</Text>
                    {day.exercises && day.exercises.length > 0 && (
                      <Text style={styles.exerciseCount}>
                        {day.exercises.length} {day.exercises.length === 1 ? 'exercise' : 'exercises'}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.placeholder}>
                    {day.isRest ? 'Rest and recovery' : 'Tap to configure'}
                  </Text>
                )}
              </View>

              <View style={styles.dayCardFooter}>
                <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Configure all days to continue to the review step
        </Text>
      </View>
    </ScrollView>
  );
};

export default SplitOverviewStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  daysContainer: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  dayEmoji: {
    fontSize: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayCardContent: {
    marginBottom: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
  },
  dayCardFooter: {
    alignItems: 'flex-end',
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
