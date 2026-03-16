import React, { useRef, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../theme';

export default function EmergencyFAB({ onSOS }) {
  const [holding, setHolding] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const ring  = useRef(new Animated.Value(1)).current;
  const timer = useRef(null);

  const pulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1.8, duration: 700, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  const onPressIn = () => {
    setHolding(true);
    Animated.spring(scale, { toValue: 1.2, friction: 5, useNativeDriver: true }).start();
    pulse();
    timer.current = setTimeout(() => { onSOS?.(); }, 2000);
  };

  const onPressOut = () => {
    setHolding(false);
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    ring.stopAnimation(); ring.setValue(1);
    clearTimeout(timer.current);
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ring, {
        opacity: holding ? 0.25 : 0,
        transform: [{ scale: ring }],
      }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPressIn={onPressIn} onPressOut={onPressOut}
          activeOpacity={0.85} style={styles.fab}
        >
          <Text style={{ fontSize: 24 }}>🆘</Text>
          <Text style={styles.label}>{holding ? 'Hold…' : 'SOS'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', width: 80, height: 80,
    borderRadius: 40, backgroundColor: Colors.danger,
  },
  fab: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.danger, shadowOffset: { width:0, height:4 },
    shadowOpacity: 0.6, shadowRadius: 10, elevation: 10,
  },
  label: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1, marginTop: 1 },
});
