// src/components/common/BunnieIcon.js
// Animated 🐰 Bunnie mascot — used across all screens

import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

/**
 * BunnieIcon — animated Bunnie mascot
 *
 * Props:
 *   size      — font size of emoji (default 24)
 *   animation — 'bounce' | 'pulse' | 'spin' | 'shake' | 'pop' | 'none'
 *   trigger   — boolean — when it flips true, animation plays
 *   loop      — boolean — keeps animating continuously
 *   style     — additional style
 */
export default function BunnieIcon({
  size      = 24,
  animation = 'bounce',
  trigger   = true,
  loop      = false,
  style,
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    playAnimation();
  }, [trigger]);

  const playAnimation = () => {
    anim.setValue(0);

    let sequence;

    switch (animation) {
      case 'bounce':
        sequence = Animated.sequence([
          Animated.spring(anim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
          Animated.spring(anim, { toValue: 0, friction: 5, useNativeDriver: true }),
        ]);
        break;

      case 'pulse':
        sequence = Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
          { iterations: loop ? -1 : 3 }
        );
        break;

      case 'shake':
        sequence = Animated.sequence([
          Animated.timing(anim, { toValue: 1,  duration: 60, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -1, duration: 60, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1,  duration: 60, useNativeDriver: true }),
          Animated.timing(anim, { toValue: -1, duration: 60, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0,  duration: 60, useNativeDriver: true }),
        ]);
        break;

      case 'spin':
        anim.setValue(0);
        sequence = Animated.loop(
          Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
          { iterations: loop ? -1 : 2 }
        );
        break;

      case 'pop':
        sequence = Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.spring(anim, { toValue: 0.8, friction: 3, useNativeDriver: true }),
        ]);
        break;

      default:
        return;
    }

    if (loop && animation !== 'pulse' && animation !== 'spin') {
      Animated.loop(sequence).start();
    } else {
      sequence.start();
    }
  };

  // Build transform based on animation type
  const getTransform = () => {
    switch (animation) {
      case 'bounce':
        return [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -12],
          }),
        }];
      case 'pulse':
        return [{
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.3],
          }),
        }];
      case 'shake':
        return [{
          translateX: anim.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-6, 0, 6],
          }),
        }];
      case 'spin':
        return [{
          rotate: anim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        }];
      case 'pop':
        return [{
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        }];
      default:
        return [];
    }
  };

  return (
    <Animated.Text style={[{ fontSize: size }, style, { transform: getTransform() }]}>
      🐰
    </Animated.Text>
  );
}