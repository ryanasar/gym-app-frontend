import 'fast-text-encoding';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './auth/auth';
import { WorkoutProvider } from './contexts/WorkoutContext';
import { SyncProvider } from './contexts/SyncContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PushNotificationProvider } from './contexts/PushNotificationContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { Stack } from 'expo-router';
import { OfflineBanner } from './components/common/OfflineBanner';
import { useThemeColors } from './hooks/useThemeColors';

export default function RootLayout() {
  const colors = useThemeColors();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <NetworkProvider>
        <AuthProvider>
          <PushNotificationProvider>
            <WorkoutProvider>
              <SyncProvider>
                <NotificationProvider>
                  <OfflineBanner />
                  <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="user/[username]" options={{ headerShown: false, presentation: 'modal' }} />
                    <Stack.Screen name="workout" options={{ headerShown: false }} />
                    <Stack.Screen name="post" options={{ headerShown: false }} />
                    <Stack.Screen name="split" options={{ headerShown: false }} />
                    <Stack.Screen name="search" options={{ headerShown: false }} />
                    <Stack.Screen name="notifications" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                  </Stack>
                </NotificationProvider>
              </SyncProvider>
            </WorkoutProvider>
          </PushNotificationProvider>
        </AuthProvider>
      </NetworkProvider>
    </GestureHandlerRootView>
  );
}