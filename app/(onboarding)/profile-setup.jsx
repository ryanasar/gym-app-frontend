import React, { useState, useEffect, useRef } from 'react';
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
import { useThemeColors } from '../hooks/useThemeColors';
import { checkUsernameAvailability, updateUserProfile } from '../api/usersApi';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolateColor,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function ProfileSetup() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: '',
  });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslate = useSharedValue(20);
  const formOpacity = useSharedValue(0);
  const formTranslate = useSharedValue(30);
  const progressWidth = useSharedValue(25);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 500 }));
    headerTranslate.value = withDelay(100, withSpring(0, { damping: 15 }));

    formOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    formTranslate.value = withDelay(300, withSpring(0, { damping: 15 }));

    progressWidth.value = withDelay(200, withTiming(50, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslate.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslate.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

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

  const steps = [1, 2, 3];

  const getInputStyle = (inputName) => {
    const isFocused = focusedInput === inputName;
    return [
      styles.input,
      {
        backgroundColor: colors.cardBackground,
        borderColor: isFocused ? colors.primary : colors.border,
        borderWidth: isFocused ? 2 : 1,
        color: colors.text,
      },
    ];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Create your profile</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Tell us a bit about yourself
            </Text>
          </Animated.View>

          {/* Step indicators */}
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={step} style={styles.stepWrapper}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: index <= 1 ? colors.primary : colors.borderLight,
                      borderColor: index <= 1 ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {index < 1 && (
                    <Ionicons name="checkmark" size={10} color={colors.onPrimary} />
                  )}
                  {index === 1 && (
                    <View style={[styles.stepDotInner, { backgroundColor: colors.onPrimary }]} />
                  )}
                </View>
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      { backgroundColor: index < 1 ? colors.primary : colors.borderLight }
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          <Animated.View style={[styles.form, formAnimatedStyle]}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="person-outline" size={18} color={colors.secondaryText} />
                <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
                <Text style={[styles.required, { color: colors.error }]}>*</Text>
              </View>
              <TextInput
                style={getInputStyle('name')}
                autoCorrect={false}
                placeholder="Enter your full name"
                placeholderTextColor={colors.placeholder}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text.replace(/[^a-zA-Z\s'-]/g, '') })}
                maxLength={50}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
              <View style={styles.inputFooter}>
                <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                  This is how others will see you
                </Text>
                <Text style={[styles.charCount, { color: colors.secondaryText }]}>
                  {formData.name.length}/50
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="at" size={18} color={colors.secondaryText} />
                <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                <Text style={[styles.required, { color: colors.error }]}>*</Text>
              </View>
              <View style={styles.usernameInputWrapper}>
                <Text style={[styles.usernamePrefix, { color: colors.secondaryText }]}>@</Text>
                <TextInput
                  style={[getInputStyle('username'), styles.usernameInput]}
                  autoCorrect={false}
                  placeholder="username"
                  placeholderTextColor={colors.placeholder}
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() })}
                  autoCapitalize="none"
                  maxLength={20}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputFooter}>
                <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                  Letters, numbers, underscores only
                </Text>
                <Text style={[styles.charCount, { color: colors.secondaryText }]}>
                  {formData.username.length}/20
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="document-text-outline" size={18} color={colors.secondaryText} />
                <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
                <Text style={[styles.optional, { color: colors.secondaryText }]}>(optional)</Text>
              </View>
              <TextInput
                style={[getInputStyle('bio'), styles.textArea]}
                placeholder="Tell others about yourself and your fitness goals..."
                placeholderTextColor={colors.placeholder}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={150}
                onFocus={() => setFocusedInput('bio')}
                onBlur={() => setFocusedInput(null)}
              />
              <View style={styles.inputFooter}>
                <Text style={[styles.helperText, { color: colors.secondaryText }]}>
                  Share your fitness journey
                </Text>
                <Text style={[styles.charCount, { color: colors.secondaryText }]}>
                  {formData.bio.length}/150
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.primary },
              loading && styles.disabledButton,
              (!formData.name.trim() || !formData.username.trim()) && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={loading || !formData.name.trim() || !formData.username.trim()}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              {loading ? 'Saving...' : 'Continue'}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  required: {
    fontSize: 16,
    fontWeight: '600',
  },
  optional: {
    fontSize: 14,
    fontWeight: '400',
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  usernameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernamePrefix: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  usernameInput: {
    flex: 1,
    paddingLeft: 32,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 16,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  helperText: {
    fontSize: 13,
    flex: 1,
  },
  charCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 24,
    gap: 12,
    borderTopWidth: 1,
  },
  primaryButton: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontWeight: '700',
    fontSize: 17,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 6,
  },
  secondaryButtonText: {
    fontWeight: '600',
    fontSize: 17,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
