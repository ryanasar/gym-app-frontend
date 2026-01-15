import { useAuth } from './auth/auth';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366F1' }}>
        <Image
          source={require('../assets/images/icon.png')}
          style={{ width: 200, height: 200, marginBottom: 20 }}
          contentFit="contain"
          transition={200}
        />
        <ActivityIndicator size="large" color="#FFFFFF" />
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

  // Logged in and completed onboarding - go to workout screen
  return <Redirect href="/(tabs)/workout" />;
}