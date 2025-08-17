import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/auth';
import { Colors } from '../constants/colors';
import { checkUsernameAvailability, updateUserProfile } from '../api/usersApi';

export default function ProfileSetup() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: '',
  });

  const checkUsernameAvailabilityHandler = async (username) => {
    if (!username.trim()) return false;
    return await checkUsernameAvailability(username);
  };

  const handleNext = async () => {
    if (!formData.name.trim() || !formData.username.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    // Check username availability
    const isUsernameAvailable = await checkUsernameAvailabilityHandler(formData.username);
    if (!isUsernameAvailable) {
      Alert.alert('Error', 'Username is already taken. Please choose another one.');
      setLoading(false);
      return;
    }

    try {
      console.log(user)
      const updatedUser = await updateUserProfile(user.supabaseId, {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
      });

      setUser(updatedUser);
      router.push('/(onboarding)/complete');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Set up your profile</Text>
            <Text style={styles.subtitle}>
              This information will be visible to other users
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>
            <Text style={styles.progressText}>Step 2 of 4</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                autoCorrect={false}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.light.placeholder}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.input}
                autoCorrect={false}
                placeholder="Choose a unique username"
                placeholderTextColor={Colors.light.placeholder}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>
                This will be your unique identifier in the app
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell others about yourself..."
                placeholderTextColor={Colors.light.placeholder}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Saving...' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
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
    textAlign: 'center',
    lineHeight: 24,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    fontWeight: '500',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
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
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 12,
    color: Colors.light.secondaryText,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: Colors.light.onPrimary,
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 16,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: Colors.light.text,
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});