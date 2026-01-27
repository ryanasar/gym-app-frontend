import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import ModalHeader from '../ui/ModalHeader';
import Button from '../ui/Button';

const BeginSplitCard = ({ split, onDaySelected }) => {
  const colors = useThemeColors();
  const [showDayPicker, setShowDayPicker] = useState(false);

  const handleBeginSplit = () => {
    setShowDayPicker(true);
  };

  const handleDaySelect = async (dayIndex) => {
    try {
      // Notify parent to set the selected day (parent handles backend update)
      onDaySelected(dayIndex);
      setShowDayPicker(false);
    } catch (error) {
      console.error('Failed to start split:', error);
      Alert.alert('Error', 'Failed to start split. Please try again.');
    }
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        {/* Split Header */}
        <View style={styles.header}>
          <View style={[styles.emojiCircle, { backgroundColor: colors.primary + '15' }]}>
            <Text style={styles.emoji}>{split.emoji || '💪'}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.splitName, { color: colors.text }]}>{split.name}</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Ready to get started?</Text>
          </View>
        </View>

        {/* Description */}
        {split.description && (
          <Text style={[styles.description, { color: colors.text }]}>{split.description}</Text>
        )}

        {/* Split Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.secondaryText} />
            <Text style={[styles.infoText, { color: colors.secondaryText }]}>{split.numDays || split.totalDays} days</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="barbell-outline" size={16} color={colors.secondaryText} />
            <Text style={[styles.infoText, { color: colors.secondaryText }]}>
              {split.workoutDays?.filter(d => !d.isRest).length || 0} workouts
            </Text>
          </View>
        </View>

        {/* Begin Button */}
        <Button
          title="Begin Split"
          icon="play-circle"
          onPress={handleBeginSplit}
          size="lg"
          style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
        />
      </View>

      {/* Day Picker Modal */}
      <Modal
        visible={showDayPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <ModalHeader title="Choose Starting Day" onClose={() => setShowDayPicker(false)} />

            <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>
              Select which day you'd like to start with
            </Text>

            {/* Day List */}
            <ScrollView
              style={styles.dayList}
              showsVerticalScrollIndicator={false}
            >
              {split.days?.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayCard, { backgroundColor: colors.background, borderColor: colors.borderLight }]}
                  onPress={() => handleDaySelect(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayCardContent}>
                    {day.emoji && <Text style={styles.dayEmoji}>{day.emoji}</Text>}
                    <View style={styles.dayInfo}>
                      <Text style={[styles.dayName, { color: colors.text }]}>
                        {day.isRest ? 'Rest Day' : (day.name || `Day ${index + 1}`)}
                      </Text>
                      {!day.isRest && day.exercises && (
                        <Text style={[styles.dayExercises, { color: colors.secondaryText }]}>
                          {day.exercises.length} exercises
                        </Text>
                      )}
                    </View>
                  </View>
                  {day.isRest && (
                    <View style={[styles.restBadge, { backgroundColor: colors.borderLight + '40' }]}>
                      <Ionicons name="moon" size={14} color={colors.secondaryText} />
                      <Text style={[styles.restBadgeText, { color: colors.secondaryText }]}>Rest</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>
              )) || split.workoutDays?.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dayCard, { backgroundColor: colors.background, borderColor: colors.borderLight }]}
                  onPress={() => handleDaySelect(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayCardContent}>
                    {day.emoji && <Text style={styles.dayEmoji}>{day.emoji}</Text>}
                    <View style={styles.dayInfo}>
                      <Text style={[styles.dayName, { color: colors.text }]}>
                        {day.isRest ? 'Rest Day' : (day.workoutName || `Day ${index + 1}`)}
                      </Text>
                      {!day.isRest && day.exercises && (
                        <Text style={[styles.dayExercises, { color: colors.secondaryText }]}>
                          {JSON.parse(day.exercises || '[]').length} exercises
                        </Text>
                      )}
                    </View>
                  </View>
                  {day.isRest && (
                    <View style={[styles.restBadge, { backgroundColor: colors.borderLight + '40' }]}>
                      <Ionicons name="moon" size={14} color={colors.secondaryText} />
                      <Text style={[styles.restBadgeText, { color: colors.secondaryText }]}>Rest</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default BeginSplitCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14,
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  splitName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalSubtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayList: {
    paddingHorizontal: 20,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  dayCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dayEmoji: {
    fontSize: 24,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayExercises: {
    fontSize: 13,
    fontWeight: '500',
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  restBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
