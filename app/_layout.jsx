import 'fast-text-encoding';
import { AuthProvider } from './auth/auth';
import { WorkoutProvider } from './contexts/WorkoutContext';
import { SyncProvider } from './contexts/SyncContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <SyncProvider>
          <NotificationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="user/[username]" options={{ headerShown: false }} />
              <Stack.Screen name="workout" options={{ headerShown: false }} />
              <Stack.Screen name="post" options={{ headerShown: false }} />
              <Stack.Screen name="split" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            </Stack>
          </NotificationProvider>
        </SyncProvider>
      </WorkoutProvider>
    </AuthProvider>
  );
}