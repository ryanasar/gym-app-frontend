import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../auth/auth';
import { useNetwork } from '../contexts/NetworkContext';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../hooks/useThemeColors';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const { user, signIn, signInWithApple, isLoading, error: authError } = useAuth();
  const { isOffline } = useNetwork();
  const router = useRouter();

  // Redirect when user becomes available after login
  React.useEffect(() => {
    if (user && !isLoading) {
      if (user.hasCompletedOnboarding) {
        router.replace('/(tabs)/workout');
      } else {
        router.replace('/(onboarding)');
      }
    }
  }, [user, isLoading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/logo-transparent.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>Welcome to Gymvy</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Your personal fitness companion</Text>

        {isOffline && (
          <View style={styles.offlineWarning}>
            <Text style={styles.offlineText}>You are offline</Text>
          </View>
        )}

        {authError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{authError?.error_description || 'An error occurred'}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.googleButton, { backgroundColor: colors.onPrimary, borderColor: colors.primary, shadowColor: colors.shadow }]}
          onPress={signIn}
        >
          <Image
            source={require('../../assets/images/google.png')}
            style={styles.socialIcon}
            contentFit="contain"
          />
          <Text style={[styles.googleButtonText, { color: colors.text }]}>Sign Up with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.appleButton, { backgroundColor: colors.text, shadowColor: colors.shadow }]}
          onPress={signInWithApple}
        >
          <Image
            source={colorScheme === 'dark' ? require('../../assets/images/apple-black.svg') : require('../../assets/images/apple.png')}
            style={styles.socialIcon}
            contentFit="contain"
          />
          <Text style={[styles.appleButtonText, { color: colors.background }]}>Sign Up with Apple</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.secondaryText }]}>OR</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity style={[styles.emailButton, { borderColor: colors.primary }]} onPress={() => router.push('/signup')}>
          <Text style={[styles.emailButtonText, { color: colors.primary }]}>Sign Up with Email</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={[styles.loginText, { color: colors.secondaryText }]}>
            Already have an account? <Text style={[styles.loginLink, { color: colors.primary }]}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 32,
    textAlign: 'center',
  },
  googleButton: {
    borderWidth: 1,
    paddingVertical: 18,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  socialIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  appleButton: {
    paddingVertical: 18,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appleButtonText: {
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontWeight: '500',
  },
  emailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  emailButtonText: {
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  loginText: {
    textAlign: 'center',
    fontSize: 14,
  },
  loginLink: {
    fontWeight: '600',
  },
  offlineWarning: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#FCD34D',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});
