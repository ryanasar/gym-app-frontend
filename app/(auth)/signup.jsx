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

export default function SignUpScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email to confirm your account.');
      router.back();
    }
  };

  const handleLoginNavigate = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
          <Text style={styles.primaryButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLoginNavigate}>
          <Text style={styles.signupText}>
            Already have an account? <Text style={styles.signupLink}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
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
});