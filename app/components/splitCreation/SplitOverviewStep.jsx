import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../../constants/colors';

const generateDayId = () => `day_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const SplitOverviewStep = ({ splitData, updateSplitData, onEditDay }) => {
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Initialize workout days if not already done
  useEffect(() => {
    if (splitData.workoutDays.length !== splitData.totalDays) {
      const newWorkoutDays = Array.from({ length: splitData.totalDays }, (_, index) => {
        // Check if we already have data for this day
        const existingDay = splitData.workoutDays[index];
        if (existingDay) {
          // Ensure existing day has an ID
          return existingDay.id ? existingDay : { ...existingDay, id: generateDayId() };
        }

        // Create new day with defaults
        return {
          id: generateDayId(),
          dayIndex: index,
          workoutName: '',
          workoutDescription: '',
          workoutType: '',
          emoji: '💪',
          isRest: false,
          exercises: []
        };
      });
      updateSplitData({ workoutDays: newWorkoutDays });
    } else {
      // Ensure all existing days have IDs
      const needsIds = splitData.workoutDays.some(day => !day.id);
      if (needsIds) {
        const daysWithIds = splitData.workoutDays.map(day =>
          day.id ? day : { ...day, id: generateDayId() }
        );
        updateSplitData({ workoutDays: daysWithIds });
      }
    }
  }, [splitData.totalDays]);

  const getDayStatus = (day) => {
    if (day.isRest) {
      return { label: 'Rest Day', color: Colors.light.secondaryText, icon: 'moon' };
    }
    if (day.workoutName && day.exercises && day.exercises.length > 0) {
      return { label: 'Configured', color: '#4CAF50', icon: 'checkmark-circle' };
    }
    if (day.workoutName) {
      return { label: 'In Progress', color: '#FF9800', icon: 'time' };
    }
    return { label: 'Not Set', color: Colors.light.secondaryText, icon: 'add-circle-outline' };
  };

  const handleReorderDays = ({ data }) => {
    // Update day indices to match new order
    const reorderedDays = data.map((day, index) => ({
      ...day,
      dayIndex: index
    }));
    updateSplitData({ workoutDays: reorderedDays });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Build your split</Text>
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => setShowReorderModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="reorder-four-outline" size={20} color={Colors.light.primary} />
            <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Tap each day to configure its workout
        </Text>
      </View>

      <View style={styles.daysContainer}>
        {splitData.workoutDays.map((day, index) => {
          const status = getDayStatus(day);

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayCard}
              onPress={() => onEditDay(index)}
              activeOpacity={0.7}
            >
              <View style={styles.dayCardHeader}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayNumber}>Day {index + 1}</Text>
                  {day.emoji && <Text style={styles.dayEmoji}>{day.emoji}</Text>}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                  <Ionicons name={status.icon} size={14} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={styles.dayCardContent}>
                {day.workoutName ? (
                  <>
                    <Text style={styles.dayName}>{day.workoutName}</Text>
                    {day.exercises && day.exercises.length > 0 && (
                      <Text style={styles.exerciseCount}>
                        {day.exercises.length} {day.exercises.length === 1 ? 'exercise' : 'exercises'}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.placeholder}>
                    {day.isRest ? 'Rest and recovery' : 'Tap to configure'}
                  </Text>
                )}
              </View>

              <View style={styles.dayCardFooter}>
                <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
          Configure all days to continue to the review step
        </Text>
      </View>

      {/* Reorder Days Modal */}
      <Modal
        visible={showReorderModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReorderModal(false)}
      >
        <GestureHandlerRootView style={styles.reorderModalContainer}>
          <View style={styles.reorderModalHeader}>
            <TouchableOpacity
              onPress={() => setShowReorderModal(false)}
              style={styles.reorderModalClose}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.reorderModalTitle}>Reorder Days</Text>
            <TouchableOpacity
              onPress={() => setShowReorderModal(false)}
              style={styles.reorderModalDone}
            >
              <Text style={styles.reorderModalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.reorderHint}>Press and drag to reorder days</Text>

          <DraggableFlatList
            data={splitData.workoutDays}
            keyExtractor={(item) => item.id || `day-${item.dayIndex}`}
            onDragEnd={handleReorderDays}
            contentContainerStyle={styles.reorderListContent}
            activationDistance={0}
            extraData={splitData.workoutDays}
            renderItem={({ item, drag, isActive, getIndex }) => {
              const currentIndex = getIndex();
              const status = getDayStatus(item);

              return (
                <ScaleDecorator>
                  <View
                    style={[
                      styles.reorderItem,
                      isActive && styles.reorderItemDragging
                    ]}
                  >
                    <TouchableOpacity
                      onPressIn={drag}
                      disabled={isActive}
                      style={styles.reorderDragHandle}
                    >
                      <View style={styles.reorderDragDots}>
                        {[0, 1].map((row) => (
                          <View key={row} style={styles.reorderDragDotsRow}>
                            <View style={styles.reorderDragDot} />
                            <View style={styles.reorderDragDot} />
                            <View style={styles.reorderDragDot} />
                            <View style={styles.reorderDragDot} />
                          </View>
                        ))}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.reorderDayNumber}>
                      <Text style={styles.reorderDayNumberText}>{currentIndex + 1}</Text>
                    </View>
                    <View style={styles.reorderDayInfo}>
                      <View style={styles.reorderDayHeader}>
                        <Text style={styles.reorderDayName}>
                          {item.workoutName || (item.isRest ? 'Rest Day' : 'Not configured')}
                        </Text>
                        {item.emoji && <Text style={styles.reorderDayEmoji}>{item.emoji}</Text>}
                      </View>
                      <Text style={styles.reorderDayDetails}>
                        {item.isRest
                          ? 'Rest and recovery'
                          : item.exercises?.length
                            ? `${item.exercises.length} ${item.exercises.length === 1 ? 'exercise' : 'exercises'}`
                            : 'No exercises'}
                      </Text>
                    </View>
                  </View>
                </ScaleDecorator>
              );
            }}
          />
        </GestureHandlerRootView>
      </Modal>
    </ScrollView>
  );
};

export default SplitOverviewStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.primary + '15',
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    lineHeight: 22,
  },
  daysContainer: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  dayEmoji: {
    fontSize: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayCardContent: {
    marginBottom: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  placeholder: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
  },
  dayCardFooter: {
    alignItems: 'flex-end',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
    lineHeight: 20,
  },
  // Reorder Modal Styles
  reorderModalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  reorderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  reorderModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  reorderModalClose: {
    padding: 4,
    width: 60,
  },
  reorderModalDone: {
    padding: 4,
    width: 60,
    alignItems: 'flex-end',
  },
  reorderModalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  reorderHint: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    textAlign: 'center',
    paddingVertical: 16,
  },
  reorderListContent: {
    padding: 16,
  },
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  reorderItemDragging: {
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderColor: Colors.light.primary,
  },
  reorderDragHandle: {
    padding: 12,
    marginRight: 8,
    marginLeft: -8,
  },
  reorderDragDots: {
    flexDirection: 'column',
    gap: 3,
  },
  reorderDragDotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  reorderDragDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.secondaryText + '60',
  },
  reorderDayNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reorderDayNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  reorderDayInfo: {
    flex: 1,
  },
  reorderDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reorderDayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  reorderDayEmoji: {
    fontSize: 16,
  },
  reorderDayDetails: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
});
