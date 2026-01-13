import { AuthProvider } from './auth/auth';
import { WorkoutProvider } from './contexts/WorkoutContext';
import { SyncProvider } from './contexts/SyncContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <SyncProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="user/[username]" options={{ headerShown: false }} />
            <Stack.Screen name="workout" options={{ headerShown: false }} />
            <Stack.Screen name="post" options={{ headerShown: false }} />
            <Stack.Screen name="split" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          </Stack>
        </SyncProvider>
      </WorkoutProvider>
    </AuthProvider>
  );
}