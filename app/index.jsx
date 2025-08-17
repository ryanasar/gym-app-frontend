import { useAuth } from './auth/auth';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Not logged in - go to auth
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Logged in but hasn't completed onboarding - go to onboarding
  if (user && !user.hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  // Logged in and completed onboarding - go to main app
  return <Redirect href="/(tabs)" />;
}