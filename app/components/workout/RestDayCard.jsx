import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import RestDayPostModal from './RestDayPostModal';

const RestDayCard = ({ splitName, splitEmoji, weekNumber, dayNumber, onRestLogged, onChangeWorkout }) => {
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

  const handleChangeWorkout = () => {
    setShowOptionsMenu(false);
    if (onChangeWorkout) {
      onChangeWorkout();
    }
  };

  // Theme-aware green colors
  const greenPrimary = isDark ? '#4ADE80' : '#4CAF50';
  const greenBackground = isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(76, 175, 80, 0.08)';
  const iconBackground = isDark ? 'rgba(74, 222, 128, 0.15)' : '#E8F5E9';

  return (
    <>
      <View style={[styles.card, { backgroundColor: greenBackground, borderColor: greenPrimary }]}>
        {/* Icon and Title */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: iconBackground }]}>
            <Text style={styles.iconText}>🌿</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Rest & Recover</Text>
            <Text style={[styles.subtitle, { color: greenPrimary }]}>Planned Rest Day</Text>
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
                onPress={handleChangeWorkout}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.text} />
                <Text style={[styles.optionsMenuItemText, { color: colors.text }]}>Change Today's Workout</Text>
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

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Post Rest Day Button */}
          <TouchableOpacity
            style={[styles.postRestDayButton, { backgroundColor: greenPrimary, shadowColor: greenPrimary }]}
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

export default RestDayCard;

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
    marginBottom: 20,
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

  // Options Button (3-dot menu)
  optionsButton: {
    padding: 4,
    borderRadius: 8,
  },

  // Options Menu Backdrop (invisible overlay to dismiss)
  optionsMenuBackdrop: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    zIndex: 999,
  },

  // Options Menu Overlay
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
    minWidth: 220,
    zIndex: 1000,
  },

  // Options Menu Item
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  // Options Menu Item Text
  optionsMenuItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
