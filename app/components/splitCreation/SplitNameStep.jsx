import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

const SplitNameStep = ({ splitData, updateSplitData }) => {
  const handleTogglePublic = () => {
    updateSplitData({ isPublic: !splitData.isPublic });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Name your split</Text>
        <Text style={styles.subtitle}>
          Give your training program a memorable name
        </Text>
      </View>

      {/* Emoji Selection */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Choose an Icon</Text>
        <View style={styles.emojiGrid}>
          {['💪', '🏋️', '🔥', '⚡', '🎯', '🚀', '💯', '🔱', '⭐', '🏆', '👊', '💥', '🦾', '🎪', '🌟', '✨'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiButton,
                splitData.emoji === emoji && styles.emojiButtonSelected
              ]}
              onPress={() => updateSplitData({ emoji })}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Split Name Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Split Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Push Pull Legs, Upper Lower"
          placeholderTextColor={Colors.light.secondaryText}
          value={splitData.name}
          onChangeText={(value) => updateSplitData({ name: value })}
          maxLength={50}
        />
        <Text style={styles.helperText}>
          {splitData.name.length}/50 characters
        </Text>
      </View>

      {/* Description Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Description <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add notes about your split..."
          placeholderTextColor={Colors.light.secondaryText}
          value={splitData.description}
          onChangeText={(value) => updateSplitData({ description: value })}
          maxLength={200}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.helperText}>
          {splitData.description?.length || 0}/200 characters
        </Text>
      </View>

      {/* Public/Private Toggle */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Visibility</Text>
        <TouchableOpacity style={styles.toggleContainer} onPress={handleTogglePublic}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Make Public</Text>
            <Text style={styles.toggleDescription}>
              Allow others to view and use your split
            </Text>
          </View>
          <View style={[
            styles.toggle,
            splitData.isPublic && styles.toggleActive
          ]}>
            <View style={[
              styles.toggleButton,
              splitData.isPublic && styles.toggleButtonActive
            ]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>
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
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.light.primary,
  },
  optional: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.secondaryText,
  },
  input: {
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 13,
    color: Colors.light.secondaryText,
    marginTop: 6,
    textAlign: 'right',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiButton: {
    width: 52,
    height: 52,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '15',
    shadowColor: Colors.light.primary,
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
    backgroundColor: Colors.light.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
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
    color: Colors.light.primary,
    fontWeight: '500',
    lineHeight: 20,
  },
});
