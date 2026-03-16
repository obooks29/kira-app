import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import SenseCard from '../../components/common/SenseCard';
import XPBar     from '../../components/common/XPBar';
import { useApp } from '../../utils/AppContext';

const ALL_MILESTONES = [
  { id:'welcome',      emoji:'🌟', title:'Welcome!',              desc:'Joined SenseVoice',               xp:50,  unlocked:true  },
  { id:'first_voice',  emoji:'🗣️', title:'First Words',           desc:'Spoke your first phrase',          xp:100, unlocked:false },
  { id:'first_convo',  emoji:'💬', title:'First Conversation',    desc:'Completed a live conversation',    xp:150, unlocked:false },
  { id:'streak_3',     emoji:'🔥', title:'3-Day Streak',          desc:'Used SenseVoice 3 days in a row',  xp:100, unlocked:false },
  { id:'solo_order',   emoji:'🍔', title:'Independent Order',     desc:'Ordered food alone',               xp:200, unlocked:false },
  { id:'100_phrases',  emoji:'📖', title:'Phrase Master',         desc:'Used 100 quick phrases',           xp:150, unlocked:false },
  { id:'first_alert',  emoji:'👂', title:'Sound Aware',           desc:'Received your first sound alert',  xp:75,  unlocked:false },
  { id:'emergency_set',emoji:'🛡️', title:'Safety Ready',          desc:'Set up emergency contacts',        xp:100, unlocked:false },
  { id:'streak_7',     emoji:'🔥', title:'7-Day Streak',          desc:'A whole week of independence!',    xp:200, unlocked:false },
  { id:'caregiver',    emoji:'💙', title:'Connected',             desc:'Caregiver dashboard set up',       xp:75,  unlocked:false },
  { id:'scene_5',      emoji:'🌍', title:'World Explorer',        desc:'Analysed 5 scenes',                xp:100, unlocked:false },
  { id:'1000xp',       emoji:'⚡', title:'Power User',            desc:'Earned 1000 XP',                   xp:250, unlocked:false },
];

export default function MilestonesScreen({ navigation }) {
  const { state } = useApp();
  const unlockedIds = new Set(state.user.milestones.map(m => m.id));

  const unlocked = ALL_MILESTONES.filter(m => unlockedIds.has(m.id) || m.unlocked);
  const locked   = ALL_MILESTONES.filter(m => !unlockedIds.has(m.id) && !m.unlocked);

  return (
    <View style={{ flex:1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize:22, color: Colors.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[Typography.titleLarge, { color: Colors.onBackground }]}>🏆 Milestones</Text>
        <View style={styles.xpChip}>
          <Text style={[Typography.labelMedium, { color: Colors.warning }]}>⚡ {state.user.xpPoints} XP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>
        {/* Level card */}
        <SenseCard variant="tonal" padding="lg" style={{ marginBottom: Spacing.lg }}>
          <Text style={[Typography.headlineSmall, { color: Colors.primary, textAlign:'center' }]}>
            Level {state.user.level}
          </Text>
          <XPBar
            current={state.user.xpPoints % 500}
            max={500}
            label="Progress to next level"
          />
          <Text style={[Typography.bodySmall, { color: Colors.subtitle, textAlign:'center', marginTop: Spacing.xs }]}>
            {state.user.xpPoints} total XP earned
          </Text>
        </SenseCard>

        {/* Unlocked */}
        <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginBottom: Spacing.sm }]}>
          Unlocked ({unlocked.length})
        </Text>
        {unlocked.map(m => (
          <SenseCard key={m.id} variant="elevated" padding="md" style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.md }}>
              <View style={styles.emojiCircle}>
                <Text style={{ fontSize:32 }}>{m.emoji}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>{m.title}</Text>
                <Text style={[Typography.bodySmall,  { color: Colors.subtitle }]}>{m.desc}</Text>
              </View>
              <View style={styles.xpBadge}>
                <Text style={[Typography.labelSmall, { color: Colors.onTertiary ?? '#fff' }]}>+{m.xp}</Text>
              </View>
            </View>
          </SenseCard>
        ))}

        {/* Locked */}
        <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginTop: Spacing.lg, marginBottom: Spacing.sm }]}>
          Coming Up ({locked.length})
        </Text>
        {locked.map(m => (
          <SenseCard key={m.id} variant="outlined" padding="md" style={{ marginBottom: Spacing.sm, opacity:0.55 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.md }}>
              <View style={[styles.emojiCircle, { backgroundColor: Colors.surfaceVariant }]}>
                <Text style={{ fontSize:32, opacity:0.5 }}>🔒</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={[Typography.titleSmall, { color: Colors.onSurfaceVariant }]}>{m.title}</Text>
                <Text style={[Typography.bodySmall,  { color: Colors.disabled }]}>{m.desc}</Text>
              </View>
              <Text style={[Typography.labelSmall, { color: Colors.disabled }]}>+{m.xp} XP</Text>
            </View>
          </SenseCard>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: Spacing.md, paddingTop:56, paddingBottom: Spacing.md },
  back:       { width:40, height:40, alignItems:'center', justifyContent:'center' },
  xpChip:     { backgroundColor: Colors.tertiaryContainer, borderRadius: Radius.full, paddingHorizontal:10, paddingVertical:5 },
  emojiCircle:{ width:56, height:56, borderRadius:28, backgroundColor: Colors.primaryContainer, alignItems:'center', justifyContent:'center' },
  xpBadge:    { backgroundColor: Colors.tertiary, borderRadius: Radius.full, paddingHorizontal:8, paddingVertical:4 },
});
