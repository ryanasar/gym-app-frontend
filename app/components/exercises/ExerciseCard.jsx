import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { getMuscleInfo } from '../../data/exercises/muscleGroups';

const ExerciseCard = ({ exercise, onPress, showMuscles = true, compact = false }) => {
  const {
    name,
    primaryMuscles,
    secondaryMuscles,
    equipment,
    difficulty,
    category
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
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.8}
    >

      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.exerciseName} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.categoryBadge]}>
              <Text style={styles.categoryText}>
                {categoryIcon[category]} {category}
              </Text>
            </View>
          </View>
        </View>

        {/* Equipment & Difficulty */}
        <View style={styles.metaInfo}>
          <Text style={styles.equipment}>
            🏋️ {equipment.replace('_', ' ')}
          </Text>
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor[difficulty] }]}>
            <Text style={styles.difficultyText}>
              {difficulty}
            </Text>
          </View>
        </View>

        {/* Muscle Groups */}
        {showMuscles && (
          <View style={styles.muscleContainer}>
            <Text style={styles.muscleLabel}>Primary:</Text>
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
                <Text style={styles.muscleLabel}>Secondary:</Text>
                <View style={styles.muscleList}>
                  {secondaryMuscles.map((muscle, index) => {
                    const muscleInfo = getMuscleInfo(muscle);
                    return (
                      <View
                        key={index}
                        style={[styles.muscleBadge, styles.secondaryMuscle]}
                      >
                        <Text style={styles.secondaryMuscleText}>
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
  badges: {
    alignItems: 'flex-end',
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