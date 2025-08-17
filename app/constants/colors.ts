// src/constants/colors.js

const palette = {
  lightText: '#1D2E5C',
  lightSecondaryText: '#8B8D98',
  lightBackground: '#F9F9FB',
  lightIcon: '#BFC0C0',
  lightTint: '#0A1045',

  lightPrimary: '#1D2E5C',
  lightOnPrimary: '#FFFFFF',
  lightGoogleBlue: '#F7F9FF',
  lightInputBackground: '#FFFFFF',
  lightBorder: '#1D2E5C',
  lightPlaceholder: '#1E1F24',

  darkText: '#ECEDEE',
  darkSecondaryText: '#ECEDEE',
  darkBackground: '#151718',
  darkIcon: '#9BA1A6',
  darkTint: '#FFFFFF',
  
  darkPrimary: '#3B82F6',
  darkOnPrimary: '#FFFFFF',
  darkGoogleBlue: '#4285F4',
  darkInputBackground: '#1F2937',
  darkBorder: '#374151',
  darkPlaceholder: '#6B7280',
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
    primary: palette.lightPrimary,
    onPrimary: palette.lightOnPrimary,
    googleBlue: palette.lightGoogleBlue,
    inputBackground: palette.lightInputBackground,
    border: palette.lightBorder,
    placeholder: palette.lightPlaceholder,
  },
  dark: {
    text: palette.darkText,
    secondaryText: palette.darkSecondaryText,
    background: palette.darkBackground,
    tint: palette.darkTint,
    icon: palette.darkIcon,
    tabIconDefault: palette.darkIcon,
    tabIconSelected: palette.darkTint,
    primary: palette.darkPrimary,
    onPrimary: palette.darkOnPrimary,
    googleBlue: palette.darkGoogleBlue,
    inputBackground: palette.darkInputBackground,
    border: palette.darkBorder,
    placeholder: palette.darkPlaceholder,
  },
};