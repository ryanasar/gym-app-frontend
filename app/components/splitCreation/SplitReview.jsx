import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

const SplitReview = ({ splitData }) => {
  const colors = useThemeColors();

  const getTotalExercises = () => {
    return splitData.workoutDays.reduce((total, day) => {
      return total + (day.exercises ? day.exercises.length : 0);
    }, 0);
  };

  const getWorkoutDaysCount = () => {
    return splitData.workoutDays.filter(day => !day.isRest).length;
  };

  const getRestDaysCount = () => {
    return splitData.workoutDays.filter(day => day.isRest).length;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Review Your Split</Text>
        <Text style={[styles.sectionDescription, { color: colors.secondaryText }]}>
          Review all the details of your split before creating it.
        </Text>

        {/* Split Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.splitHeader}>
            <Text style={styles.splitEmoji}>{splitData.emoji}</Text>
            <View style={styles.splitInfo}>
              <Text style={[styles.splitName, { color: colors.text }]}>{splitData.name}</Text>
              <Text style={[styles.splitDescription, { color: colors.secondaryText }]}>{splitData.description}</Text>
            </View>
          </View>

          <View style={[styles.stats, { borderColor: colors.borderLight }]}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{splitData.totalDays}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Total Days</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{getWorkoutDaysCount()}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Workout Days</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{getRestDaysCount()}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Rest Days</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{getTotalExercises()}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Total Exercises</Text>
            </View>
          </View>

          <View style={styles.visibility}>
            <Text style={[styles.visibilityLabel, { color: colors.text }]}>Visibility:</Text>
            <Text style={[
              styles.visibilityStatus,
              { color: splitData.isPublic ? colors.primary : colors.secondaryText }
            ]}>
              {splitData.isPublic ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>

        {/* Day by Day Breakdown */}
        <Text style={[styles.breakdownTitle, { color: colors.text }]}>Day-by-Day Breakdown</Text>

        {splitData.workoutDays.map((day, index) => (
          <View key={index} style={[styles.dayCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.dayHeader}>
              <View style={styles.dayInfo}>
                <Text style={[styles.dayNumber, { color: colors.secondaryText }]}>Day {index + 1}</Text>
                <Text style={[styles.dayType, { color: colors.text }]}>
                  {day.emoji} {day.workoutName || 'Unnamed Workout'}
                </Text>
                {day.workoutDescription && (
                  <Text style={[styles.dayDescription, { color: colors.secondaryText }]}>{day.workoutDescription}</Text>
                )}
              </View>
              {day.isRest && (
                <View style={[styles.restBadge, { backgroundColor: colors.borderLight }]}>
                  <Text style={[styles.restText, { color: colors.secondaryText }]}>Rest Day</Text>
                </View>
              )}
            </View>

            {!day.isRest && day.exercises && day.exercises.length > 0 && (
              <View style={[styles.exercisesList, { borderTopColor: colors.borderLight }]}>
                <Text style={[styles.exercisesTitle, { color: colors.text }]}>
                  Exercises ({day.exercises.length})
                </Text>

                {day.exercises.map((exercise, exerciseIndex) => (
                  <View key={exerciseIndex} style={styles.exerciseItem}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exerciseIndex + 1}. {exercise.name}
                    </Text>
                    <View style={styles.exerciseDetails}>
                      {exercise.sets && (
                        <Text style={[styles.exerciseDetail, { color: colors.secondaryText, backgroundColor: colors.background }]}>
                          {exercise.sets} sets
                        </Text>
                      )}
                      {exercise.reps && (
                        <Text style={[styles.exerciseDetail, { color: colors.secondaryText, backgroundColor: colors.background }]}>
                          {exercise.reps} reps
                        </Text>
                      )}
                      {exercise.weight && (
                        <Text style={[styles.exerciseDetail, { color: colors.secondaryText, backgroundColor: colors.background }]}>
                          {exercise.weight}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!day.isRest && (!day.exercises || day.exercises.length === 0) && (
              <View style={[styles.emptyDay, { borderTopColor: colors.borderLight }]}>
                <Text style={[styles.emptyDayText, { color: colors.secondaryText }]}>No exercises added yet</Text>
              </View>
            )}
          </View>
        ))}

      </View>
    </ScrollView>
  );
};

export default SplitReview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  overviewCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  splitEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  splitInfo: {
    flex: 1,
  },
  splitName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  splitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  visibility: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  visibilityStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  dayCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayInfo: {
    flex: 1,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayType: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayDescription: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  restBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  restText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exercisesList: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseItem: {
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseDetail: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyDay: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#FF8C00',
    fontWeight: '500',
    lineHeight: 16,
  },
});
