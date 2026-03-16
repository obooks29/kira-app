import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';

export default function StreakBadge({ days }) {
  if (!days || days === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.flame}>🔥</Text>
      <Text style={[Typography.labelSmall, styles.count]}>{days}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.tertiaryContainer,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  flame: { fontSize: 12 },
  count: { color: Colors.warning, marginLeft: 2 },
});
