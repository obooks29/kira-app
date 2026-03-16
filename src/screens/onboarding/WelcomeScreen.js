import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import SenseButton from '../../components/common/SenseButton';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🤲',
    title: 'Your hands\nhave a voice.',
    sub: 'Sign language becomes spoken words instantly. No interpreter needed.',
    grad: Colors.gradientPrimary,
    light: true,
  },
  {
    emoji: '👂',
    title: 'Feel what\nyou can\'t hear.',
    sub: 'Fire alarms, your name being called, a baby crying — all turned into vibrations and visual alerts.',
    grad: ['#E0F2F1', '#B2DFDB'],
    light: false,
  },
  {
    emoji: '💬',
    title: 'Talk to\nanyone.',
    sub: 'Two-way live conversation. They speak, you type or sign. No awkwardness.',
    grad: [Colors.secondaryContainer, '#FFF3E0'],
    light: false,
  },
  {
    emoji: '🛡️',
    title: 'Someone always\nhas your back.',
    sub: 'One shake and your location goes to the people who love you. You are never alone.',
    grad: ['#E8F5E9', Colors.background],
    light: false,
  },
];

export default function WelcomeScreen({ navigation }) {
  const [idx, setIdx] = useState(0);
  const fade  = useRef(new Animated.Value(1)).current;
  const emoji = useRef(new Animated.Value(1)).current;

  const transition = (next) => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(emoji, { toValue: 0.5, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setIdx(next);
      Animated.parallel([
        Animated.timing(fade,  { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(emoji, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    });
  };

  const slide  = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;
  const tc     = slide.light ? '#fff' : Colors.onBackground;

  return (
    <LinearGradient colors={slide.grad} style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle={slide.light ? 'light-content' : 'dark-content'} />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('Onboarding')}>
          <Text style={[Typography.labelLarge, { color: tc, opacity: 0.6 }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <Animated.Text style={[styles.emoji, { transform: [{ scale: emoji }] }]}>
          {slide.emoji}
        </Animated.Text>
        <Text style={[styles.title, { color: tc }]}>{slide.title}</Text>
        <Text style={[styles.sub, { color: tc }]}>{slide.sub}</Text>
      </Animated.View>

      {/* Indicators */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => transition(i)}>
            <View style={[
              styles.dot,
              {
                width: i === idx ? 28 : 8,
                backgroundColor: i === idx
                  ? (slide.light ? '#fff' : Colors.primary)
                  : (slide.light ? 'rgba(255,255,255,0.4)' : Colors.disabled),
              },
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        {isLast ? (
          <SenseButton
            label="Get Started — Free  🎉"
            onPress={() => navigation.replace('Onboarding')}
            variant="secondary"
          />
        ) : (
          <SenseButton
            label="Next  →"
            onPress={() => transition(idx + 1)}
            variant={slide.light ? 'white' : 'filled'}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: Spacing.xl },
  skip:      { alignSelf: 'flex-end', padding: Spacing.sm },
  content:   { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.md },
  emoji:     { fontSize: 100, marginBottom: Spacing.xl },
  title:     { ...Typography.displayMedium, textAlign: 'center', fontWeight: '800', marginBottom: Spacing.md },
  sub:       { ...Typography.bodyLarge, textAlign: 'center', opacity: 0.82, lineHeight: 26 },
  dots:      { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs, marginBottom: Spacing.lg },
  dot:       { height: 8, borderRadius: Radius.full },
  cta:       {},
});
