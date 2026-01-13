import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

const ViewSplitScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const splitData = params.splitData ? JSON.parse(params.splitData) : null;

  if (!splitData) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Split Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Split not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Split Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Split Header Card */}
          <View style={styles.splitHeaderCard}>
            <View style={styles.splitHeaderContent}>
              <Text style={styles.splitEmoji}>{splitData.emoji}</Text>
              <View style={styles.splitHeaderText}>
                <Text style={styles.splitName}>{splitData.name}</Text>
                <Text style={styles.splitDescription}>
                  {splitData.totalDays} day split
                  {splitData.description ? ` • ${splitData.description}` : ''}
                </Text>
                {splitData.workoutDays && splitData.workoutDays.length > 0 && (
                  <Text style={styles.workoutNamesList}>
                    {splitData.workoutDays.map(day => day.name).filter(Boolean).join(' • ')}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Workout Days */}
          <View style={styles.workoutsSection}>
            <Text style={styles.sectionTitle}>All Workouts</Text>

            {splitData.workoutDays && splitData.workoutDays.length > 0 ? (
              splitData.workoutDays.map((day, index) => (
                <View key={index} style={styles.workoutDayCard}>
                  {/* Day Header */}
                  <View style={[
                    styles.workoutDayHeader,
                    (!day.exercises || day.exercises.length === 0) && styles.workoutDayHeaderNoMargin
                  ]}>
                    <View style={styles.dayNumberBadge}>
                      <Text style={styles.dayNumberText}>Day {index + 1}</Text>
                    </View>
                    <Text style={styles.workoutDayName}>
                      {day.isRest || (!day.name && (!day.exercises || day.exercises.length === 0))
                        ? 'Rest Day'
                        : day.name || 'Workout'}
                    </Text>
                  </View>

                  {/* Exercises List */}
                  {day.exercises && day.exercises.length > 0 && (
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
                            {exercise.restTime && (
                              <Text style={styles.exerciseDetail}>
                                {exercise.restTime} rest
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No workouts in this split</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewSplitScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 28,
    color: Colors.light.text,
    fontWeight: '300',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // Split Header Card
  splitHeaderCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  splitHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  splitHeaderText: {
    flex: 1,
  },
  splitName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  splitDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
    marginBottom: 8,
  },
  workoutNamesList: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Workouts Section
  workoutsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 16,
  },
  workoutDayCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  workoutDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutDayHeaderNoMargin: {
    marginBottom: 0,
  },
  dayNumberBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.onPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutDayName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  exercisesList: {
    marginTop: 4,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight + '40',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  exerciseDetail: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    backgroundColor: Colors.light.borderLight + '60',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
});
