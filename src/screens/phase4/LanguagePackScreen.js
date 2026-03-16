import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import SenseCard from '../../components/common/SenseCard';
import { useApp } from '../../utils/AppContext';

const PACKS = [
  { id: 'medical',    emoji: '🏥', name: 'Medical',     desc: 'Hospital, doctor, symptoms vocabulary',  words: 200, free: true  },
  { id: 'legal',      emoji: '⚖️', name: 'Legal',       desc: 'Court, police, rights vocabulary',        words: 150, free: false },
  { id: 'education',  emoji: '🏫', name: 'Education',   desc: 'Classroom, study, teacher vocabulary',    words: 180, free: true  },
  { id: 'restaurant', emoji: '🍽️', name: 'Restaurant',  desc: 'Food, order, payment vocabulary',         words: 120, free: true  },
  { id: 'travel',     emoji: '✈️', name: 'Travel',      desc: 'Airport, transport, directions',          words: 200, free: false },
  { id: 'business',   emoji: '💼', name: 'Business',    desc: 'Office, meetings, professional',          words: 170, free: false },
  { id: 'shopping',   emoji: '🛒', name: 'Shopping',    desc: 'Store, sizes, returns, payment',          words: 130, free: true  },
  { id: 'banking',    emoji: '🏦', name: 'Banking',     desc: 'Account, transfer, ATM vocabulary',       words: 100, free: false },
];

export default function LanguagePackScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [downloading, setDownloading] = useState(null);

  // Downloaded packs stored in AppContext settings
  const downloaded = state.settings.downloadedPacks ?? [];
  const isDownloaded = (id) => downloaded.includes(id);

  const handleDownload = (pack) => {
    if (!pack.free) {
      Alert.alert(
        `${pack.name} Pack`,
        'Premium packs are coming soon in the full release. The free packs are available now!',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isDownloaded(pack.id)) {
      Alert.alert(`${pack.name} already downloaded`, 'This pack is active and ready to use.', [{ text: 'OK' }]);
      return;
    }

    setDownloading(pack.id);

    // Simulate download (in production this would fetch actual word lists)
    setTimeout(() => {
      dispatch({
        type: 'SET_SETTINGS',
        payload: { downloadedPacks: [...downloaded, pack.id] },
      });
      dispatch({ type: 'ADD_XP', payload: 15 });
      setDownloading(null);

      // Award milestone for first pack
      if (downloaded.length === 0) {
        dispatch({ type: 'ADD_MILESTONE', payload: {
          id: 'first_pack', emoji: '📦', title: 'Pack Pioneer', xp: 50, date: new Date().toISOString(),
        }});
      }
    }, 1200);
  };

  const freePacks   = PACKS.filter(p => p.free);
  const premiumPacks = PACKS.filter(p => !p.free);

  const PackCard = ({ pack }) => {
    const dlState = isDownloaded(pack.id) ? 'done' : downloading === pack.id ? 'loading' : 'idle';
    return (
      <SenseCard variant="elevated" padding="md" style={{ marginBottom: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <Text style={{ fontSize: 32 }}>{pack.emoji}</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>{pack.name}</Text>
              {pack.free && (
                <View style={styles.freeBadge}>
                  <Text style={[Typography.labelSmall, { color: Colors.success }]}>FREE</Text>
                </View>
              )}
              {dlState === 'done' && (
                <View style={styles.doneBadge}>
                  <Text style={[Typography.labelSmall, { color: Colors.primary }]}>✓ Active</Text>
                </View>
              )}
            </View>
            <Text style={[Typography.bodySmall, { color: Colors.subtitle }]}>{pack.desc}</Text>
            <Text style={[Typography.labelSmall, { color: Colors.primaryLight ?? Colors.primary, marginTop: 3 }]}>
              {pack.words} words & phrases
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDownload(pack)}
            style={[
              styles.dlBtn,
              dlState === 'done'    && styles.dlBtnDone,
              dlState === 'loading' && styles.dlBtnLoading,
              !pack.free && dlState === 'idle' && styles.dlBtnLocked,
            ]}
          >
            <Text style={{ fontSize: 18 }}>
              {dlState === 'done'    ? '✅' :
               dlState === 'loading' ? '⏳' :
               pack.free             ? '⬇️' : '🔒'}
            </Text>
          </TouchableOpacity>
        </View>
      </SenseCard>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize: 22, color: Colors.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[Typography.titleLarge, { color: Colors.onBackground }]}>📦 Vocabulary Packs</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
          <SenseCard variant="tonal" padding="sm" style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[Typography.headlineSmall, { color: Colors.primary }]}>{downloaded.length}</Text>
            <Text style={[Typography.labelSmall, { color: Colors.subtitle }]}>Downloaded</Text>
          </SenseCard>
          <SenseCard variant="tonal" padding="sm" style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[Typography.headlineSmall, { color: Colors.primary }]}>
              {PACKS.reduce((sum, p) => isDownloaded(p.id) ? sum + p.words : sum, 0)}
            </Text>
            <Text style={[Typography.labelSmall, { color: Colors.subtitle }]}>Words Active</Text>
          </SenseCard>
          <SenseCard variant="tonal" padding="sm" style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[Typography.headlineSmall, { color: Colors.primary }]}>{freePacks.length}</Text>
            <Text style={[Typography.labelSmall, { color: Colors.subtitle }]}>Free Packs</Text>
          </SenseCard>
        </View>

        <SenseCard variant="tonal" padding="md" style={{ marginBottom: Spacing.md }}>
          <Text style={[Typography.bodyMedium, { color: Colors.onPrimaryContainer }]}>
            💡 Download packs to expand Quick Phrases and improve sign recognition in specific contexts.
          </Text>
        </SenseCard>

        {/* Free packs */}
        <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginBottom: Spacing.sm }]}>
          Free Packs
        </Text>
        {freePacks.map(pack => <PackCard key={pack.id} pack={pack} />)}

        {/* Premium packs */}
        <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginTop: Spacing.lg, marginBottom: Spacing.sm }]}>
          Premium Packs
        </Text>
        <SenseCard variant="outlined" padding="sm" style={{ marginBottom: Spacing.sm }}>
          <Text style={[Typography.bodySmall, { color: Colors.subtitle, textAlign: 'center' }]}>
            🔒 Coming in full release · Free during beta
          </Text>
        </SenseCard>
        {premiumPacks.map(pack => <PackCard key={pack.id} pack={pack} />)}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.md },
  back:         { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  freeBadge:    { backgroundColor: Colors.successLight ?? '#E8F5E9', borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  doneBadge:    { backgroundColor: Colors.primaryContainer, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  dlBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  dlBtnDone:    { backgroundColor: Colors.primaryContainer },
  dlBtnLoading: { backgroundColor: Colors.surfaceVariant },
  dlBtnLocked:  { backgroundColor: Colors.surfaceVariant },
});