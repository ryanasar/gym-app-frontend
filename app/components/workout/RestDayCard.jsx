import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import RestDayPostModal from './RestDayPostModal';

const RestDayCard = ({ splitName, splitEmoji, weekNumber, dayNumber, onRestLogged, onChangeWorkout }) => {
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

  const recoveryMessages = [
    "Recovery is part of progress",
    "Let your body rebuild",
    "Rest today, grow tomorrow",
    "Your muscles are rebuilding",
  ];

  // Memoize the random message so it doesn't change on every render
  const randomMessage = useMemo(() => {
    return recoveryMessages[Math.floor(Math.random() * recoveryMessages.length)];
  }, []);

  return (
    <>
      <View style={styles.card}>
        {/* Icon and Title */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🌿</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Rest & Recover</Text>
            <Text style={styles.subtitle}>Planned Rest Day</Text>
          </View>
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => setShowOptionsMenu(!showOptionsMenu)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.light.secondaryText} />
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
            <View style={styles.optionsMenuOverlay}>
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={handleChangeWorkout}
              >
                <Ionicons name="calendar-outline" size={18} color={Colors.light.text} />
                <Text style={styles.optionsMenuItemText}>Change Today's Workout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Motivational Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{randomMessage}</Text>
        </View>

        {/* Split Info */}
        {splitName && (
          <View style={styles.splitInfo}>
            <Text style={styles.splitText}>
              {splitEmoji && `${splitEmoji} `}{splitName}
            </Text>
            <Text style={styles.cycleInfo}>
              Cycle {weekNumber} · Day {dayNumber}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Post Rest Day Button */}
          <TouchableOpacity
            style={styles.postRestDayButton}
            onPress={handlePostRestDay}
          >
            <View style={styles.postRestDayContent}>
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              <Text style={styles.postRestDayText}>Post Rest Day</Text>
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
    backgroundColor: '#4CAF50' + '08',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#4CAF50',
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
    backgroundColor: '#E8F5E9',
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
    color: Colors.light.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4CAF50',
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#81C784',
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondaryText,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  splitInfo: {
    marginBottom: 20,
  },
  splitText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  cycleInfo: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  actionsContainer: {
    marginTop: 20,
  },
  postRestDayButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#4CAF50',
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
    color: '#FFFFFF',
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
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 8,
    shadowColor: Colors.light.shadow,
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
    color: Colors.light.text,
  },
});
