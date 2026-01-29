import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../../../constants/colors';
import { useThemeColors } from '../../../hooks/useThemeColors';

const ReorderExercisesModal = ({
  visible,
  onClose,
  exercises,
  onReorder,
  onRemoveExercise,
  onAddExercise
}) => {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={[styles.gestureRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.reorderModalHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.reorderCancelText, { color: colors.secondaryText }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.reorderModalTitle, { color: colors.text }]}>Edit Workout</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.reorderDoneText, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.addExerciseButton, { backgroundColor: colors.primary }]}
          onPress={onAddExercise}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={colors.onPrimary} />
          <Text style={[styles.addExerciseButtonText, { color: colors.onPrimary }]}>Add Exercise</Text>
        </TouchableOpacity>

        <DraggableFlatList
          data={exercises}
          keyExtractor={(item, index) => `reorder-${item.id || item.name}-${index}`}
          onDragEnd={onReorder}
          contentContainerStyle={styles.reorderListContent}
          activationDistance={0}
          renderItem={({ item, drag, isActive, getIndex }) => {
            const index = getIndex();
            return (
              <ScaleDecorator>
                <View
                  style={[
                    styles.reorderItem,
                    { backgroundColor: colors.cardBackground, borderColor: colors.borderLight },
                    isActive && [styles.reorderItemDragging, { shadowColor: colors.primary, borderColor: colors.primary }]
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
                          <View style={[styles.reorderDragDot, { backgroundColor: colors.secondaryText }]} />
                          <View style={[styles.reorderDragDot, { backgroundColor: colors.secondaryText }]} />
                          <View style={[styles.reorderDragDot, { backgroundColor: colors.secondaryText }]} />
                          <View style={[styles.reorderDragDot, { backgroundColor: colors.secondaryText }]} />
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                  <View style={[styles.reorderExerciseNumber, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.reorderExerciseNumberText, { color: colors.primary }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.reorderExerciseInfo}>
                    <Text style={[styles.reorderExerciseName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.reorderExerciseDetails, { color: colors.secondaryText }]}>
                      {item.sets && `${item.sets} sets`}
                      {item.sets && item.reps && ' · '}
                      {item.reps && `${item.reps} reps`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.reorderRemoveButton}
                    onPress={() => onRemoveExercise(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </ScaleDecorator>
            );
          }}
        />
      </GestureHandlerRootView>
    </Modal>
  );
};

export default ReorderExercisesModal;

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  reorderModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  reorderModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  reorderCancelText: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  reorderDoneText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  reorderListContent: {
    padding: 16,
  },
  reorderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  reorderItemDragging: {
    backgroundColor: Colors.light.cardBackground,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
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
    backgroundColor: Colors.light.secondaryText,
  },
  reorderExerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reorderExerciseNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  reorderExerciseInfo: {
    flex: 1,
  },
  reorderExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  reorderExerciseDetails: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },
  reorderRemoveButton: {
    padding: 4,
    marginLeft: 8,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  addExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.onPrimary,
  },
});
