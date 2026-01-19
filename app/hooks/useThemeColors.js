import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';

/**
 * Hook that returns the appropriate colors based on the system color scheme
 * @returns {typeof Colors.light} The color palette for the current theme
 */
export function useThemeColors() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'];
}

export default useThemeColors;
