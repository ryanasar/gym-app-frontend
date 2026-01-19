import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * Shared EmptyState component for consistent styling across the app
 *
 * @param {string} icon - Ionicons icon name (e.g., 'barbell-outline')
 * @param {string} emoji - Emoji to display instead of icon (e.g., '📝')
 * @param {string} title - Main title text
 * @param {string} message - Optional subtitle/message text
 * @param {string} ctaText - Optional CTA button text
 * @param {function} onCtaPress - Optional CTA button press handler
 * @param {string} ctaIcon - Optional icon for CTA button
 */
const EmptyState = ({
  icon,
  emoji,
  title,
  message,
  ctaText,
  onCtaPress,
  ctaIcon,
}) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {/* Icon or Emoji */}
      <View style={[styles.iconContainer, { backgroundColor: colors.border + '40' }]}>
        {emoji ? (
          <Text style={styles.emoji}>{emoji}</Text>
        ) : icon ? (
          <Ionicons name={icon} size={48} color={colors.secondaryText} />
        ) : null}
      </View>

      {/* Title */}
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}

      {/* Message */}
      {message && <Text style={[styles.message, { color: colors.secondaryText }]}>{message}</Text>}

      {/* CTA Button */}
      {ctaText && onCtaPress && (
        <TouchableOpacity style={[styles.ctaButton, { backgroundColor: colors.primary }]} onPress={onCtaPress}>
          {ctaIcon && (
            <Ionicons name={ctaIcon} size={20} color={colors.onPrimary} style={styles.ctaIcon} />
          )}
          <Text style={[styles.ctaText, { color: colors.onPrimary }]}>{ctaText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  ctaIcon: {
    marginRight: 4,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
