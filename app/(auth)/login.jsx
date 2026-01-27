import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme
} from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../auth/auth';
import { useNetwork } from '../contexts/NetworkContext';
import { supabase } from '../../supabase';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../hooks/useThemeColors';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const { user, signIn, signInWithApple, isLoading, error: authError } = useAuth();
  const { isOffline } = useNetwork();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect when user becomes available after login
  React.useEffect(() => {
    if (user && !isLoading) {
      // User is authenticated and data is loaded
      if (user.hasCompletedOnboarding) {
        router.replace('/(tabs)/workout');
      } else {
        router.replace('/(onboarding)');
      }
    }
  }, [user, isLoading]);

  const handleLogin = async () => {
    setError('');

    // Check for offline status
    if (isOffline) {
      setError('You are offline. Please connect to the internet to sign in.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('Supabase auth error:', error);
        setError(error.message || 'Failed to sign in');
      }
      // No need to manually navigate - auth state change will handle it
    } catch (networkError) {
      console.error('Network error during login:', networkError);
      setError('Network error. Please check your connection and try again.');
    }
  };

  const handleSignupNavigate = () => {
    router.push('/signup');
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.formContainer}>
            <Image
              source={require('../../assets/images/logo-transparent.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Log in to continue</Text>

            {isOffline && (
              <View style={styles.offlineWarning}>
                <Text style={styles.offlineText}>You are offline</Text>
              </View>
            )}

            {(error || authError) ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{error || authError?.error_description || 'An error occurred'}</Text>
            ) : null}

            <TouchableOpacity style={[styles.googleButton, { backgroundColor: colors.onPrimary, borderColor: colors.primary }]} onPress={signIn}>
              <Image
                source={require('../../assets/images/google.png')}
                style={styles.googleIcon}
                contentFit="contain"
              />
              <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.appleButton, { backgroundColor: colors.text }]} onPress={signInWithApple}>
              <Image
                source={colorScheme === 'dark' ? require('../../assets/images/apple-black.svg') : require('../../assets/images/apple.png')}
                style={styles.appleIcon}
                contentFit="contain"
              />
              <Text style={[styles.appleButtonText, { color: colors.background }]}>Continue with Apple</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.secondaryText }]}>OR</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
              placeholder="Password"
              autoCapitalize="none"
              secureTextEntry
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPasswordButton}>
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleLogin}>
              <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSignupNavigate}>
              <Text style={[styles.signupText, { color: colors.secondaryText }]}>
                Don't have an account? <Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
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
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  googleButton: {
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  appleButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
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
  forgotPasswordButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signupText: {
    textAlign: 'center',
    fontSize: 14,
  },
  signupLink: {
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
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
});
