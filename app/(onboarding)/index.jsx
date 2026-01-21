import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/auth';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../hooks/useThemeColors';

export default function OnboardingWelcome() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome to GymApp!</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Let's set up your profile to get you started on your fitness journey.
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '25%' }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.secondaryText }]}>Step 1 of 4</Text>
        </View>

        <View style={styles.welcomeContent}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Hi {user?.name || user?.email}! 👋
          </Text>
          <Text style={[styles.description, { color: colors.secondaryText }]}>
            We'll help you customize your experience with a few quick questions.
            This will only take a minute!
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          onPress={() => router.push('/(onboarding)/profile-setup')}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
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
    marginVertical: 20,
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
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
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
});
