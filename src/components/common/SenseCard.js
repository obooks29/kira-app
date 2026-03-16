import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../../theme';

export default function SenseCard({
  children, style, variant = 'elevated', padding = 'md',
}) {
  const P = { none: 0, xs: Spacing.xs, sm: Spacing.sm, md: Spacing.md, lg: Spacing.lg, xl: Spacing.xl };
  const V = {
    elevated: { ...Shadow.md, backgroundColor: Colors.surface },
    filled:   { backgroundColor: Colors.surfaceVariant },
    outlined: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
    tonal:    { backgroundColor: Colors.primaryContainer },
    danger:   { backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.danger + '40' },
    warning:  { backgroundColor: Colors.warningLight },
    success:  { backgroundColor: Colors.successLight },
  };
  return (
    <View style={[styles.base, V[variant] ?? V.elevated, { padding: P[padding] ?? Spacing.md }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.xl, overflow: 'hidden' },
});
