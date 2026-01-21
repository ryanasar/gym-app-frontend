import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getMuscleInfo } from '../../data/exercises/muscleGroups';

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
            <View style={[styles.categoryBadge, { backgroundColor: colors.borderLight }]}>
              <Text style={[styles.categoryText, { color: colors.secondaryText }]}>
                {categoryIcon[category]} {category}
              </Text>
            </View>
          )}
        </View>

        {/* Equipment & Difficulty/Custom Badge */}
        <View style={styles.metaInfo}>
          <Text style={[styles.equipment, { color: colors.secondaryText }]}>
            🏋️ {formatEquipmentName(equipment)}
          </Text>
          {isCustom ? (
            <View style={[styles.customBadge, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.customBadgeText, { color: colors.accent }]}>
                Custom
              </Text>
            </View>
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
                <View
                  key={index}
                  style={[styles.muscleBadge, { backgroundColor: muscle?.color + '20' }]}
                >
                  <Text style={[styles.muscleText, { color: muscle?.color }]}>
                    {muscle?.icon} {muscle?.name}
                  </Text>
                </View>
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
                        style={[styles.muscleBadge, styles.secondaryMuscle, { backgroundColor: colors.borderLight }]}
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
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  customBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: Colors.light.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.secondaryText,
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
  muscleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  muscleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  secondaryMuscle: {
    backgroundColor: Colors.light.borderLight,
  },
  secondaryMuscleText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
});