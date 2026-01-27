import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FontWeight } from '../../constants/theme';

const COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
];

function getColorFromName(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const Avatar = ({ uri, name, size = 40, style }) => {
  const colors = useThemeColors();
  const fontSize = size * 0.42;
  const initial = (name || '?').charAt(0).toUpperCase();
  const bgColor = getColorFromName(name);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.borderLight },
          style,
        ]}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: '#FFFFFF', fontSize, fontWeight: FontWeight.bold }}>
        {initial}
      </Text>
    </View>
  );
};

export default Avatar;
