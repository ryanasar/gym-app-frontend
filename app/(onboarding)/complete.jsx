import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/auth';
import { useThemeColors } from '../hooks/useThemeColors';
import { completeUserOnboarding } from '../api/usersApi';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Confetti particle component
const ConfettiParticle = ({ delay, colors, startX }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 8 }));
    translateY.value = withDelay(
      delay,
      withTiming(400, { duration: 3000, easing: Easing.out(Easing.quad) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 100, { duration: 3000 })
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1000 }), -1, false)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: interpolate(translateY.value, [0, 300, 400], [1, 0.5, 0]),
  }));

  const particleColors = [colors.primary, colors.accent, colors.warning, colors.primaryLight];
  const color = particleColors[Math.floor(Math.random() * particleColors.length)];
  const size = 8 + Math.random() * 8;

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        { backgroundColor: color, width: size, height: size, borderRadius: size / 4 },
        animatedStyle,
      ]}
    />
  );
};

export default function OnboardingComplete() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  // Animation values
  const checkScale = useSharedValue(0);
  const checkRotate = useSharedValue(-180);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(1);
  const titleOpacity = useSharedValue(0);
  const titleTranslate = useSharedValue(30);
  const contentOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(40);
  const buttonScale = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    // Staggered entrance animations
    checkScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 80 }));
    checkRotate.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 80 }));

    // Expanding ring effect
    ringScale.value = withDelay(500, withTiming(2, { duration: 600, easing: Easing.out(Easing.cubic) }));
    ringOpacity.value = withDelay(500, withTiming(0, { duration: 600 }));

    titleOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    titleTranslate.value = withDelay(600, withSpring(0, { damping: 15 }));

    contentOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    contentTranslate.value = withDelay(800, withSpring(0, { damping: 15 }));

    buttonScale.value = withDelay(1000, withSpring(1, { damping: 12 }));

    // Subtle pulse animation on checkmark
    pulseAnim.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkScale.value * pulseAnim.value },
      { rotate: `${checkRotate.value}deg` },
    ],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslate.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const completeOnboarding = async () => {
    setLoading(true);

    try {
      const updatedUser = await completeUserOnboarding(user.supabaseId);
      setUser(updatedUser);
      router.replace('/(tabs)/workout');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [1, 2, 3];

  const features = [
    { icon: 'barbell', title: 'Track Workouts', description: 'Log exercises, sets, and reps with ease' },
    { icon: 'trending-up', title: 'Monitor Progress', description: 'Visualize your fitness journey over time' },
    { icon: 'people', title: 'Stay Connected', description: 'Share achievements with the community' },
  ];

  // Generate confetti particles
  const confettiParticles = showConfetti
    ? Array.from({ length: 20 }, (_, i) => ({
        id: i,
        startX: (i / 20) * width - width / 2 + Math.random() * 40,
        delay: i * 50,
      }))
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Confetti */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {confettiParticles.map((particle) => (
          <ConfettiParticle
            key={particle.id}
            delay={particle.delay}
            startX={particle.startX}
            colors={colors}
          />
        ))}
      </View>

      <View style={styles.content}>
        {/* Success animation */}
        <View style={styles.successSection}>
          <View style={styles.checkmarkWrapper}>
            <Animated.View style={[styles.expandingRing, { borderColor: colors.accent }, ringAnimatedStyle]} />
            <Animated.View
              style={[
                styles.checkmarkContainer,
                { backgroundColor: colors.accent },
                checkAnimatedStyle,
              ]}
            >
              <Ionicons name="checkmark" size={50} color="#FFFFFF" />
            </Animated.View>
          </View>

          <Animated.View style={titleAnimatedStyle}>
            <Text style={[styles.title, { color: colors.text }]}>You're all set!</Text>
            <Text style={[styles.welcomeText, { color: colors.primary }]}>
              Welcome, {user?.name?.split(' ')[0] || 'Champion'}!
            </Text>
          </Animated.View>
        </View>

        {/* Step indicators - all complete */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={step} style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepDot,
                  { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: colors.accent }]} />
              )}
            </View>
          ))}
        </View>

        {/* Features */}
        <Animated.View style={[styles.featuresContainer, contentAnimatedStyle]}>
          <Text style={[styles.featuresTitle, { color: colors.secondaryText }]}>
            Here's what you can do:
          </Text>
          <View style={[styles.featuresList, { backgroundColor: colors.cardBackground, borderColor: colors.borderLight }]}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIconContainer, { backgroundColor: colors.primary + '12' }]}>
                  <Ionicons name={feature.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.secondaryText }]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Button */}
        <AnimatedTouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
            buttonAnimatedStyle,
            loading && styles.disabledButton,
          ]}
          onPress={completeOnboarding}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
            {loading ? 'Setting up...' : 'Start Your Journey'}
          </Text>
          {!loading && (
            <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} style={styles.buttonIcon} />
          )}
        </AnimatedTouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    overflow: 'hidden',
  },
  confettiParticle: {
    position: 'absolute',
    top: 0,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  successSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  checkmarkWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  expandingRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
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
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuresList: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
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
  disabledButton: {
    opacity: 0.6,
  },
});
