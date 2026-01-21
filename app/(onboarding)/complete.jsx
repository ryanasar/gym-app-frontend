import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/auth';
import { Colors } from '../constants/colors';
import { useThemeColors } from '../hooks/useThemeColors';
import { completeUserOnboarding } from '../api/usersApi';

export default function OnboardingComplete() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);

  const completeOnboarding = async () => {
    setLoading(true);

    try {
      const updatedUser = await completeUserOnboarding(user.supabaseId);
      setUser(updatedUser);

      // Navigate to workout screen
      router.replace('/(tabs)/workout');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>You're all set!</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Welcome to your fitness journey
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: '100%' }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.primary }]}>Complete!</Text>
        </View>

        <View style={styles.completionContent}>
          <View style={[styles.checkmarkContainer, { backgroundColor: colors.primary + '15' }]}>
            <Text style={styles.checkmarkText}>✅</Text>
          </View>

          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Welcome aboard, {user?.name}!
          </Text>

          <Text style={[styles.description, { color: colors.secondaryText }]}>
            Your profile is now set up and you're ready to start tracking your workouts,
            setting goals, and connecting with the fitness community.
          </Text>

          <View style={[styles.featuresList, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Text style={styles.featureEmoji}>💪</Text>
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>Track your workouts</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Text style={styles.featureEmoji}>📊</Text>
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>Monitor your progress</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Text style={styles.featureEmoji}>👥</Text>
              </View>
              <Text style={[styles.featureText, { color: colors.text }]}>Connect with others</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary, shadowColor: colors.primary }, loading && styles.disabledButton]}
          onPress={completeOnboarding}
          disabled={loading}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
            {loading ? 'Setting up...' : 'Start Your Journey'}
          </Text>
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
    fontWeight: '600',
  },
  completionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmarkText: {
    fontSize: 50,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: 32,
  },
  featuresList: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 22,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
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
  disabledButton: {
    opacity: 0.6,
  },
});
