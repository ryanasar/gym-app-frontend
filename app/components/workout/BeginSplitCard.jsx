import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const BeginSplitCard = ({ split, onDaySelected }) => {
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
      <View style={styles.card}>
        {/* Split Header */}
        <View style={styles.header}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>{split.emoji || '💪'}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.splitName}>{split.name}</Text>
            <Text style={styles.subtitle}>Ready to get started?</Text>
          </View>
        </View>

        {/* Description */}
        {split.description && (
          <Text style={styles.description}>{split.description}</Text>
        )}

        {/* Split Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color={Colors.light.secondaryText} />
            <Text style={styles.infoText}>{split.numDays || split.totalDays} days</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="barbell-outline" size={16} color={Colors.light.secondaryText} />
            <Text style={styles.infoText}>
              {split.workoutDays?.filter(d => !d.isRest).length || 0} workouts
            </Text>
          </View>
        </View>

        {/* Begin Button */}
        <TouchableOpacity
          style={styles.beginButton}
          onPress={handleBeginSplit}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={24} color="#FFFFFF" />
          <Text style={styles.beginButtonText}>Begin Split</Text>
        </TouchableOpacity>
      </View>

      {/* Day Picker Modal */}
      <Modal
        visible={showDayPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Starting Day</Text>
              <TouchableOpacity
                onPress={() => setShowDayPicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
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
                  style={styles.dayCard}
                  onPress={() => handleDaySelect(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayCardContent}>
                    {day.emoji && <Text style={styles.dayEmoji}>{day.emoji}</Text>}
                    <View style={styles.dayInfo}>
                      <Text style={styles.dayName}>
                        {day.isRest ? 'Rest Day' : (day.name || `Day ${index + 1}`)}
                      </Text>
                      {!day.isRest && day.exercises && (
                        <Text style={styles.dayExercises}>
                          {day.exercises.length} exercises
                        </Text>
                      )}
                    </View>
                  </View>
                  {day.isRest && (
                    <View style={styles.restBadge}>
                      <Ionicons name="moon" size={14} color={Colors.light.secondaryText} />
                      <Text style={styles.restBadgeText}>Rest</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
              )) || split.workoutDays?.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dayCard}
                  onPress={() => handleDaySelect(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayCardContent}>
                    {day.emoji && <Text style={styles.dayEmoji}>{day.emoji}</Text>}
                    <View style={styles.dayInfo}>
                      <Text style={styles.dayName}>
                        {day.isRest ? 'Rest Day' : (day.workoutName || `Day ${index + 1}`)}
                      </Text>
                      {!day.isRest && day.exercises && (
                        <Text style={styles.dayExercises}>
                          {JSON.parse(day.exercises || '[]').length} exercises
                        </Text>
                      )}
                    </View>
                  </View>
                  {day.isRest && (
                    <View style={styles.restBadge}>
                      <Ionicons name="moon" size={14} color={Colors.light.secondaryText} />
                      <Text style={styles.restBadgeText}>Rest</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
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
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
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
    backgroundColor: Colors.light.primary + '15',
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
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: Colors.light.text,
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
    color: Colors.light.secondaryText,
  },
  beginButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  beginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayList: {
    paddingHorizontal: 20,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
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
    color: Colors.light.text,
    marginBottom: 2,
  },
  dayExercises: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.borderLight + '40',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  restBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.secondaryText,
  },
});
