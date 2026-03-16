import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, View,
  StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../../theme';

export default function SenseButton({
  label, onPress, variant = 'filled', size = 'large',
  icon, loading = false, disabled = false,
  style, labelStyle, fullWidth = true,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 8 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, friction: 5 }).start();

  const V = {
    filled:    { bg: Colors.primary,          text: Colors.onPrimary,          border: null },
    tonal:     { bg: Colors.primaryContainer, text: Colors.onPrimaryContainer, border: null },
    outlined:  { bg: 'transparent',           text: Colors.primary,            border: Colors.primary },
    ghost:     { bg: 'transparent',           text: Colors.primary,            border: null },
    secondary: { bg: Colors.secondary,        text: Colors.onSecondary,        border: null },
    danger:    { bg: Colors.danger,           text: '#fff',                    border: null },
    warning:   { bg: Colors.warning,          text: '#fff',                    border: null },
    white:     { bg: '#fff',                  text: Colors.primary,            border: null },
  };

  const S = {
    small:  { h: 36, px: Spacing.md,  fs: 13 },
    medium: { h: 48, px: Spacing.lg,  fs: 15 },
    large:  { h: 56, px: Spacing.xl,  fs: 16 },
    xl:     { h: 64, px: Spacing.xxl, fs: 18 },
  };

  const v = V[variant] ?? V.filled;
  const s = S[size]    ?? S.large;

  return (
    <Animated.View style={[fullWidth && styles.full, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          styles.base,
          {
            height: s.h,
            paddingHorizontal: s.px,
            backgroundColor: disabled ? Colors.disabled : v.bg,
            borderWidth: v.border ? 1.5 : 0,
            borderColor: v.border || 'transparent',
          },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color={v.text} size="small" />
          : (
            <View style={styles.row}>
              {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
              <Text style={[
                Typography.labelLarge,
                { color: disabled ? Colors.onPrimary : v.text, fontSize: s.fs },
                labelStyle,
              ]}>
                {label}
              </Text>
            </View>
          )
        }
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
