import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';
import Badge from '../ui/Badge';

const SplitCard = ({ split, onPress, onDelete, showDelete = false }) => {
  const colors = useThemeColors();
  const { name, totalDays, emoji, isActive, workoutDays } = split;

  // Get list of workout names
  const workoutNames = workoutDays?.map(day => day.name).filter(Boolean).join(' • ') || '';

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(split);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.cardBackground, borderColor: colors.borderLight, shadowColor: colors.shadow },
        isActive && [styles.activeCard, { borderColor: colors.primary }]
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.splitInfo}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View style={styles.splitText}>
            <View style={styles.splitHeader}>
              <Text style={[styles.splitName, { color: colors.text }]}>{name}</Text>
              {isActive && <Badge label="ACTIVE" color={colors.primary} size="sm" />}
            </View>
            <Text style={[styles.splitDays, { color: colors.secondaryText }]}>{totalDays} days</Text>
            {workoutNames && <Text style={[styles.workoutNames, { color: colors.secondaryText }]} numberOfLines={1}>{workoutNames}</Text>}
          </View>
        </View>

        <View style={styles.actions}>
          {showDelete && !isActive && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
          <View style={styles.arrow}>
            <Text style={[styles.arrowText, { color: colors.secondaryText }]}>→</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SplitCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  activeCard: {
    borderColor: Colors.light.primary,
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  splitText: {
    flex: 1,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  splitName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 8,
  },
  splitDays: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  workoutNames: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  arrow: {
    marginLeft: 4,
  },
  arrowText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
  },
});