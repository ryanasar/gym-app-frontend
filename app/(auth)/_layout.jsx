import { useAuth } from '../auth/auth';
import { Redirect, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}