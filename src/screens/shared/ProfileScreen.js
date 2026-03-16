import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import SenseCard  from '../../components/common/SenseCard';
import XPBar      from '../../components/common/XPBar';
import StreakBadge from '../../components/common/StreakBadge';
import { useApp } from '../../utils/AppContext';

export default function ProfileScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const u = state.user;

  return (
    <View style={{ flex:1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize:22, color: Colors.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[Typography.titleLarge, { color: Colors.onBackground }]}>👤 My Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={{ fontSize:22 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 60 }}>
        {/* Avatar */}
        <View style={{ alignItems:'center', marginBottom: Spacing.lg }}>
          <View style={styles.avatar}>
            <Text style={{ fontSize:64 }}>🧑</Text>
          </View>
          <Text style={[Typography.headlineSmall, { color: Colors.onBackground, marginTop: Spacing.sm }]}>
            {u.name || 'My Profile'}
          </Text>
          <StreakBadge days={u.streakDays} />
          <Text style={[Typography.bodySmall, { color: Colors.subtitle, marginTop: Spacing.xs }]}>
            {u.voicePersonality} Voice · {u.signLanguage || 'NSL'}
          </Text>
        </View>

        {/* XP + Level */}
        <SenseCard variant="tonal" padding="lg" style={{ marginBottom: Spacing.md }}>
          <Text style={[Typography.titleMedium, { color: Colors.primary, textAlign:'center' }]}>
            Level {u.level}  ·  {u.xpPoints} XP
          </Text>
          <XPBar current={u.xpPoints % 500} max={500} label="Level Progress" />
        </SenseCard>

        {/* Stats Grid */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
          {[
            { emoji:'💬', label:'Conversations', value: u.totalConversations },
            { emoji:'🏆', label:'Milestones',    value: u.milestones.length  },
            { emoji:'🔥', label:'Day Streak',    value: u.streakDays         },
            { emoji:'⚡', label:'Total XP',      value: u.xpPoints           },
          ].map(s => (
            <SenseCard key={s.label} variant="elevated" padding="md" style={{ width:'47%', alignItems:'center' }}>
              <Text style={{ fontSize:28 }}>{s.emoji}</Text>
              <Text style={[Typography.headlineSmall, { color: Colors.primary }]}>{s.value}</Text>
              <Text style={[Typography.labelSmall, { color: Colors.subtitle }]}>{s.label}</Text>
            </SenseCard>
          ))}
        </View>

        {/* Quick Links */}
        {[
          { emoji:'🏆', label:'View all milestones', route:'Milestones' },
          { emoji:'🎨', label:'Personalize voice & language', route:'Personalize' },
          { emoji:'📦', label:'Vocabulary packs', route:'LanguagePacks' },
          { emoji:'💙', label:'Caregiver dashboard', route:'Caregiver' },
        ].map(link => (
          <TouchableOpacity key={link.route} onPress={() => navigation.navigate(link.route)}>
            <SenseCard variant="elevated" padding="md" style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.md }}>
                <Text style={{ fontSize:24 }}>{link.emoji}</Text>
                <Text style={[Typography.titleSmall, { color: Colors.onBackground, flex:1 }]}>{link.label}</Text>
                <Text style={{ color: Colors.primary, fontSize:18 }}>›</Text>
              </View>
            </SenseCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: Spacing.md, paddingTop:56, paddingBottom: Spacing.md },
  back:   { width:40, height:40, alignItems:'center', justifyContent:'center' },
  avatar: { width:100, height:100, borderRadius:50, backgroundColor: Colors.primaryContainer, alignItems:'center', justifyContent:'center', ...Shadow.lg },
});
