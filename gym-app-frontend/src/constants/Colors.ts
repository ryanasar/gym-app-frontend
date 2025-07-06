// src/constants/colors.js

const palette = {
  lightText: '#001A23',
  lightSecondaryText: '#626267',
  lightBackground: '#E8F1F2 ',
  lightIcon: '#BFC0C0',
  lightTint: '#0A7EA4',

  darkText: '#ECEDEE',
  darkSecondaryText: '#ECEDEE',
  darkBackground: '#151718',
  darkIcon: '#9BA1A6',
  darkTint: '#FFFFFF',
};

export const Colors = {
  light: {
    text: palette.lightText,
    secondaryText: palette.lightSecondaryText,
    background: palette.lightBackground,
    tint: palette.lightTint,
    icon: palette.lightIcon,
    tabIconDefault: palette.lightIcon,
    tabIconSelected: palette.lightTint,
  },
  dark: {
    text: palette.darkText,
    secondaryText: palette.darkSecondaryText,
    background: palette.darkBackground,
    tint: palette.darkTint,
    icon: palette.darkIcon,
    tabIconDefault: palette.darkIcon,
    tabIconSelected: palette.darkTint,
  },
};
