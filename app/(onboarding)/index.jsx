import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/auth';
import { useThemeColors } from '../hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function OnboardingWelcome() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();

  // Animation values
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslate = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(40);
  const buttonScale = useSharedValue(0);
  const floatAnim = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animations
    iconScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    iconRotate.value = withDelay(200, withSpring(360, { damping: 15, stiffness: 80 }));

    titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    titleTranslate.value = withDelay(400, withSpring(0, { damping: 15 }));

    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));

    contentOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    contentTranslate.value = withDelay(800, withSpring(0, { damping: 15 }));

    buttonScale.value = withDelay(1000, withSpring(1, { damping: 12 }));

    progressWidth.value = withDelay(600, withTiming(25, { duration: 800, easing: Easing.out(Easing.cubic) }));

    // Floating animation loop
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
      { translateY: interpolate(floatAnim.value, [0, 1], [0, -10]) },
    ],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslate.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const steps = [1, 2, 3];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header with icon */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primary + '15' },
              iconAnimatedStyle
            ]}
          >
            <View style={[styles.iconInner, { backgroundColor: colors.primary + '25' }]}>
              <Ionicons name="fitness" size={60} color={colors.primary} />
            </View>
          </Animated.View>

          <Animated.Text style={[styles.title, { color: colors.text }, titleAnimatedStyle]}>
            Welcome to Gymvy!
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { color: colors.secondaryText }, subtitleAnimatedStyle]}>
            Your personal fitness companion
          </Animated.Text>
        </View>

        {/* Step indicators */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={step} style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: index === 0 ? colors.primary : colors.borderLight,
                    borderColor: index === 0 ? colors.primary : colors.border,
                  },
                ]}
              >
                {index === 0 && (
                  <View style={[styles.stepDotInner, { backgroundColor: colors.onPrimary }]} />
                )}
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: colors.borderLight }]} />
              )}
            </View>
          ))}
        </View>

        {/* Main content */}
        <Animated.View style={[styles.welcomeContent, contentAnimatedStyle]}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            <View style={[styles.cardIconContainer, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="rocket" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Ready to transform?
            </Text>
            <Text style={[styles.cardDescription, { color: colors.secondaryText }]}>
              We'll help you set up your profile in just a few quick steps. Track workouts, monitor progress, and reach your goals.
            </Text>
          </View>

          <View style={styles.featuresPreview}>
            {[
              { icon: 'barbell-outline', text: 'Log workouts' },
              { icon: 'analytics-outline', text: 'Track progress' },
              { icon: 'people-outline', text: 'Connect' },
            ].map((feature, index) => (
              <View
                key={index}
                style={[styles.featureChip, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }]}
              >
                <Ionicons name={feature.icon} size={16} color={colors.primary} />
                <Text style={[styles.featureChipText, { color: colors.primary }]}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Button */}
        <AnimatedTouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
            buttonAnimatedStyle
          ]}
          onPress={() => router.push('/(onboarding)/profile-setup')}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} style={styles.buttonIcon} />
        </AnimatedTouchableOpacity>
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
    marginTop: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  featuresPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  featureChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
