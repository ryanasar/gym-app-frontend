import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const ChangeSplitModal = ({ visible, onClose, currentSplit, otherSplits, onSelectSplit }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Switch Active Split</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          {/* Current Split Info */}
          {currentSplit && (
            <View style={styles.currentSplitSection}>
              <Text style={styles.currentSplitLabel}>Currently Active:</Text>
              <View style={styles.currentSplitCard}>
                <Text style={styles.currentSplitEmoji}>{currentSplit.emoji}</Text>
                <View style={styles.currentSplitInfo}>
                  <Text style={styles.currentSplitName}>{currentSplit.name}</Text>
                  <Text style={styles.currentSplitDetails}>
                    {currentSplit.totalDays} days
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Ionicons name="swap-vertical" size={24} color={Colors.light.secondaryText} />
            <View style={styles.dividerLine} />
          </View>

          {/* Other Splits List */}
          <Text style={styles.selectLabel}>Select new active split:</Text>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {otherSplits && otherSplits.length > 0 ? (
              otherSplits.map((split) => (
                <TouchableOpacity
                  key={split.id}
                  style={styles.splitOption}
                  onPress={() => onSelectSplit(split)}
                  activeOpacity={0.7}
                >
                  <View style={styles.splitOptionContent}>
                    <Text style={styles.splitEmoji}>{split.emoji}</Text>
                    <View style={styles.splitInfo}>
                      <Text style={styles.splitName}>{split.name}</Text>
                      <Text style={styles.splitDetails}>
                        {split.totalDays} days
                        {split.description ? ` • ${split.description}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.light.secondaryText} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="barbell-outline" size={48} color={Colors.light.secondaryText} />
                <Text style={styles.emptyText}>No other splits available</Text>
                <Text style={styles.emptySubtext}>Create a new split to switch to</Text>
              </View>
            )}
          </ScrollView>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ChangeSplitModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Current Split Section
  currentSplitSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  currentSplitLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentSplitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  currentSplitEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  currentSplitInfo: {
    flex: 1,
  },
  currentSplitName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  currentSplitDetails: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.borderLight,
  },

  // Select Label
  selectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 12,
    paddingHorizontal: 24,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Modal Content
  modalContent: {
    paddingHorizontal: 24,
    maxHeight: 300,
  },
  splitOption: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.borderLight,
  },
  splitOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  splitEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  splitInfo: {
    flex: 1,
  },
  splitName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  splitDetails: {
    fontSize: 13,
    color: Colors.light.secondaryText,
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },

  // Cancel Button
  cancelButton: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: Colors.light.borderLight,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
});
