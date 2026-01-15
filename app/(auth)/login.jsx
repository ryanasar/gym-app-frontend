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
  ScrollView
} from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '../auth/auth';
import { supabase } from '../../supabase';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';

export default function LoginScreen() {
  const { user, signIn, isLoading } = useAuth();
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
      setError('Network error. Please try again.');
    }
  };

  const handleSignupNavigate = () => {
    router.push('/signup');
  };

  return (
    <View style={styles.flex}>
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to continue</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={Colors.light.placeholder}
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              autoCapitalize="none"
              secureTextEntry
              placeholderTextColor={Colors.light.placeholder}
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Login</Text>
            </TouchableOpacity>

            {/* Hidden for now
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={signIn}>
              <Image
                source={require('../../assets/images/google.png')}
                style={styles.googleIcon}
                contentFit="contain"
              />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
            */}

            <TouchableOpacity onPress={handleSignupNavigate}>
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
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
    backgroundColor: Colors.light.background,
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.secondaryText,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: Colors.light.onPrimary,
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: Colors.light.onPrimary,
    borderBlockColor: Colors.light.primary,
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
    color: Colors.light.placeholder,
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
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  signupText: {
    textAlign: 'center',
    color: Colors.light.secondaryText,
    fontSize: 14,
  },
  signupLink: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});