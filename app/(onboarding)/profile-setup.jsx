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
import { useThemeColors } from '../hooks/useThemeColors';
import { checkUsernameAvailability, updateUserProfile } from '../api/usersApi';

export default function ProfileSetup() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const colors = useThemeColors();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Set up your profile</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              This information will be visible to other users
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '50%' }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.secondaryText }]}>Step 2 of 4</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                autoCorrect={false}
                placeholder="Enter your full name"
                placeholderTextColor={colors.secondaryText}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text.replace(/[^a-zA-Z\s'-]/g, '') })}
                maxLength={50}
              />
              <Text style={[styles.charCount, { color: colors.secondaryText }]}>{formData.name.length}/50</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Username *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                autoCorrect={false}
                placeholder="Choose a unique username"
                placeholderTextColor={colors.secondaryText}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() })}
                autoCapitalize="none"
                maxLength={20}
              />
              <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                Letters, numbers, and underscores only ({formData.username.length}/20)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                placeholder="Tell others about yourself..."
                placeholderTextColor={colors.secondaryText}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={150}
              />
              <Text style={[styles.charCount, { color: colors.secondaryText }]}>{formData.bio.length}/150</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.disabledButton]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
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
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
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
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  charCount: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
