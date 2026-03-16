import React, { useState, useRef } from 'react';
import Tts from 'react-native-tts';
import { sonicSpeak, sonicStop } from '../../services/NovaSonicService';
import BunnieIcon from '../../components/common/BunnieIcon';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, StatusBar, Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useApp } from '../../utils/AppContext';
import { naturalizeText } from '../../services/NovaService';
import Video from 'react-native-video';

const PHRASE_LIBRARY = {
  Greetings:  ['Hello!', 'Good morning!', 'Good afternoon!', 'How are you?', 'Nice to meet you!', 'Goodbye!', 'See you later!', 'Have a good day!'],
  Needs:      ['Please help me', 'I need water', 'I need a doctor', 'Can I sit here?', 'Where is the toilet?', 'I am hungry', 'I am lost', 'I need directions'],
  Questions:  ['How much does this cost?', 'Where is…?', 'What time is it?', 'Can you write that?', 'Do you understand?', 'Can you speak slowly?', 'What does this mean?', 'Is this the right way?'],
  Responses:  ['Yes', 'No', 'Maybe', 'I understand', "I don't understand", 'Thank you', "You're welcome", "I'm sorry", 'No problem', 'Please repeat that'],
  Emergency:  ['I am deaf and mute', 'Call an ambulance', 'Call the police', 'I need help urgently', 'Please call my family', 'I have a medical condition', 'This is my emergency card'],
  Shopping:   ['How much?', 'Do you have this in…?', 'Can I try this?', "I'll take this", 'Do you accept cards?', 'Can I have a receipt?', 'This is the wrong size', 'Is there a discount?'],
  Food:       ['I am allergic to…', 'No nuts please', 'Vegetarian please', 'Is this spicy?', 'The bill please', 'Very delicious!', 'More water please', 'What is this dish?'],
};

const CATEGORY_EMOJIS = {
  Greetings: '👋', Needs: '🙋', Questions: '❓',
  Responses: '💬', Emergency: '🆘', Shopping: '🛒', Food: '🍽️',
};

export default function QuickPhrasesScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [category, setCategory] = useState('Greetings');
  const [mp3Uri, setMp3Uri] = useState(null);
  const [search, setSearch]     = useState('');
  const [speaking, setSpeaking] = useState(null); // phrase currently speaking
  const [loading, setLoading]   = useState(null);  // phrase currently loading Nova
  const [bunnieTrigger, setBunnieTrigger] = useState(0);

  const phrases = search
    ? Object.values(PHRASE_LIBRARY).flat().filter(p => p.toLowerCase().includes(search.toLowerCase()))
    : PHRASE_LIBRARY[category] || [];

  const speakPhrase = async (phrase) => {
    if (speaking || loading) return; // prevent overlap
    setLoading(phrase);
    setBunnieTrigger(t => t + 1);

    try {
      // Nova naturalizes the phrase before speaking
      const natural = await naturalizeText(phrase, state.user.voicePersonality).catch(() => phrase);
      setLoading(null);
      setSpeaking(phrase);

      // sonicSpeak tries Nova Sonic first, falls back to TTS automatically
      const sonicRes = await sonicSpeak(natural, state.user.voicePersonality);
      if (sonicRes?.mp3Path) { setMp3Uri(sonicRes.mp3Path); } else { setSpeaking(null); setLoading(null); }
      dispatch({ type: 'INCREMENT_CONVERSATIONS' });
      dispatch({ type: 'ADD_XP', payload: 5 });
    } catch (e) {
      setLoading(null);
      setSpeaking(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize: 22, color: Colors.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[Typography.titleLarge, { color: Colors.onBackground }]}>📖 Quick Phrases</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Speaking indicator */}
      {(speaking || loading) && (
        <View style={styles.speakingBanner}>
          {loading ? <BunnieIcon size={16} animation="spin" trigger={bunnieTrigger} loop={!!loading} /> : <Text style={{ fontSize: 16 }}>🔊</Text>}
          <Text style={[Typography.bodySmall, { color: Colors.primary, flex: 1 }]}>
            {loading ? `Bunnie preparing "${loading}"…` : `Speaking: "${speaking}"`}
          </Text>
          <TouchableOpacity onPress={() => { Tts.stop(); setSpeaking(null); setLoading(null); }}>
            <Text style={[Typography.labelSmall, { color: Colors.error }]}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search */}
      <View style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}>
        <View style={styles.searchBox}>
          <Text style={{ fontSize: 18, marginRight: Spacing.sm }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search phrases…"
            placeholderTextColor={Colors.disabled}
            style={{ flex: 1, fontSize: 15, color: Colors.onBackground }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: Colors.disabled, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Categories */}
      {!search && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 56 }}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingVertical: 8, gap: 8, alignItems: 'center' }}
        >
          {Object.keys(PHRASE_LIBRARY).map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
              style={[styles.catChip, category === cat && styles.catChipActive]}
            >
              <Text style={{ fontSize: 14, marginRight: 4 }}>{CATEGORY_EMOJIS[cat]}</Text>
              <Text style={[Typography.labelMedium, { color: category === cat ? Colors.onPrimary : Colors.onSurfaceVariant }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Phrases */}
      <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}>
        {search && (
          <Text style={[Typography.labelSmall, { color: Colors.subtitle, marginBottom: 4 }]}>
            {phrases.length} result{phrases.length !== 1 ? 's' : ''} for "{search}"
          </Text>
        )}
        {phrases.map((phrase, i) => {
          const isActive  = speaking === phrase;
          const isLoading = loading  === phrase;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => speakPhrase(phrase)}
              activeOpacity={0.75}
              style={[styles.phraseCard, (isActive || isLoading) && styles.phraseCardActive]}
              disabled={!!(speaking || loading)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyLarge, { color: isActive ? Colors.primary : Colors.onBackground }]}>
                  {phrase}
                </Text>
                {isActive && (
                  <Text style={[Typography.labelSmall, { color: Colors.primary, marginTop: 2 }]}>
                    🔊 Speaking…
                  </Text>
                )}
                {isLoading && (
                  <Text style={[Typography.labelSmall, { color: Colors.subtitle, marginTop: 2 }]}>
                    Bunnie preparing…
                  </Text>
                )}
              </View>
              <View style={[styles.speakIcon, (isActive || isLoading) && { backgroundColor: Colors.primary }]}>
                <Text style={{ fontSize: 22 }}>
                  {isLoading ? '✨' : isActive ? '🔊' : '🔊'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Polly MP3 Player */}
      {mp3Uri && (
        <Video
          key={mp3Uri}
          source={{ uri: mp3Uri }}
          audioOnly={true}
          paused={false}
          repeat={false}
          volume={1.0}
          style={{ width: 0, height: 0 }}
          onLoad={() => console.log('[Video] Polly playing')}
          onEnd={() => {
            setMp3Uri(null);
            setSpeaking(null);
            setLoading(null);
          }}
          onError={() => setMp3Uri(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.md },
  back:             { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  speakingBanner:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryContainer, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginHorizontal: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.sm },
  searchBox:        { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Shadow.sm },
  catChip:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceVariant, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, height: 38 },
  catChipActive:    { backgroundColor: Colors.primary },
  phraseCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  phraseCardActive: { backgroundColor: Colors.primaryContainer, borderColor: Colors.primary, borderWidth: 1 },
  speakIcon:        { width: 44, height: 44, backgroundColor: Colors.primaryContainer, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.sm },
});