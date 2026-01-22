import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { useThemeColors } from '../../hooks/useThemeColors';

const SplitNameStep = ({ splitData, updateSplitData }) => {
  const colors = useThemeColors();

  const handleTogglePublic = () => {
    updateSplitData({ isPublic: !splitData.isPublic });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Name your split</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Give your training program a memorable name
        </Text>
      </View>

      {/* Split Name Input */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Split Name <Text style={[styles.required, { color: colors.primary }]}>*</Text></Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g., Push Pull Legs, Upper Lower"
          placeholderTextColor={colors.secondaryText}
          value={splitData.name}
          onChangeText={(value) => updateSplitData({ name: value })}
          maxLength={50}
        />
        <Text style={[styles.helperText, { color: colors.secondaryText }]}>
          {splitData.name.length}/50 characters
        </Text>
      </View>

      {/* Emoji Selection */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Choose an Icon</Text>
        <View style={styles.emojiGrid}>
          {[
            '💪', '🏋️', '🔥', '⚡', '🎯', '🚀',
            '💯', '🔱', '⭐', '🏆', '🦾', '💥',
            '👊', '🏃', '💎', '🦁', '⚔️', '🌟',
          ].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiButton,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                splitData.emoji === emoji && [styles.emojiButtonSelected, { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]
              ]}
              onPress={() => updateSplitData({ emoji })}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Description Input */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Description <Text style={[styles.optional, { color: colors.secondaryText }]}>(optional)</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
          placeholder="Add notes about your split..."
          placeholderTextColor={colors.secondaryText}
          value={splitData.description}
          onChangeText={(value) => updateSplitData({ description: value })}
          maxLength={200}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={[styles.helperText, { color: colors.secondaryText }]}>
          {splitData.description?.length || 0}/200 characters
        </Text>
      </View>

      {/* Public/Private Toggle */}
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Visibility</Text>
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

      <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={[styles.infoText, { color: colors.primary }]}>
          You can change these details later
        </Text>
      </View>
    </ScrollView>
  );
};

export default SplitNameStep;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    fontWeight: '600',
  },
  optional: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'right',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  emojiButton: {
    width: '15%',
    aspectRatio: 1.2,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonSelected: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiText: {
    fontSize: 26,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {},
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  toggleButtonActive: {
    alignSelf: 'flex-end',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
