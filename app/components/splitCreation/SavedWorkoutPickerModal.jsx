import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import EmptyState from '../common/EmptyState';

const SavedWorkoutPickerModal = ({
  visible,
  onClose,
  savedWorkouts,
  loading,
  onSelectWorkout
}) => {
  const colors = useThemeColors();

  const renderWorkoutItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.workoutItem, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
      onPress={() => onSelectWorkout(item)}
      activeOpacity={0.7}
    >
      <View style={styles.workoutItemContent}>
        <Text style={styles.workoutEmoji}>{item.emoji || '💪'}</Text>
        <View style={styles.workoutInfo}>
          <Text style={[styles.workoutName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.workoutDetails, { color: colors.secondaryText }]}>
            {item.exercises?.length || 0} exercises
            {item.workoutType ? ` • ${item.workoutType}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Saved Workouts</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading workouts...</Text>
          </View>
        ) : savedWorkouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              emoji="📁"
              title="No saved workouts"
              message="Save workouts from your splits to reuse them later"
            />
          </View>
        ) : (
          <FlatList
            data={savedWorkouts}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkoutItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
  },
  workoutItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  workoutItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 13,
  },
});

export default SavedWorkoutPickerModal;
