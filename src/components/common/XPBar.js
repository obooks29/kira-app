import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

export default function XPBar({ current, max, label, showLabel = true }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(current / Math.max(max, 1), 1),
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [current, max]);

  return (
    <View>
      {showLabel && (
        <View style={styles.row}>
          <Text style={[Typography.labelSmall, { color: Colors.onSurfaceVariant }]}>{label}</Text>
          <Text style={[Typography.labelSmall, { color: Colors.primary }]}>{current} / {max} XP</Text>
        </View>
      )}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, {
          width: anim.interpolate({ inputRange: [0,1], outputRange: ['0%','100%'] }),
        }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection:'row', justifyContent:'space-between', marginBottom: 5 },
  track: { height: 8, backgroundColor: Colors.primaryContainer, borderRadius: Radius.full, overflow:'hidden' },
  fill:  { height: 8, backgroundColor: Colors.primary, borderRadius: Radius.full },
});
