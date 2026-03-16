import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

export default function MilestoneToast({ milestone, onDone }) {
  const slide   = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!milestone) return;
    Animated.parallel([
      Animated.spring(slide,   { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slide,   { toValue: 120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,   duration: 300, useNativeDriver: true }),
      ]).start(() => onDone?.());
    }, 3800);
    return () => clearTimeout(t);
  }, [milestone]);

  if (!milestone) return null;
  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ translateY: slide }] }]}>
      <Text style={{ fontSize: 32 }}>{milestone.emoji}</Text>
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>{milestone.title}</Text>
        <Text style={[Typography.bodySmall,  { color: Colors.subtitle }]}>{milestone.desc}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={[Typography.labelSmall, { color: Colors.onTertiary ?? '#fff' }]}>+{milestone.xp} XP</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, ...Shadow.xl,
    borderLeftWidth: 4, borderLeftColor: Colors.tertiary,
  },
  badge: {
    backgroundColor: Colors.tertiary, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
});
