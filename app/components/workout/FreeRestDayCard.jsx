import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import RestDayPostModal from './RestDayPostModal';

const FreeRestDayCard = ({ splitName, splitEmoji, weekNumber, dayNumber, originalWorkoutName, onRestLogged, onUndoRestDay }) => {
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showPostModal, setShowPostModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const handlePostRestDay = () => {
    setShowPostModal(true);
  };

  const handleRestDayPosted = () => {
    setShowPostModal(false);
    if (onRestLogged) {
      onRestLogged();
    }
  };

  // Theme-aware amber/warning colors
  const amberPrimary = isDark ? '#FBBF24' : '#F59E0B';
  const amberBackground = isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(245, 158, 11, 0.08)';
  const iconBackground = isDark ? 'rgba(251, 191, 36, 0.15)' : '#FEF3C7';

  return (
    <>
      <View style={[styles.card, { backgroundColor: amberBackground, borderColor: amberPrimary }]}>
        {/* Icon and Title */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
            <Text style={styles.iconText}>😴</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Rest & Recover</Text>
            <Text style={[styles.subtitle, { color: amberPrimary }]}>Free Rest Day</Text>
          </View>
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => setShowOptionsMenu(!showOptionsMenu)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* Options Menu */}
        {showOptionsMenu && (
          <>
            <TouchableOpacity
              style={styles.optionsMenuBackdrop}
              activeOpacity={1}
              onPress={() => setShowOptionsMenu(false)}
            />
            <View style={[styles.optionsMenuOverlay, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  if (onUndoRestDay) {
                    onUndoRestDay();
                  }
                }}
              >
                <Ionicons name="arrow-undo-outline" size={18} color={colors.error} />
                <Text style={[styles.optionsMenuItemText, { color: colors.error }]}>Undo Rest Day</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Split Info */}
        {splitName && (
          <View style={styles.splitInfo}>
            <Text style={[styles.splitText, { color: colors.primary }]}>
              {splitEmoji && `${splitEmoji} `}{splitName}
            </Text>
            <Text style={[styles.cycleInfo, { color: colors.secondaryText }]}>
              Cycle {weekNumber} · Day {dayNumber}
            </Text>
          </View>
        )}

        {/* Info text */}
        {originalWorkoutName && (
          <View style={[styles.infoContainer, { backgroundColor: isDark ? 'rgba(251, 191, 36, 0.08)' : 'rgba(245, 158, 11, 0.06)' }]}>
            <Ionicons name="information-circle-outline" size={18} color={amberPrimary} />
            <Text style={[styles.infoText, { color: colors.secondaryText }]}>
              Your {originalWorkoutName} workout will be tomorrow
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.postRestDayButton, { backgroundColor: amberPrimary, shadowColor: amberPrimary }]}
            onPress={handlePostRestDay}
          >
            <View style={styles.postRestDayContent}>
              <Ionicons name="cloud-upload-outline" size={20} color={isDark ? '#111827' : '#FFFFFF'} />
              <Text style={[styles.postRestDayText, { color: isDark ? '#111827' : '#FFFFFF' }]}>Post Rest Day</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rest Day Post Modal */}
      <RestDayPostModal
        visible={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPostCreated={handleRestDayPosted}
        splitName={splitName}
        splitEmoji={splitEmoji}
        weekNumber={weekNumber}
        dayNumber={dayNumber}
      />
    </>
  );
};

export default FreeRestDayCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 28,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  splitInfo: {
    marginBottom: 16,
  },
  splitText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  cycleInfo: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  actionsContainer: {
    marginTop: 4,
  },
  postRestDayButton: {
    paddingVertical: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postRestDayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  postRestDayText: {
    fontSize: 18,
    fontWeight: '700',
  },
  optionsButton: {
    padding: 4,
    borderRadius: 8,
  },
  optionsMenuBackdrop: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    zIndex: 999,
  },
  optionsMenuOverlay: {
    position: 'absolute',
    top: 40,
    right: 20,
    borderRadius: 12,
    padding: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
    zIndex: 1000,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionsMenuItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
