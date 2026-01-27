import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getMuscleInfo } from '../../data/exercises/muscleGroups';
import Badge from '../ui/Badge';

// Helper to format equipment names: "pull_up_bar" → "Pull Up Bar"
const formatEquipmentName = (equipment) => {
  if (!equipment) return '';
  return equipment
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const ExerciseCard = ({ exercise, onPress, showMuscles = true, compact = false, showCategory = true, isCustom = false, style }) => {
  const colors = useThemeColors();
  const {
    name,
    primaryMuscles = [],
    secondaryMuscles = [],
    equipment = 'unknown',
    difficulty = 'intermediate',
    category = 'compound'
  } = exercise;

  const primaryMuscleInfo = primaryMuscles.map(muscle => getMuscleInfo(muscle));
  const difficultyColor = {
    beginner: '#4ECDC4',
    intermediate: '#FECA57',
    advanced: '#FF6B6B'
  };

  const categoryIcon = {
    compound: '🔗',
    isolation: '🎯'
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground, shadowColor: colors.shadow, borderColor: colors.borderLight },
        compact && styles.compactCard,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >

      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={2}>
            {name}
          </Text>
          {showCategory && (
            <Badge label={`${categoryIcon[category]} ${category}`} size="sm" />
          )}
        </View>

        {/* Equipment & Difficulty/Custom Badge */}
        <View style={styles.metaInfo}>
          <Text style={[styles.equipment, { color: colors.secondaryText }]}>
            🏋️ {formatEquipmentName(equipment)}
          </Text>
          {isCustom ? (
            <Badge label="Custom" color={colors.accent} size="sm" />
          ) : (
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor[difficulty] }]}>
              <Text style={styles.difficultyText}>
                {difficulty}
              </Text>
            </View>
          )}
        </View>

        {/* Muscle Groups */}
        {showMuscles && (
          <View style={styles.muscleContainer}>
            <Text style={[styles.muscleLabel, { color: colors.text }]}>Primary:</Text>
            <View style={styles.muscleList}>
              {primaryMuscleInfo.map((muscle, index) => (
                <Badge key={index} label={`${muscle?.icon} ${muscle?.name}`} color={muscle?.color} size="sm" />
              ))}
            </View>

            {secondaryMuscles.length > 0 && !compact && (
              <>
                <Text style={[styles.muscleLabel, { color: colors.text }]}>Secondary:</Text>
                <View style={styles.muscleList}>
                  {secondaryMuscles.map((muscle, index) => {
                    const muscleInfo = getMuscleInfo(muscle);
                    return (
                      <View
                        key={index}
                        style={[styles.secondaryMuscle, { backgroundColor: colors.borderLight }]}
                      >
                        <Text style={[styles.secondaryMuscleText, { color: colors.secondaryText }]}>
                          {muscleInfo?.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ExerciseCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  compactCard: {
    padding: 12,
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  equipment: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  muscleContainer: {
    marginTop: 8,
  },
  muscleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  muscleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  secondaryMuscle: {
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  secondaryMuscleText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
});