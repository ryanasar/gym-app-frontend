import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { useThemeColors } from '../../../hooks/useThemeColors';

const ChangeDayModal = ({ visible, onClose, activeSplit, onDaySelected }) => {
  const colors = useThemeColors();

  const days = activeSplit?.days || activeSplit?.workoutDays || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Workout Day</Text>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>
          Select which day you'd like to train today
        </Text>
        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {days.map((day, index) => {
            const isRest = day.isRest;
            const dayName = isRest ? 'Rest Day' : (day.name || day.workoutName || day.dayName || `Day ${index + 1}`);
            let exerciseCount = 0;
            if (!isRest && day.exercises) {
              try {
                exerciseCount = typeof day.exercises === 'string'
                  ? JSON.parse(day.exercises).length
                  : Array.isArray(day.exercises) ? day.exercises.length : 0;
              } catch (e) {
                exerciseCount = 0;
              }
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayPickerCard, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}
                onPress={() => onDaySelected(index)}
                activeOpacity={0.7}
              >
                <View style={styles.dayPickerCardContent}>
                  {day.emoji && <Text style={styles.dayPickerEmoji}>{day.emoji}</Text>}
                  <View style={styles.dayPickerInfo}>
                    <Text style={[styles.dayPickerName, { color: colors.text }]}>{dayName}</Text>
                    {!isRest && exerciseCount > 0 && (
                      <Text style={[styles.dayPickerExercises, { color: colors.secondaryText }]}>
                        {exerciseCount} exercises
                      </Text>
                    )}
                  </View>
                </View>
                {isRest && (
                  <View style={[styles.restDayBadge, { backgroundColor: colors.borderLight + '40' }]}>
                    <Ionicons name="moon" size={14} color={colors.secondaryText} />
                    <Text style={[styles.restDayBadgeText, { color: colors.secondaryText }]}>Rest</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ChangeDayModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  dayPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  dayPickerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dayPickerEmoji: {
    fontSize: 24,
  },
  dayPickerInfo: {
    flex: 1,
  },
  dayPickerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  dayPickerExercises: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  restDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.borderLight + '40',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  restDayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
});
