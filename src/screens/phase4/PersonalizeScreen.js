import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import Tts from 'react-native-tts';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import SenseCard   from '../../components/common/SenseCard';
import SenseButton from '../../components/common/SenseButton';
import { useApp }  from '../../utils/AppContext';
import { naturalizeText } from '../../services/NovaService';

const VOICES = [
  { id: '1', name: 'Warm & Friendly',  emoji: '😊', preview: 'Hello! It is so lovely to meet you today.' },
  { id: '2', name: 'Professional',     emoji: '💼', preview: 'Good morning. How may I assist you today?' },
  { id: '3', name: 'Playful',          emoji: '🎉', preview: 'Hey hey! Super excited to chat with you!' },
  { id: '4', name: 'Calm & Gentle',    emoji: '🌿', preview: 'Hello. I am here and happy to help you.' },
  { id: '5', name: 'Bold & Confident', emoji: '💪', preview: 'Hello. I speak clearly and with confidence.' },
  { id: '6', name: 'Youthful',         emoji: '✨', preview: 'Hey! What is up? Ready to talk!' },
];

const SIGN_LANGS = [
  { code: 'NSL',  name: 'Nigerian Sign Language', flag: '🇳🇬', locked: false },
  { code: 'ASL',  name: 'American Sign Language',  flag: '🇺🇸', locked: false },
  { code: 'BSL',  name: 'British Sign Language',   flag: '🇬🇧', locked: true },
  { code: 'LSF',  name: 'French Sign Language',    flag: '🇫🇷', locked: true },
  { code: 'SASL', name: 'South African SL',        flag: '🇿🇦', locked: true },
];

export default function PersonalizeScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [selectedVoice, setSelectedVoice] = useState(
    VOICES.find(v => v.name === state.user.voicePersonality) || VOICES[0]
  );
  const [selectedLang, setSelectedLang] = useState(state.user.signLanguage || 'NSL');
  const [previewing, setPreviewing]     = useState(null); // voice id being previewed
  const [saved, setSaved]               = useState(false);

  const previewVoice = async (voice) => {
    if (previewing) { Tts.stop(); }
    setPreviewing(voice.id);
    try {
      // Ask Nova to naturalize the preview in that personality
      const natural = await naturalizeText(voice.preview, voice.name).catch(() => voice.preview);
      Tts.speak(natural);
      Tts.addEventListener('tts-finish', () => {
        setPreviewing(null);
        Tts.removeAllListeners('tts-finish');
      });
    } catch {
      Tts.speak(voice.preview);
      setPreviewing(null);
    }
  };

  const save = () => {
    dispatch({ type: 'SET_USER', payload: {
      voicePersonality: selectedVoice.name,
      signLanguage: selectedLang,
    }});
    dispatch({ type: 'ADD_XP', payload: 10 });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigation.goBack();
    }, 800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize: 22, color: Colors.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[Typography.titleLarge, { color: Colors.onBackground }]}>🎨 Personalize</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>

        {/* Voice Personality */}
        <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginBottom: Spacing.xs }]}>
          Your Voice Personality
        </Text>
        <Text style={[Typography.bodySmall, { color: Colors.subtitle, marginBottom: Spacing.md }]}>
          This is how Nova speaks for you. Tap 🔊 to preview.
        </Text>
        <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
          {VOICES.map(v => (
            <TouchableOpacity key={v.id} onPress={() => setSelectedVoice(v)} activeOpacity={0.8}>
              <SenseCard
                variant={selectedVoice.id === v.id ? 'tonal' : 'elevated'}
                padding="md"
                style={selectedVoice.id === v.id ? { borderWidth: 2, borderColor: Colors.primary } : {}}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <Text style={{ fontSize: 28 }}>{v.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>{v.name}</Text>
                    <Text style={[Typography.bodySmall, { color: Colors.subtitle }]} numberOfLines={1}>
                      "{v.preview}"
                    </Text>
                  </View>
                  {/* Preview button */}
                  <TouchableOpacity
                    onPress={() => previewVoice(v)}
                    style={[styles.previewBtn, previewing === v.id && { backgroundColor: Colors.primary }]}
                  >
                    <Text style={{ fontSize: 18 }}>{previewing === v.id ? '🔊' : '▶️'}</Text>
                  </TouchableOpacity>
                  {selectedVoice.id === v.id && (
                    <View style={styles.check}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </View>
              </SenseCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Language */}
        <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginBottom: Spacing.xs }]}>
          Sign Language
        </Text>
        <Text style={[Typography.bodySmall, { color: Colors.subtitle, marginBottom: Spacing.md }]}>
          Affects how Nova reads your signs.
        </Text>
        <View style={{ gap: Spacing.sm, marginBottom: Spacing.xl }}>
          {SIGN_LANGS.map(l => (
            <TouchableOpacity
              key={l.code}
              onPress={() => !l.locked && setSelectedLang(l.code)}
              disabled={l.locked}
              activeOpacity={l.locked ? 1 : 0.8}
            >
              <SenseCard
                variant={selectedLang === l.code ? 'tonal' : 'elevated'}
                padding="md"
                style={[
                  selectedLang === l.code ? { borderWidth: 2, borderColor: Colors.primary } : {},
                  l.locked ? { opacity: 0.55 } : {},
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <Text style={{ fontSize: 28 }}>{l.flag}</Text>
                  <Text style={[Typography.titleSmall, { color: Colors.onBackground, flex: 1 }]}>{l.name}</Text>
                  {l.locked && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={[Typography.labelSmall, { color: Colors.subtitle }]}>Coming Soon</Text>
                    </View>
                  )}
                  {selectedLang === l.code && !l.locked && (
                    <View style={styles.check}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </View>
              </SenseCard>
            </TouchableOpacity>
          ))}
        </View>

        <SenseButton
          label={saved ? '✅ Saved!' : 'Save Changes'}
          onPress={save}
          variant={saved ? 'success' : 'filled'}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.md },
  back:            { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  check:           { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  previewBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  comingSoonBadge: { backgroundColor: Colors.surfaceVariant, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
});