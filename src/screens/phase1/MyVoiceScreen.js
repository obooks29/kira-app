import React, { useState, useRef } from 'react';
import Tts from 'react-native-tts';
import { sonicSpeak, sonicStop } from '../../services/NovaSonicService';
import Video from 'react-native-video';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, StatusBar, PermissionsAndroid, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import SenseButton  from '../../components/common/SenseButton';
import SenseCard    from '../../components/common/SenseCard';
import { useApp }   from '../../utils/AppContext';
import { naturalizeText, recognizeSign, analyzeVideoSigns } from '../../services/NovaService';

const QUICK = [
  'Hello!', 'Thank you', 'Please help me',
  'I need a moment', 'Can you repeat?', 'I understand',
  'Yes', 'No', 'Excuse me', 'How much?',
  'Where is…?', 'I am deaf', 'Call my family', 'I am okay',
];

async function requestCameraPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      { title: 'Camera Permission', message: 'Kira needs camera to read your signs.', buttonPositive: 'Allow' }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch { return false; }
}

export default function MyVoiceScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [mode, setMode]             = useState('camera');
  const [typed, setTyped]           = useState('');
  const [speaking, setSpeaking]     = useState(false);
  const [lastSpoken, setLastSpoken] = useState('');
  const [loading, setLoading]       = useState(false);
  const [signWords, setSignWords]   = useState([]);
  const [scanning, setScanning]     = useState(false);
  const [detectedSign, setDetectedSign] = useState(null);
  const [videoAnalysing, setVideoAnalysing] = useState(false);
  const [wavUri, setWavUri]               = useState(null); // Nova Sonic WAV
  const [videoProgress, setVideoProgress]   = useState('');
  const [videoTranscript, setVideoTranscript] = useState(null);
  const micAnim = useRef(new Animated.Value(1)).current;

  const pulseAnim = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(micAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(micAnim, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const speak = async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const natural = await naturalizeText(text, state.user.voicePersonality).catch(() => text);
      setLastSpoken(natural);
      setSpeaking(true);
      pulseAnim();
      const sonicResult = await sonicSpeak(natural, state.user.voicePersonality);
      // If Polly returned MP3 path, play via Video component
      if (sonicResult?.mp3Path || sonicResult?.wavPath) {
        setWavUri(sonicResult.mp3Path || sonicResult.wavPath);
        // setSpeaking(false) handled by Video onEnd
      } else {
        setSpeaking(false);
      }
      micAnim.stopAnimation();
      micAnim.setValue(1);
      dispatch({ type: 'INCREMENT_CONVERSATIONS' });
      dispatch({ type: 'ADD_XP', payload: 10 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scanSign = async () => {
    const granted = await requestCameraPermission();
    if (!granted) return;
    setScanning(true);
    launchCamera(
      { mediaType: 'photo', quality: 0.5, includeBase64: true, maxWidth: 600, maxHeight: 600, saveToPhotos: false },
      async (response) => {
        if (response.didCancel || response.errorCode) { setScanning(false); return; }
        const asset = response.assets?.[0];
        if (!asset?.base64) { setScanning(false); return; }
        try {
          const result = await recognizeSign(asset.base64, state.user.signLanguage || 'NSL');
          setDetectedSign(result);
          if (result.sign && result.confidence > 0.4) {
            setSignWords(w => [...w, result.sign]);
          }
        } catch (e) {
          console.error('Sign recognition failed:', e);
        } finally {
          setScanning(false);
        }
      }
    );
  };

  // ── Video Sign Language Analysis ─────────────────────────────────────────────
  const scanVideo = async () => {
    setVideoAnalysing(true);
    setVideoTranscript(null);
    setVideoProgress('Selecting video…');

    launchImageLibrary(
      { mediaType: 'video', videoQuality: 'low', durationLimit: 15 },
      async (response) => {
        if (response.didCancel || response.errorCode) {
          setVideoAnalysing(false);
          setVideoProgress('');
          return;
        }
        const asset = response.assets?.[0];
        if (!asset?.uri) { setVideoAnalysing(false); return; }

        try {
          setVideoProgress('🧠 Bunnie reading signs from video…');
          const result = await analyzeVideoSigns(asset.uri, asset.duration ?? 5);
          setVideoTranscript(result);
          setVideoProgress('');

          if (result?.transcript) {
            const natural = await naturalizeText(result.transcript, state.user.voicePersonality)
              .catch(() => result.transcript);
            setSignWords(natural.split(' '));
            const sonicResult = await sonicSpeak(natural, state.user.voicePersonality);
      // If Nova Sonic returned a WAV file path, play it
      if (sonicResult?.mp3Path || sonicResult?.wavPath) {
        setWavUri(sonicResult.mp3Path || sonicResult.wavPath);
      }
          }
        } catch (e) {
          console.error('Video analysis failed:', e);
          setVideoProgress('⚠️ Could not analyse video');
        } finally {
          setVideoAnalysing(false);
        }
      }
    );
  };

  const addSignWord = (word) => setSignWords(w => [...w, word]);
  const clearSentence = () => { setSignWords([]); setDetectedSign(null); };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={Colors.gradientPrimary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize: 22, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={[Typography.titleLarge, { color: '#fff' }]}>🤲 My Voice</Text>
          <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.75)' }]}>
            Sign → Speech · {state.user.signLanguage || 'NSL'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('QuickPhrases')} style={styles.headerBtn}>
          <Text style={{ fontSize: 20 }}>📖</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.modeRow}>
        {[
          { id: 'camera', label: '📷 Sign Language' },
          { id: 'type',   label: '⌨️ Type to Speak' },
        ].map(m => (
          <TouchableOpacity key={m.id} onPress={() => setMode(m.id)} style={[styles.modeTab, mode === m.id && styles.modeTabActive]}>
            <Text style={[Typography.labelMedium, { color: mode === m.id ? Colors.primary : Colors.subtitle }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {mode === 'camera' ? (
          <View>
            <TouchableOpacity style={styles.viewfinder} onPress={scanSign} disabled={scanning}>
              <View style={styles.cameraPlaceholder}>
                <Text style={{ fontSize: 64 }}>{scanning ? '🔍' : '🤲'}</Text>
                <Text style={[Typography.bodyMedium, { color: 'rgba(255,255,255,0.8)', marginTop: Spacing.sm, textAlign: 'center' }]}>
                  {scanning ? 'Bunnie is reading your sign…' : 'Tap to capture your sign'}
                </Text>
                <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.55)', marginTop: 4, textAlign: 'center' }]}>
                  Powered by Amazon Nova
                </Text>
              </View>
              {[{ t: 20, l: 20 }, { t: 20, r: 20 }, { b: 20, l: 20 }, { b: 20, r: 20 }].map((pos, i) => (
                <View key={i} style={[styles.corner, pos]} />
              ))}
              <View style={styles.confidence}>
                <View style={[styles.confDot, { backgroundColor: scanning ? Colors.warning : Colors.success }]} />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{scanning ? 'Scanning…' : 'Ready'}</Text>
              </View>
            </TouchableOpacity>

            {/* Video Sign Analysis Button */}
            <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.md }}>
              <TouchableOpacity
                onPress={scanVideo}
                disabled={videoAnalysing}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: videoAnalysing ? Colors.disabled : '#6A1B9A',
                  borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm,
                }}
              >
                <Text style={{ fontSize: 22 }}>{videoAnalysing ? '⏳' : '🎥'}</Text>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                  {videoAnalysing ? videoProgress : 'Analyse Video Signs'}
                </Text>
              </TouchableOpacity>

              {videoTranscript && (
                <SenseCard variant="tonal" padding="md" style={{ marginTop: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
                    <Text style={{ fontSize: 22 }}>🎥</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.labelSmall, { color: Colors.subtitle, marginBottom: 4 }]}>
                        Video transcript · Bunnie AI
                      </Text>
                      <Text style={[Typography.bodyMedium, { color: Colors.onBackground, fontWeight: '600' }]}>
                        "{videoTranscript.transcript}"
                      </Text>
                      {videoTranscript.signs && (
                        <Text style={[Typography.bodySmall, { color: Colors.subtitle, marginTop: 4 }]}>
                          Signs detected: {videoTranscript.signs.join(' → ')}
                        </Text>
                      )}
                    </View>
                  </View>
                </SenseCard>
              )}
            </View>

            {detectedSign && (
              <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.sm }}>
                <SenseCard variant={detectedSign.sign ? 'tonal' : 'outlined'} padding="sm">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Text style={{ fontSize: 20 }}>{detectedSign.sign ? '✅' : '❓'}</Text>
                    <Text style={[Typography.bodyMedium, { color: Colors.onBackground }]}>
                      {detectedSign.sign
                        ? `"${detectedSign.sign}" — ${Math.round(detectedSign.confidence * 100)}% confident`
                        : 'No clear sign — try again'}
                    </Text>
                  </View>
                </SenseCard>
              </View>
            )}

            {signWords.length > 0 && (
              <View style={styles.sentenceRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                  {signWords.map((w, i) => (
                    <View key={i} style={styles.wordChip}>
                      <Text style={[Typography.labelMedium, { color: Colors.primary }]}>{w}</Text>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity onPress={clearSentence} style={styles.clearBtn}>
                  <Text style={{ color: Colors.error, fontSize: 18 }}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm }}>
              <Animated.View style={{ transform: [{ scale: speaking ? micAnim : 1 }] }}>
                <TouchableOpacity
                  onPress={() => speak(signWords.join(' ') || 'Hello!')}
                  style={[styles.speakBtn, speaking && styles.speakBtnActive]}
                  disabled={loading}
                >
                  <Text style={{ fontSize: 36 }}>🔊</Text>
                  <Text style={[Typography.titleMedium, { color: speaking ? Colors.onPrimary : Colors.primary, marginTop: 4 }]}>
                    {speaking ? 'Speaking…' : signWords.length > 0 ? `Speak "${signWords.join(' ')}"` : 'Speak'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <Text style={[Typography.labelMedium, { color: Colors.subtitle, marginTop: Spacing.sm }]}>
                Or tap words manually
              </Text>
              <View style={styles.quickRow}>
                {['Hello', 'Thank you', 'Yes', 'No', 'Help', 'Please', 'Sorry', 'Wait'].map(w => (
                  <TouchableOpacity key={w} onPress={() => addSignWord(w)} style={styles.quickChip}>
                    <Text style={[Typography.labelSmall, { color: Colors.onPrimaryContainer }]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: Spacing.md }}>
            <SenseCard variant="elevated" padding="md" style={{ marginBottom: Spacing.md }}>
              <TextInput
                value={typed} onChangeText={setTyped}
                placeholder="Type what you want to say…"
                placeholderTextColor={Colors.disabled}
                multiline style={styles.typeInput} returnKeyType="done"
              />
              <View style={styles.typeActions}>
                <Text style={[Typography.bodySmall, { color: Colors.subtitle }]}>{typed.length}/200</Text>
                <TouchableOpacity onPress={() => setTyped('')} style={{ padding: Spacing.xs }}>
                  <Text style={[Typography.labelSmall, { color: Colors.error }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </SenseCard>
            <SenseButton label={speaking ? '🔊 Speaking…' : '🔊 Speak It'} onPress={() => speak(typed)} disabled={!typed.trim() || loading} loading={loading} />
            <Text style={[Typography.titleSmall, { color: Colors.onBackground, marginTop: Spacing.lg, marginBottom: Spacing.sm }]}>Quick Phrases</Text>
            <View style={styles.quickGrid}>
              {QUICK.map(p => (
                <TouchableOpacity key={p} onPress={() => { setTyped(p); speak(p); }} style={styles.phraseChip}>
                  <Text style={[Typography.bodySmall, { color: Colors.onBackground }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {lastSpoken ? (
          <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.lg }}>
            <SenseCard variant="tonal" padding="md">
              <Text style={[Typography.labelSmall, { color: Colors.primary, marginBottom: 4 }]}>LAST SPOKEN</Text>
              <Text style={[Typography.bodyLarge, { color: Colors.onBackground }]}>"{lastSpoken}"</Text>
            </SenseCard>
          </View>
        ) : null}
      </ScrollView>

      {/* Nova Sonic WAV Player — hidden, audio only */}
      {wavUri && (
        <Video
          key={wavUri}
          source={{ uri: wavUri }}
          audioOnly={true}
          playInBackground={true}
          paused={false}
          repeat={false}
          volume={1.0}
          style={{ width: 0, height: 0 }}
          onLoad={() => console.log('[Video] Polly playing')}
          onEnd={() => {
            setWavUri(null);
            setSpeaking(false);
            setLoading(false);
          }}
          onError={() => setWavUri(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.lg, gap: Spacing.sm },
  back:          { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtn:     { marginLeft: 'auto', width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modeRow:       { flexDirection: 'row', margin: Spacing.md, backgroundColor: Colors.surfaceVariant, borderRadius: Radius.full, padding: 4 },
  modeTab:       { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.full },
  modeTabActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  viewfinder:    { margin: Spacing.md, height: 280, backgroundColor: '#0D1F1E', borderRadius: Radius.xl, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cameraPlaceholder: { alignItems: 'center' },
  corner:        { position: 'absolute', width: 20, height: 20, borderColor: '#00BFA5', borderWidth: 3 },
  confidence:    { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  confDot:       { width: 8, height: 8, borderRadius: 4 },
  sentenceRow:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginTop: Spacing.sm },
  wordChip:      { backgroundColor: Colors.primaryContainer, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5, marginRight: Spacing.xs },
  clearBtn:      { padding: Spacing.sm },
  speakBtn:      { backgroundColor: Colors.primaryContainer, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, borderWidth: 2, borderColor: Colors.primaryLight },
  speakBtnActive:{ backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  quickChip:     { backgroundColor: Colors.primaryContainer, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  typeInput:     { fontSize: 18, color: Colors.onBackground, minHeight: 100, textAlignVertical: 'top' },
  typeActions:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  quickGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  phraseChip:    { backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.divider, ...Shadow.sm },
});