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
import { supabase } from '../../supabase';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useNetwork } from '../contexts/NetworkContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { isOffline } = useNetwork();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');

    if (isOffline) {
      setError('You are offline. Please connect to the internet to sign up.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: {
        emailRedirectTo: 'gymvy://auth'
      } });

      if (error) {
        setError(error.message);
      } else {
        Alert.alert('Success', 'Check your email to confirm your account.');
        router.back();
      }
    } catch (networkError) {
      setError('Network error. Please check your connection and try again.');
    }
  };

  const handleLoginNavigate = () => {
    router.back();
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={Colors.light.placeholder}
              value={email}
              onChangeText={setEmail}
              maxLength={100}
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              autoCapitalize="none"
              secureTextEntry
              placeholderTextColor={Colors.light.placeholder}
              value={password}
              onChangeText={setPassword}
              maxLength={128}
              autoCorrect={false}
            />

            {isOffline && (
              <View style={styles.offlineWarning}>
                <Text style={styles.offlineText}>You are offline</Text>
              </View>
            )}

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
              <Text style={styles.primaryButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLoginNavigate}>
              <Text style={styles.signupText}>
                Already have an account? <Text style={styles.signupLink}>Log In</Text>
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
    marginBottom: 24,
  },
  primaryButtonText: {
    color: Colors.light.onPrimary,
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
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