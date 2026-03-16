import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';

const CATEGORY_STYLES = {
  DANGER:   { bg: Colors.dangerLight,  border: Colors.danger,  textColor: Colors.danger  },
  DOMESTIC: { bg: Colors.infoLight,    border: Colors.info,    textColor: Colors.info    },
  SPEECH:   { bg: Colors.successLight, border: Colors.success, textColor: Colors.success },
  AMBIENT:  { bg: Colors.surfaceVariant, border: Colors.disabled, textColor: Colors.subtitle },
};

export default function AlertBanner({ alert, onDismiss }) {
  const slide = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (!alert) return;
    Animated.spring(slide, { toValue: 0, friction: 7, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(slide, { toValue: -120, duration: 250, useNativeDriver: true })
        .start(() => onDismiss?.());
    }, alert.category === 'DANGER' ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [alert]);

  if (!alert) return null;
  const cs = CATEGORY_STYLES[alert.category] ?? CATEGORY_STYLES.AMBIENT;

  return (
    <Animated.View style={[styles.wrap, {
      backgroundColor: cs.bg,
      borderLeftColor: cs.border,
      transform: [{ translateY: slide }],
    }]}>
      <Text style={{ fontSize: 28, marginRight: Spacing.sm }}>{alert.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.titleSmall, { color: cs.textColor }]}>{alert.message}</Text>
        <Text style={[Typography.bodySmall,  { color: Colors.subtitle }]}>
          {alert.category} · just now
        </Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
        <Text style={{ color: cs.textColor, fontSize: 18 }}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderLeftWidth: 4, ...Shadow.lg,
  },
  dismiss: { padding: Spacing.sm },
});
