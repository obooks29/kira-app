import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import SenseCard      from '../../components/common/SenseCard';
import MilestoneToast from '../../components/common/MilestoneToast';
import StreakBadge    from '../../components/common/StreakBadge';
import { useApp }     from '../../utils/AppContext';
import { naturalizeText } from '../../services/NovaService';
import BunnieIcon from '../../components/common/BunnieIcon';

const MODULES = [
  { id:'voice',  emoji:'🤲', title:'My Voice',   sub:'Sign → Speech',      color:'#1565C0', route:'MyVoice'     },
  { id:'ears',   emoji:'👂', title:'My Ears',    sub:'Sound Alerts',        color:'#00838F', route:'MyEars'      },
  { id:'talk',   emoji:'💬', title:'Talk',       sub:'Live Conversation',   color:'#6A1B9A', route:'Conversation' },
  { id:'world',  emoji:'🌍', title:'My World',   sub:'Scene Understanding', color:'#2E7D32', route:'MyWorld'     },
  { id:'safety', emoji:'🛡️', title:'My Safety',  sub:'Emergency System',   color:'#C62828', route:'MySafety'    },
  { id:'care',   emoji:'💙', title:'Caregiver',  sub:'Family Dashboard',    color:'#4527A0', route:'Caregiver'   },
];

const STATIC_TIPS = [
  '💡 Hold your hand steady for best sign recognition',
  '📱 Keep screen brightness high in noisy environments',
  '🔔 Enable notifications for real-time sound alerts',
  '🤝 Practice 5 signs a day to build your vocabulary',
  '🌍 Use My World to understand any scene around you',
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [milestone, setMilestone] = useState(null);
  const [tip, setTip]             = useState(STATIC_TIPS[0]);
  const [tipLoaded, setTipLoaded]   = useState(0);
  const [tipIdx, setTipIdx]       = useState(0);
  const headerFade = useRef(new Animated.Value(0)).current;
  const cardAnims  = useRef(MODULES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Entrance animations
    Animated.timing(headerFade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, { toValue: 1, duration: 400, delay: 200 + i * 90, useNativeDriver: true }).start();
    });

    // Welcome milestone on first launch
    if (state.user.milestones.length === 0) {
      setTimeout(() => {
        setMilestone({ emoji: '🌟', title: 'Welcome to Kira!', desc: 'Your journey begins', xp: 50 });
        dispatch({ type: 'ADD_MILESTONE', payload: { id: 'welcome', emoji: '🌟', title: 'Welcome!', xp: 50, date: new Date().toISOString() } });
      }, 1800);
    }

    // Rotate static tips every 5s
    const tipTimer = setInterval(() => {
      setTipIdx(i => {
        const next = (i + 1) % STATIC_TIPS.length;
        setTip(STATIC_TIPS[next]);
        return next;
      });
    }, 5000);

    // Ask Nova for a personalised tip in the background
    fetchBunnieTip();

    return () => clearInterval(tipTimer);
  }, []);

  const fetchBunnieTip = async () => {
    try {
      const natural = await naturalizeText(
        `Give one short motivational tip for a deaf person using a communication app today. Max 12 words.`,
        'Warm & Friendly'
      );
      if (natural && natural.length < 100) { setTip('🐰 Bunnie: ' + natural); setTipLoaded(t => t + 1); }
    } catch { /* keep static tip */ }
  };

  const xpInLevel = state.user.xpPoints % 500;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Hero Header ── */}
        <LinearGradient colors={Colors.gradientPrimary} style={styles.hero}>
          <Animated.View style={{ opacity: headerFade }}>
            <View style={styles.heroTop}>
              <View>
                <Text style={[Typography.bodyMedium, { color: 'rgba(255,255,255,0.75)' }]}>
                  {greeting()},
                </Text>
                <Text style={[Typography.headlineLarge, { color: '#fff' }]}>
                  {state.user.name || 'friend'} 👋
                </Text>
              </View>
              <View style={styles.heroRight}>
                <StreakBadge days={state.user.streakDays} />
                <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
                  <Text style={{ fontSize: 28 }}>🧑</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* XP bar */}
            <View style={styles.xpSection}>
              <View style={styles.xpRow}>
                <Text style={[Typography.labelMedium, { color: 'rgba(255,255,255,0.8)' }]}>
                  Level {state.user.level}
                </Text>
                <Text style={[Typography.labelMedium, { color: 'rgba(255,255,255,0.8)' }]}>
                  ⚡ {state.user.xpPoints} XP
                </Text>
              </View>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${(xpInLevel / 500) * 100}%` }]} />
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Daily Goal ── */}
        <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.md }}>
          <SenseCard variant="elevated" padding="md">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Text style={{ fontSize: 28 }}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.titleSmall, { color: Colors.primary }]}>Today's Goal</Text>
                <Text style={[Typography.bodyMedium, { color: Colors.onSurfaceVariant }]}>
                  Have 3 conversations
                </Text>
              </View>
              <View>
                <Text style={[Typography.headlineSmall, { color: Colors.primary, textAlign: 'right' }]}>
                  {Math.min(state.user.totalConversations, 3)}/3
                </Text>
                {state.user.totalConversations >= 3 && <Text style={{ textAlign: 'right' }}>✅</Text>}
              </View>
            </View>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${Math.min(state.user.totalConversations / 3, 1) * 100}%` }]} />
            </View>
          </SenseCard>
        </View>

        {/* ── Bunnie Tip ── */}
        <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.sm }}>
          <SenseCard variant="tonal" padding="sm">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <BunnieIcon size={20} animation="bounce" trigger={tipLoaded} />
              <Text style={[Typography.bodySmall, { color: Colors.onPrimaryContainer, flex: 1 }]}>{tip}</Text>
            </View>
          </SenseCard>
        </View>

        {/* ── Module Grid — NO phase badges ── */}
        <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.lg }}>
          <Text style={[Typography.titleLarge, { color: Colors.onBackground, marginBottom: Spacing.md }]}>
            Your Tools
          </Text>
          <View style={styles.grid}>
            {MODULES.map((mod, i) => (
              <Animated.View key={mod.id} style={{
                width: '48%',
                opacity: cardAnims[i],
                transform: [{ translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              }}>
                <TouchableOpacity onPress={() => navigation.navigate(mod.route)} activeOpacity={0.82}>
                  <SenseCard variant="elevated" padding="lg" style={{ alignItems: 'center', minHeight: 130 }}>
                    <View style={[styles.iconCircle, { backgroundColor: mod.color + '15' }]}>
                      <Text style={{ fontSize: 36 }}>{mod.emoji}</Text>
                    </View>
                    <Text style={[Typography.titleSmall, { color: Colors.onBackground, textAlign: 'center', marginTop: Spacing.sm }]}>
                      {mod.title}
                    </Text>
                    <Text style={[Typography.bodySmall, { color: Colors.subtitle, textAlign: 'center' }]}>
                      {mod.sub}
                    </Text>
                  </SenseCard>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.lg }}>
          <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginBottom: Spacing.sm }]}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {[
              { emoji: '📖', label: 'Phrases',     route: 'QuickPhrases' },
              { emoji: '🏆', label: 'Milestones',  route: 'Milestones'   },
              { emoji: '⚙️', label: 'Settings',    route: 'Settings'     },
              { emoji: '🎨', label: 'Personalize', route: 'Personalize'  },
            ].map(qa => (
              <TouchableOpacity
                key={qa.route}
                onPress={() => navigation.navigate(qa.route)}
                style={styles.quickAction}
              >
                <Text style={{ fontSize: 22 }}>{qa.emoji}</Text>
                <Text style={[Typography.labelSmall, { color: Colors.onSurfaceVariant, textAlign: 'center', marginTop: 3 }]}>
                  {qa.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {[
              { emoji: '💬', label: 'Conversations', value: state.user.totalConversations },
              { emoji: '👂', label: 'Alerts',         value: state.soundAlerts?.length ?? 0 },
              { emoji: '🏆', label: 'Milestones',     value: state.user.milestones.length },
              { emoji: '🔥', label: 'Day Streak',     value: state.user.streakDays },
            ].map(s => (
              <SenseCard key={s.label} variant="elevated" padding="sm" style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                <Text style={[Typography.headlineSmall, { color: Colors.primary }]}>{s.value}</Text>
                <Text style={[Typography.labelSmall, { color: Colors.subtitle, textAlign: 'center' }]}>{s.label}</Text>
              </SenseCard>
            ))}
          </View>
        </View>

      </ScrollView>

      <MilestoneToast milestone={milestone} onDone={() => setMilestone(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero:        { paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.lg, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroRight:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatarBtn:   { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  xpSection:   { marginTop: Spacing.md },
  xpRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpTrack:     { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: Radius.full, overflow: 'hidden' },
  xpFill:      { height: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: Radius.full },
  goalTrack:   { height: 4, backgroundColor: Colors.primaryContainer, borderRadius: Radius.full, marginTop: Spacing.sm, overflow: 'hidden' },
  goalFill:    { height: 4, backgroundColor: Colors.primary, borderRadius: Radius.full },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  iconCircle:  { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  quickAction: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, alignItems: 'center', paddingVertical: Spacing.md, ...Shadow.sm },
});
