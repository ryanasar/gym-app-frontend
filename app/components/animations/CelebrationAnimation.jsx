import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const CelebrationAnimation = ({ onAnimationComplete }) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const circleProgress = useRef(new Animated.Value(0)).current;
  const checkmarkProgress = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Sparkle animations (small particles around the circle)
  const sparkles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i * 360) / 12,
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      distance: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Initial haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animation sequence
    const sequence = Animated.sequence([
      // 1. Scale up the container
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),

      // 2. Draw the circular progress ring (with glow)
      Animated.parallel([
        Animated.timing(circleProgress, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),

      // 3. Draw the checkmark and bounce
      Animated.parallel([
        Animated.timing(checkmarkProgress, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.2,
            duration: 150,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 150,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // 4. Sparkle burst
      Animated.stagger(
        30,
        sparkles.map((sparkle) =>
          Animated.parallel([
            Animated.timing(sparkle.scale, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.back(2)),
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.distance, {
              toValue: 1,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        )
      ),

      // 5. Hold for a moment
      Animated.delay(400),

      // 6. Fade out everything
      Animated.parallel([
        Animated.timing(fadeOutAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        ...sparkles.map((sparkle) =>
          Animated.timing(sparkle.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ),
      ]),
    ]);

    // Haptic feedback when checkmark appears
    const checkmarkHapticTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 1100);

    // Track if callback has been called to prevent double-firing
    let callbackFired = false;
    const fireCallback = () => {
      if (!callbackFired && onAnimationComplete) {
        callbackFired = true;
        onAnimationComplete();
      }
    };

    sequence.start(({ finished }) => {
      if (finished) {
        fireCallback();
      }
    });

    // Fallback timeout in case animation is interrupted
    const fallbackTimer = setTimeout(() => {
      fireCallback();
    }, 3500); // Total animation duration is ~3.2s, add buffer

    // Cleanup
    return () => {
      sequence.stop();
      clearTimeout(checkmarkHapticTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Circle dimensions
  const circleSize = 120;
  const circleRadius = 50;
  const circleStrokeWidth = 6;
  const circleCenter = circleSize / 2;
  const circleCircumference = 2 * Math.PI * circleRadius;

  // Animated stroke dashoffset for circular progress
  const strokeDashoffset = circleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circleCircumference, 0],
  });

  // Checkmark path (SVG path) - adjusted to be more centered vertically
  const checkmarkPath = 'M30 65 L50 80 L85 42';

  // Animated checkmark drawing
  const checkmarkDashoffset = checkmarkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0], // Approximate path length
  });

  // Glow intensity
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.1],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.centerContainer,
          {
            opacity: fadeOutAnim,
            transform: [
              { scale: scaleAnim },
              {
                scale: bounceAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1],
                  extrapolate: 'extend',
                }),
              },
            ],
          },
        ]}
      >
        {/* Glow effect background */}
        <Animated.View
          style={[
            styles.glowCircle,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* SVG Circle and Checkmark */}
        <Svg width={circleSize} height={circleSize} style={styles.svg}>
          {/* Background circle (light) */}
          <Circle
            cx={circleCenter}
            cy={circleCenter}
            r={circleRadius}
            stroke="#E8F5E9"
            strokeWidth={circleStrokeWidth}
            fill="white"
          />

          {/* Animated progress circle */}
          <AnimatedCircle
            cx={circleCenter}
            cy={circleCenter}
            r={circleRadius}
            stroke="#4CAF50"
            strokeWidth={circleStrokeWidth}
            fill="none"
            strokeDasharray={circleCircumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${circleCenter}, ${circleCenter}`}
          />

          {/* Animated checkmark */}
          <AnimatedPath
            d={checkmarkPath}
            stroke="#4CAF50"
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="100"
            strokeDashoffset={checkmarkDashoffset}
          />
        </Svg>

        {/* Sparkles around the success icon - positioned relative to circle */}
        {sparkles.map((sparkle) => {
          const angleRad = (sparkle.angle * Math.PI) / 180;
          const maxDistance = 80;

          const translateX = sparkle.distance.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(angleRad) * maxDistance],
          });

          const translateY = sparkle.distance.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.sin(angleRad) * maxDistance],
          });

          return (
            <Animated.View
              key={sparkle.id}
              style={[
                styles.sparkle,
                {
                  opacity: sparkle.opacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { scale: sparkle.scale },
                  ],
                },
              ]}
            />
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent backdrop
  },
  centerContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    zIndex: 2,
  },
  glowCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4CAF50',
    zIndex: 1,
    // Center the glow (which is larger than container)
    top: -10, // (120 - 140) / 2
    left: -10,
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    // Position at center of the circle (relative to centerContainer)
    top: 60 - 4, // circleSize/2 - sparkle size/2
    left: 60 - 4,
  },
});

export default CelebrationAnimation;
