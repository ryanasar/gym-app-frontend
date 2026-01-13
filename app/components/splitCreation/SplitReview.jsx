import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';

const SplitReview = ({ splitData }) => {
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Review Your Split</Text>
        <Text style={styles.sectionDescription}>
          Review all the details of your split before creating it.
        </Text>

        {/* Split Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.splitHeader}>
            <Text style={styles.splitEmoji}>{splitData.emoji}</Text>
            <View style={styles.splitInfo}>
              <Text style={styles.splitName}>{splitData.name}</Text>
              <Text style={styles.splitDescription}>{splitData.description}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{splitData.totalDays}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{getWorkoutDaysCount()}</Text>
              <Text style={styles.statLabel}>Workout Days</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{getRestDaysCount()}</Text>
              <Text style={styles.statLabel}>Rest Days</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{getTotalExercises()}</Text>
              <Text style={styles.statLabel}>Total Exercises</Text>
            </View>
          </View>

          <View style={styles.visibility}>
            <Text style={styles.visibilityLabel}>Visibility:</Text>
            <Text style={[
              styles.visibilityStatus,
              { color: splitData.isPublic ? Colors.light.primary : Colors.light.secondaryText }
            ]}>
              {splitData.isPublic ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>

        {/* Day by Day Breakdown */}
        <Text style={styles.breakdownTitle}>Day-by-Day Breakdown</Text>

        {splitData.workoutDays.map((day, index) => (
          <View key={index} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={styles.dayInfo}>
                <Text style={styles.dayNumber}>Day {index + 1}</Text>
                <Text style={styles.dayType}>
                  {day.emoji} {day.workoutName || 'Unnamed Workout'}
                </Text>
                {day.workoutDescription && (
                  <Text style={styles.dayDescription}>{day.workoutDescription}</Text>
                )}
              </View>
              {day.isRest && (
                <View style={styles.restBadge}>
                  <Text style={styles.restText}>Rest Day</Text>
                </View>
              )}
            </View>

            {!day.isRest && day.exercises && day.exercises.length > 0 && (
              <View style={styles.exercisesList}>
                <Text style={styles.exercisesTitle}>
                  Exercises ({day.exercises.length})
                </Text>

                {day.exercises.map((exercise, exerciseIndex) => (
                  <View key={exerciseIndex} style={styles.exerciseItem}>
                    <Text style={styles.exerciseName}>
                      {exerciseIndex + 1}. {exercise.name}
                    </Text>
                    <View style={styles.exerciseDetails}>
                      {exercise.sets && (
                        <Text style={styles.exerciseDetail}>
                          {exercise.sets} sets
                        </Text>
                      )}
                      {exercise.reps && (
                        <Text style={styles.exerciseDetail}>
                          {exercise.reps} reps
                        </Text>
                      )}
                      {exercise.weight && (
                        <Text style={styles.exerciseDetail}>
                          {exercise.weight}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {!day.isRest && (!day.exercises || day.exercises.length === 0) && (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>No exercises added yet</Text>
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
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 24,
    lineHeight: 20,
  },
  overviewCard: {
    backgroundColor: Colors.light.cardBackground,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    color: Colors.light.text,
    marginBottom: 4,
  },
  splitDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    lineHeight: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.borderLight,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  visibility: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 8,
  },
  visibilityStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    color: Colors.light.secondaryText,
    marginBottom: 2,
  },
  dayType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  dayDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginTop: 4,
    lineHeight: 18,
  },
  restBadge: {
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  restText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
  exercisesList: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingTop: 12,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  exerciseItem: {
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseDetail: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyDay: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingTop: 12,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: Colors.light.primary + '10',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary + '30',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.light.text,
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