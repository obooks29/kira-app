import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import SenseButton  from '../../components/common/SenseButton';
import SenseCard    from '../../components/common/SenseCard';
import { useApp }   from '../../utils/AppContext';

const VOICES = [
  { id:'1', name:'Warm & Friendly',  emoji:'😊', desc:'Kind and conversational' },
  { id:'2', name:'Professional',     emoji:'💼', desc:'Clear and formal'        },
  { id:'3', name:'Playful',          emoji:'🎉', desc:'Fun and energetic'       },
  { id:'4', name:'Calm & Gentle',    emoji:'🌿', desc:'Soft and soothing'       },
  { id:'5', name:'Bold & Confident', emoji:'💪', desc:'Assertive and strong'    },
  { id:'6', name:'Youthful',         emoji:'✨', desc:'Fresh and modern'        },
];

export default function OnboardingScreen({ navigation }) {
  const { dispatch } = useApp();
  const [step, setStep]               = useState(0);
  const [name, setName]               = useState('');
  const [voice, setVoice]             = useState(VOICES[0]);
  const [caregiverName, setCGName]    = useState('');
  const [caregiverPhone, setCGPhone]  = useState('');

  const finish = () => {
    dispatch({ type: 'SET_USER', payload: { name: name.trim(), voicePersonality: voice.name } });
    if (caregiverName.trim()) {
      dispatch({ type: 'SET_CAREGIVER', payload: { name: caregiverName, phone: caregiverPhone, relationship: 'Caregiver' } });
      dispatch({ type: 'SET_EMERGENCY_CONTACTS', payload: [{ name: caregiverName, phone: caregiverPhone, isPrimary: true }] });
    }
    dispatch({ type: 'COMPLETE_ONBOARDING' });
    // Small delay to let state update before navigation
    setTimeout(() => navigation.replace('MainTabs'), 50);
  };

  const STEPS = [
    {
      emoji: '🙋',
      title: `What should\nwe call you?`,
      sub: "This is your safe space. We'll make everything feel personal.",
      content: (
        <View>
          <Text style={styles.inputLabel}>Your name</Text>
          <TextInput
            value={name} onChangeText={setName}
            placeholder="e.g. Amara, Emeka, Ada…"
            placeholderTextColor={Colors.disabled}
            style={styles.input} autoFocus
          />
          <Text style={styles.hint}>You can always change this later ✌️</Text>
        </View>
      ),
      canNext: name.trim().length > 0,
    },
    {
      emoji: '🗣️',
      title: `Choose your\nvoice`,
      sub: "This is how SenseVoice speaks for you. Pick the one that feels like you.",
      content: (
        <View style={{ gap: Spacing.sm }}>
          {VOICES.map(v => (
            <TouchableOpacity key={v.id} onPress={() => setVoice(v)} activeOpacity={0.8}>
              <SenseCard
                variant={voice.id === v.id ? 'tonal' : 'elevated'} padding="md"
                style={voice.id === v.id ? { borderWidth:2, borderColor: Colors.primary } : {}}
              >
                <View style={styles.voiceRow}>
                  <Text style={{ fontSize: 26, marginRight: Spacing.md }}>{v.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>{v.name}</Text>
                    <Text style={[Typography.bodySmall,  { color: Colors.subtitle }]}>{v.desc}</Text>
                  </View>
                  {voice.id === v.id && (
                    <View style={styles.check}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </View>
              </SenseCard>
            </TouchableOpacity>
          ))}
        </View>
      ),
      canNext: true,
    },
    {
      emoji: '💙',
      title: `Add someone\nwho cares`,
      sub: "They'll get peace of mind. You stay in control of what they see.",
      content: (
        <View>
          <Text style={styles.inputLabel}>Their name (optional)</Text>
          <TextInput
            value={caregiverName} onChangeText={setCGName}
            placeholder="e.g. Mum, Dad, Ngozi…"
            placeholderTextColor={Colors.disabled} style={styles.input}
          />
          <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Their phone number</Text>
          <TextInput
            value={caregiverPhone} onChangeText={setCGPhone}
            placeholder="+234 ..."
            placeholderTextColor={Colors.disabled} style={styles.input}
            keyboardType="phone-pad"
          />
          <Text style={styles.hint}>You can skip this and add them later 🔒</Text>
        </View>
      ),
      canNext: true,
    },
    {
      emoji: '🌟',
      title: `You're all\nset, ${name || 'friend'}!`,
      sub: "SenseVoice is ready to be your voice, your ears, and your safety net.",
      content: (
        <SenseCard variant="tonal" padding="lg">
          <Text style={[Typography.titleMedium, { color: Colors.primary, textAlign:'center', marginBottom: Spacing.md }]}>
            Your Profile
          </Text>
          {[
            ['👤', name || 'You'],
            [voice.emoji, `${voice.name} voice`],
            caregiverName ? ['💙', `${caregiverName} connected`] : null,
          ].filter(Boolean).map(([e, t], i) => (
            <View key={i} style={styles.profileRow}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
              <Text style={[Typography.bodyLarge, { color: Colors.onBackground, marginLeft: Spacing.md }]}>{t}</Text>
            </View>
          ))}
        </SenseCard>
      ),
      canNext: true,
    },
  ];

  const s    = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: Colors.background }} behavior={Platform.OS==='ios'?'padding':'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Progress */}
        <View style={styles.progress}>
          {STEPS.map((_,i) => (
            <View key={i} style={[styles.progressSeg, {
              flex: i === step ? 2 : 1,
              backgroundColor: i <= step ? Colors.primary : Colors.disabled,
            }]} />
          ))}
        </View>

        <Text style={[Typography.labelMedium, { color: Colors.subtitle, marginBottom: Spacing.sm }]}>
          Step {step + 1} of {STEPS.length}
        </Text>

        <Text style={{ fontSize: 64, marginBottom: Spacing.md }}>{s.emoji}</Text>
        <Text style={[Typography.headlineMedium, { color: Colors.onBackground, marginBottom: Spacing.sm }]}>
          {s.title}
        </Text>
        <Text style={[Typography.bodyLarge, { color: Colors.subtitle, marginBottom: Spacing.xl }]}>
          {s.sub}
        </Text>

        {s.content}

        <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
          <SenseButton
            label={last ? "Let's Go! 🚀" : "Continue  →"}
            onPress={last ? finish : () => setStep(n => n + 1)}
            disabled={!s.canNext}
          />
          {step > 0 && (
            <SenseButton label="← Back" onPress={() => setStep(n => n - 1)} variant="ghost" />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.xl },
  progress:    { flexDirection:'row', gap:4, height:4, marginBottom: Spacing.lg },
  progressSeg: { height:4, borderRadius: Radius.full },
  inputLabel:  { ...Typography.labelLarge, color: Colors.primary, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.md, fontSize:18, color: Colors.onBackground,
    borderWidth:1.5, borderColor: Colors.primaryContainer, ...Shadow.sm,
  },
  hint:        { ...Typography.bodySmall, color: Colors.subtitle, textAlign:'center', marginTop: Spacing.sm },
  voiceRow:    { flexDirection:'row', alignItems:'center' },
  check:       { width:26, height:26, borderRadius:13, backgroundColor: Colors.primary, alignItems:'center', justifyContent:'center' },
  profileRow:  { flexDirection:'row', alignItems:'center', paddingVertical: Spacing.xs },
});
