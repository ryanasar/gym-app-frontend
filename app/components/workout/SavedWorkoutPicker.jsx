import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * Compact picker for saved workouts - shows emoji, name, and exercise count
 * Used in workout tab for quick access to saved workouts
 */
const SavedWorkoutPicker = ({ workouts = [], onSelect }) => {
  const colors = useThemeColors();

  if (!workouts || workouts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {workouts.map((workout) => (
        <TouchableOpacity
          key={workout.id}
          style={[
            styles.workoutCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }
          ]}
          onPress={() => onSelect(workout)}
          activeOpacity={0.7}
        >
          <View style={[styles.emojiContainer, { backgroundColor: colors.borderLight + '60' }]}>
            <Text style={styles.emoji}>{workout.emoji || '💪'}</Text>
          </View>
          <View style={styles.content}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {workout.name}
            </Text>
            <Text style={[styles.exerciseCount, { color: colors.secondaryText }]}>
              {workout.exercises?.length || 0} exercises
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  exerciseCount: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
});

export default SavedWorkoutPicker;
