import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const SplitInformation = ({ splitData, updateSplitData }) => {
  const colors = useThemeColors();
  const [selectedEmoji, setSelectedEmoji] = useState(splitData.emoji || '💪');

  const emojiOptions = ['💪', '🏋️', '🔥', '⚡', '🎯', '🚀', '💯', '🔱', '⭐', '🏆'];
  const dayOptions = [3, 4, 5, 6, 7];


  const handleNameChange = (name) => {
    updateSplitData({ name });
  };

  const handleDescriptionChange = (description) => {
    updateSplitData({ description });
  };

  const handleEmojiSelect = (emoji) => {
    setSelectedEmoji(emoji);
    updateSplitData({ emoji });
  };

  const handleDaysSelect = (totalDays) => {
    updateSplitData({ totalDays });
  };


  const handleTogglePublic = () => {
    updateSplitData({ isPublic: !splitData.isPublic });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Split Details</Text>

        {/* Split Name */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Split Name *</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter split name (e.g., Push Pull Legs)"
            placeholderTextColor={colors.secondaryText}
            value={splitData.name}
            onChangeText={handleNameChange}
            maxLength={50}
          />
        </View>

        {/* Emoji Selection */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Choose an Icon</Text>
          <View style={styles.emojiGrid}>
            {emojiOptions.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiButton,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  selectedEmoji === emoji && [styles.emojiButtonSelected, { borderColor: colors.primary, backgroundColor: colors.primary + '20' }]
                ]}
                onPress={() => handleEmojiSelect(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Number of Days */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Split Length (Including Rest Days)</Text>
          <View style={styles.daysGrid}>
            {dayOptions.map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.dayButton,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  splitData.totalDays === days && [styles.dayButtonSelected, { borderColor: colors.primary, backgroundColor: colors.primary }]
                ]}
                onPress={() => handleDaysSelect(days)}
              >
                <Text style={[
                  styles.dayButtonText,
                  { color: colors.text },
                  splitData.totalDays === days && [styles.dayButtonTextSelected, { color: colors.onPrimary }]
                ]}>
                  {days} days
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.descriptionInput, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
            placeholder="Describe your split routine..."
            placeholderTextColor={colors.secondaryText}
            value={splitData.description}
            onChangeText={handleDescriptionChange}
            maxLength={200}
            multiline={true}
            numberOfLines={3}
          />
        </View>

        {/* Public/Private Toggle */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={[styles.toggleContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} onPress={handleTogglePublic}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Make Public</Text>
              <Text style={[styles.toggleDescription, { color: colors.secondaryText }]}>
                Allow others to view and use your split
              </Text>
            </View>
            <View style={[
              styles.toggle,
              { backgroundColor: colors.borderLight },
              splitData.isPublic && [styles.toggleActive, { backgroundColor: colors.primary }]
            ]}>
              <View style={[
                styles.toggleButton,
                { backgroundColor: colors.onPrimary },
                splitData.isPublic && styles.toggleButtonActive
              ]} />
            </View>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
};

export default SplitInformation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    width: 50,
    height: 50,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '20',
  },
  emojiText: {
    fontSize: 24,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 12,
  },
  dayButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  dayButtonTextSelected: {
    color: Colors.light.onPrimary,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: Colors.light.secondaryText,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.borderLight,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.light.primary,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.onPrimary,
    alignSelf: 'flex-start',
  },
  toggleButtonActive: {
    alignSelf: 'flex-end',
  },
});