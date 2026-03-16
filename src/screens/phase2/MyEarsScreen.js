import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, StatusBar,
  PermissionsAndroid, Platform, Vibration, Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AudioRecord from 'react-native-audio-record';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import SenseCard from '../../components/common/SenseCard';
import BunnieIcon from '../../components/common/BunnieIcon';
import { useApp } from '../../utils/AppContext';
import { runDangerAgent, getAgentLog } from '../../services/BunnieAgent';
import { transcribeSpeech, classifyDangerSound } from '../../services/NovaService';

// ── Local classification — INSTANT, no network ───────────────────────────────
function localClassify(peak) {
  if (peak >= 0.85) return { category: 'DANGER',   type: 'very_loud',   urgency: 9, emoji: '🚨', message: 'Very loud sound — possible emergency!' };
  if (peak >= 0.65) return { category: 'DANGER',   type: 'loud_sound',  urgency: 7, emoji: '⚠️', message: 'Loud sound detected nearby!' };
  if (peak >= 0.45) return { category: 'DOMESTIC', type: 'sharp_sound', urgency: 5, emoji: '🔔', message: 'Sharp sound — doorbell or knock?' };
  if (peak >= 0.30) return { category: 'SPEECH',   type: 'speech',      urgency: 4, emoji: '🗣️', message: 'Someone speaking nearby.' };
  if (peak >= 0.15) return { category: 'AMBIENT',  type: 'ambient',     urgency: 3, emoji: '🌊', message: 'Sound detected around you.' };
  return               { category: 'AMBIENT',  type: 'quiet',       urgency: 2, emoji: '🔉', message: 'Faint sound in environment.' };
}

// Chunk length → loudness (silent audio compresses more = shorter base64)
function chunkLoudness(chunk) {
  const len = chunk?.length ?? 0;
  if (len < 1500) return 0;
  if (len < 2500) return 0.15;
  if (len < 3500) return 0.35;
  if (len < 5000) return 0.55;
  if (len < 7000) return 0.75;
  return 0.90;
}

const SOUND_SETTINGS = [
  { key: 'dangerAlerts',   label: 'Danger Alerts',  sub: 'Fire alarm, siren, screaming', emoji: '⚠️', always: true },
  { key: 'speechAlerts',   label: 'Speech Alerts',  sub: 'Someone speaking nearby',      emoji: '🗣️' },
  { key: 'domesticAlerts', label: 'Home Sounds',    sub: 'Doorbell, baby, dog barking',  emoji: '🏠' },
  { key: 'ambientAlerts',  label: 'Ambient Sounds', sub: 'Music, traffic, crowd noise',  emoji: '🌊' },
];

const URGENCY_COLOR = (u) => u >= 7 ? '#D32F2F' : u >= 4 ? '#F57C00' : '#1976D2';

async function requestMicPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const r = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      { title: 'Microphone', message: 'Kira needs mic to detect sounds.', buttonPositive: 'Allow' }
    );
    return r === PermissionsAndroid.RESULTS.GRANTED;
  } catch { return false; }
}

export default function MyEarsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [listening, setListening]     = useState(false);
  const [status, setStatus]           = useState('Tap to Start');
  const [liveAlert, setLiveAlert]     = useState(null);
  const [waveHeights, setWaveHeights] = useState(Array(16).fill(4));
  const [debugLog, setDebugLog]       = useState('Not started');
  const [alertTrigger, setAlertTrigger] = useState(false);
  const [agentStatus, setAgentStatus]     = useState(null);  // Bunnie agent chain status
  const [agentLog, setAgentLog]           = useState([]);
  const [transcript, setTranscript]       = useState(null); // live speech transcript
  const [nameAlert, setNameAlert]         = useState(false); // name was called

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim  = useRef(new Animated.Value(1)).current;

  const activeRef   = useRef(false);
  const chunksRef   = useRef([]);
  const busyRef     = useRef(false);
  const timerRef    = useRef(null);
  const waveTimerRef = useRef(null);  // throttle wave updates
  const settingsRef = useRef(state.settings);
  const dispatchRef = useRef(dispatch);

  useEffect(() => { settingsRef.current = state.settings; }, [state.settings]);
  useEffect(() => { dispatchRef.current = dispatch; }, [dispatch]);
  useEffect(() => () => doStop(), []);

  const startPulse = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(ringAnim, { toValue: 2.4, duration: 1500, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 1,   duration: 0,    useNativeDriver: true }),
    ])).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation(); pulseAnim.setValue(1);
    ringAnim.stopAnimation();  ringAnim.setValue(1);
  };

  // ── Show alert — always instant ─────────────────────────────────────────────
  const showAlert = (result) => {
    const alertObj = {
      ...result,
      id:   Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setLiveAlert(alertObj);
    setAlertTrigger(t => !t);
    dispatchRef.current({ type: 'ADD_ALERT', payload: alertObj });
    if (result.urgency >= 7)      Vibration.vibrate([0, 300, 100, 300, 100, 600]);
    else if (result.urgency >= 4) Vibration.vibrate([0, 200, 100, 200]);
    else                          Vibration.vibrate(150);
    if (result.urgency < 7) setTimeout(() => setLiveAlert(null), 7000);

    // ── Trigger BunnieAgent for DANGER sounds (urgency >= 7) ──────────────
    // setTimeout(0) ensures this never blocks the UI or navigation
    if (result.urgency >= 7) {
      setTimeout(() => {
        setAgentStatus('🧠 Bunnie agent activated…');
        runDangerAgent({
          alertData:     result,
          userName:      state.user.name || 'User',
          location:      null,
          contacts:      state.emergencyContacts,
          caregiverName: state.caregiver?.name,
          onStep: (step, desc) => setAgentStatus(`Step ${step}/4: ${desc}`),
          onComplete: (res) => {
            setAgentStatus(res.success ? '✅ Bunnie handled it' : '⚠️ Agent completed');
            setAgentLog(getAgentLog());
            setTimeout(() => setAgentStatus(null), 5000);
          },
        }).catch(e => {
          console.log('[MyEars] Agent error handled:', e.message);
          setAgentStatus(null);
        });
      }, 0);
    }
  };

  // ── Process audio chunks every 4s — NEVER blocks ────────────────────────────
  const processChunks = () => {
    if (busyRef.current) return;
    const batch = chunksRef.current.splice(0);
    if (batch.length === 0) return;

    const loudnesses = batch.map(chunkLoudness);
    const peak = Math.max(...loudnesses);
    const avg  = loudnesses.reduce((a, b) => a + b, 0) / loudnesses.length;

    setDebugLog(`chunks=${batch.length} peak=${peak.toFixed(2)} avg=${avg.toFixed(2)}`);
    console.log(`[Ears] chunks=${batch.length} peak=${peak.toFixed(2)}`);

    // Only alert for sounds above background noise
    if (peak < 0.12) return;

    busyRef.current = true;

    // INSTANT local alert — shown immediately, no network
    const instant = localClassify(peak);
    const s = settingsRef.current;
    const shouldShow =
      instant.category === 'DANGER' ||
      (instant.category === 'SPEECH'   && s.speechAlerts   !== false) ||
      (instant.category === 'DOMESTIC' && s.domesticAlerts !== false) ||
      (instant.category === 'AMBIENT'  && s.ambientAlerts  !== false);

    if (shouldShow && instant.urgency >= 3) {
      showAlert(instant);
      setDebugLog(`✅ peak=${peak.toFixed(2)} → ${instant.type} (u${instant.urgency})`);
    }

    busyRef.current = false;

    // Bunnie enrichment — completely fire and forget, never awaited
    // If Bunnie is slow or fails, the local alert is already shown
    enrichWithNova(peak, avg, batch.length, instant).catch(() => {});
  };

  // ── Bunnie enrichment — smart background processing ─────────────────────────
  const enrichWithNova = async (peak, avg, numChunks, localResult) => {
    // Yield to UI thread first — prevents blocking navigation
    await new Promise(r => setTimeout(r, 50));
    const metrics = { peak, avg, durationMs: numChunks * 300, chunks: numChunks };
    const userName = state.user?.name || '';

    try {
      // DANGER sounds — classify specifically (fire alarm, siren, etc)
      if (localResult.category === 'DANGER') {
        const danger = await Promise.race([
          classifyDangerSound(metrics),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
        ]);
        if (danger?.message) {
          setLiveAlert(prev => prev ? {
            ...prev,
            message: danger.message,
            emoji: danger.emoji ?? prev.emoji,
            immediateAction: danger.immediateAction,
            soundType: danger.soundType,
          } : prev);
          console.log('[Ears] Danger classified:', danger.soundType);
        }
        return;
      }

      // SPEECH sounds — transcribe and detect name
      if (localResult.category === 'SPEECH') {
        const speech = await Promise.race([
          transcribeSpeech(metrics, userName),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 7000)),
        ]);

        if (speech?.transcript) {
          // Check if user's name was detected
          // Fuzzy name detection — handles different pronunciations
          const nameLower = userName?.toLowerCase() || '';
          const transcriptLower = speech.transcript.toLowerCase();
          // Direct match OR Nova explicitly flagged it OR first 3 chars match (phonetic)
          const nameCalled = nameLower && (
            transcriptLower.includes(nameLower) ||
            (speech.nameDetected && speech.nameDetected.toLowerCase().includes(nameLower.slice(0, 3))) ||
            (nameLower.length >= 3 && transcriptLower.includes(nameLower.slice(0, 3)))
          );
          
          const speechAlert = {
            ...localResult,
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: speech.transcript,
            emoji: nameCalled ? '🔔' : '🗣️',
            urgency: nameCalled ? 7 : (speech.urgency ?? 4),
            isTranscript: true,
            nameCalled,
          };

          if (nameCalled) {
            setNameAlert(true);
            setTimeout(() => setNameAlert(false), 5000);
          }

          setLiveAlert(speechAlert);
          dispatchRef.current({ type: 'ADD_ALERT', payload: speechAlert });
          console.log('[Ears] Transcript:', speech.transcript);
        }
        return;
      }

      // AMBIENT/DOMESTIC — general Bunnie enrichment
      const { classifyAmbientSound } = require('../../services/NovaService');
      const novaResult = await Promise.race([
        classifyAmbientSound({ peakAmplitude: peak, avgAmplitude: avg, isSilent: false, durationMs: numChunks * 300 }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
      if (novaResult?.message && novaResult.message !== localResult.message) {
        setLiveAlert(prev => prev ? { ...prev, message: novaResult.message, emoji: novaResult.emoji ?? prev.emoji } : prev);
      }

    } catch (e) {
      console.log('[Ears] Enrichment skipped:', e.message);
    }
  };

  // ── Start ───────────────────────────────────────────────────────────────────
  const startListening = async () => {
    const ok = await requestMicPermission();
    if (!ok) { alert('Microphone permission denied.'); return; }

    chunksRef.current = [];
    busyRef.current   = false;

    try {
      AudioRecord.init({ sampleRate: 16000, channels: 1, bitsPerSample: 16, wavFile: 'sv_ears.wav' });
      await new Promise(r => setTimeout(r, 500));

      AudioRecord.on('data', (chunk) => {
        if (!activeRef.current) return;
        chunksRef.current.push(chunk);
        // Throttle wave animation to every 200ms — prevents JS thread overload
        if (!waveTimerRef.current) {
          waveTimerRef.current = setTimeout(() => {
            const amp = chunkLoudness(chunk);
            setWaveHeights(prev => [...prev.slice(1), Math.max(4, amp * 56)]);
            waveTimerRef.current = null;
          }, 200);
        }
      });

      AudioRecord.start();
      activeRef.current = true;
      setListening(true);
      setStatus('Listening…');
      setDebugLog('Started — make a sound!');
      startPulse();

      timerRef.current = setInterval(processChunks, 5000);

    } catch (e) {
      console.error('[Ears] start failed:', e.message);
      alert('Could not start microphone. Try again.');
    }
  };

  // ── Stop ────────────────────────────────────────────────────────────────────
  const doStop = () => {
    activeRef.current = false;
    busyRef.current   = false;
    clearInterval(timerRef.current);
    timerRef.current = null;
    if (waveTimerRef.current) { clearTimeout(waveTimerRef.current); waveTimerRef.current = null; }
    try { AudioRecord.stop(); } catch {}
    stopPulse();
    setListening(false);
    setStatus('Tap to Start');
    setDebugLog('Stopped');
    setWaveHeights(Array(16).fill(4));
    chunksRef.current = [];
  };

  // ── Force test — bypasses all thresholds, instant result ───────────────────
  const forceTest = () => {
    const result = localClassify(0.9); // simulate very loud sound
    setDebugLog(`FORCE TEST → ${result.type} urgency=${result.urgency}`);
    showAlert(result);
  };

  const recentAlerts = state.soundAlerts.slice(0, 15);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Name detection banner — highest priority */}
      {nameAlert && (
        <TouchableOpacity onPress={() => setNameAlert(false)}
          style={[styles.alertBanner, { backgroundColor: '#6A1B9A' }]}>
          <Text style={{ fontSize: 28 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.titleSmall, { color: '#fff', fontWeight: '800' }]}>
              Someone is calling your name!
            </Text>
            <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.9)' }]}>
              {state.user?.name} was detected in nearby speech · tap to dismiss
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {liveAlert && (
        <TouchableOpacity onPress={() => setLiveAlert(null)}
          style={[styles.alertBanner, { backgroundColor: URGENCY_COLOR(liveAlert.urgency) }]}>
          <BunnieIcon size={28} animation="shake" trigger={alertTrigger} />
          <View style={{ flex: 1 }}>
            <Text style={[Typography.titleSmall, { color: '#fff' }]}>
              {liveAlert.isTranscript ? `"${liveAlert.message}"` : liveAlert.message}
            </Text>
            <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.85)' }]}>
              {liveAlert.isTranscript ? '🗣️ Transcribed by Bunnie AI' :
               liveAlert.soundType ? `🔊 ${liveAlert.soundType.replace(/_/g,' ')} · ${liveAlert.immediateAction ?? ''}` :
               liveAlert.urgency >= 7 ? '🚨 URGENT · tap to dismiss' : 'Tap to dismiss · Bunnie AI'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <LinearGradient colors={['#1565C0', '#1E88E5']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize: 22, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.titleLarge, { color: '#fff' }]}>👂 My Ears</Text>
          <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.75)' }]}>
            {listening ? 'Actively listening · Bunnie AI' : 'Sound awareness · Bunnie AI'}
          </Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: listening ? '#2E7D32' : 'rgba(255,255,255,0.2)' }]}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
            {listening ? '● LIVE' : 'OFF'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.centerSection}>
          <Animated.View style={[styles.ring, { opacity: listening ? 0.15 : 0, transform: [{ scale: ringAnim }] }]} />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={listening ? doStop : startListening}
              style={[styles.listenBtn, listening && styles.listenBtnActive]}
            >
              <Text style={{ fontSize: 52 }}>👂</Text>
              <Text style={{ color: listening ? '#fff' : '#1976D2', marginTop: 6, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                {status}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <BunnieIcon size={36} animation="pulse" trigger={listening} loop={listening} style={{ marginTop: 8 }} />
          <View style={styles.waveRow}>
            {waveHeights.map((h, i) => (
              <View key={i} style={[styles.wavebar, { height: h, backgroundColor: listening ? '#1E88E5' : Colors.disabled }]} />
            ))}
          </View>

          <View style={styles.debugBox}>
            <Text style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{debugLog}</Text>
          </View>

          {agentStatus && (
            <View style={[styles.debugBox, { backgroundColor: '#EDE7F6', marginTop: 6 }]}>
              <Text style={{ fontSize: 11, color: '#4527A0', fontFamily: 'monospace' }}>
                🐰 {agentStatus}
              </Text>
            </View>
          )}

          <View style={{ alignItems: 'center', gap: 6 }}>
            {listening && (
              <TouchableOpacity onPress={forceTest} style={styles.testBtn}>
                <Text style={{ color: '#1976D2', fontSize: 13, fontWeight: '600' }}>🧪 Force Test (loud sound)</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                const fakeAlert = { category: 'DANGER', type: 'fire_alarm', urgency: 9, emoji: '🚨', message: 'Fire alarm detected!' };
                setAgentStatus('🧠 Bunnie agent activated…');
                setTimeout(() => {
                  runDangerAgent({
                    alertData: fakeAlert,
                    userName: state.user.name || 'User',
                    location: { address: 'Ibadan, Nigeria' },
                    contacts: state.emergencyContacts,
                    caregiverName: state.caregiver?.name,
                    onStep: (step, desc) => setAgentStatus(`Step ${step}/4: ${desc}`),
                    onComplete: (res) => {
                      setAgentStatus(res.success ? '✅ Agent chain complete!' : '⚠️ Done');
                      setAgentLog(getAgentLog());
                      setTimeout(() => setAgentStatus(null), 8000);
                    },
                  }).catch(e => { setAgentStatus(null); console.log('[Agent]', e.message); });
                }, 0);
              }}
              style={[styles.testBtn, { borderColor: '#4527A0' }]}
            >
              <Text style={{ color: '#4527A0', fontSize: 13, fontWeight: '600' }}>🐰 Test Bunnie Agent</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: Colors.subtitle, fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
            {listening ? 'Instant alerts · Bunnie enriches in background' : 'Detects alarms, voices, doorbells and more'}
          </Text>
        </View>

        <View style={{ paddingHorizontal: Spacing.md }}>
          <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginBottom: Spacing.sm }]}>Alert Settings</Text>
          {SOUND_SETTINGS.map(s => (
            <SenseCard key={s.key} variant="elevated" padding="md" style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 26, marginRight: Spacing.md }}>{s.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>{s.label}</Text>
                  <Text style={[Typography.bodySmall, { color: Colors.subtitle }]}>{s.sub}</Text>
                </View>
                <Switch
                  value={s.always ? true : (state.settings[s.key] ?? true)}
                  onValueChange={v => !s.always && dispatch({ type: 'SET_SETTINGS', payload: { [s.key]: v } })}
                  trackColor={{ false: Colors.disabled, true: Colors.primaryLight }}
                  thumbColor={Colors.primary}
                  disabled={s.always}
                />
              </View>
            </SenseCard>
          ))}
        </View>

        <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.lg }}>
          <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginBottom: Spacing.sm }]}>
            Recent Alerts {recentAlerts.length > 0 ? `(${recentAlerts.length})` : ''}
          </Text>
          {recentAlerts.length === 0 ? (
            <SenseCard variant="outlined" padding="md">
              <Text style={[Typography.bodyMedium, { color: Colors.subtitle, textAlign: 'center' }]}>
                No alerts yet.{'\n'}Start listening and tap Force Test! 👆
              </Text>
            </SenseCard>
          ) : (
            recentAlerts.map(alert => (
              <View key={alert.id} style={[styles.alertRow, { borderLeftColor: URGENCY_COLOR(alert.urgency) }]}>
                <Text style={{ fontSize: 26, marginRight: Spacing.sm }}>{alert.emoji}</Text>
                <View style={{ flex: 1 }}>
                  {alert.isTranscript ? (
                    <Text style={[Typography.bodyMedium, { color: Colors.onBackground, fontStyle: 'italic' }]}>
                      "{alert.message}"
                    </Text>
                  ) : (
                    <Text style={[Typography.bodyMedium, { color: Colors.onBackground }]}>{alert.message}</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    <Text style={[Typography.bodySmall, { color: Colors.subtitle }]}>{alert.time}</Text>
                    {alert.isTranscript && <Text style={[Typography.labelSmall, { color: '#7B1FA2' }]}>· speech transcribed</Text>}
                    {alert.nameCalled && <Text style={[Typography.labelSmall, { color: '#6A1B9A', fontWeight: '700' }]}>· YOUR NAME</Text>}
                    {alert.soundType && <Text style={[Typography.labelSmall, { color: Colors.subtitle }]}>· {alert.soundType.replace(/_/g,' ')}</Text>}
                  </View>
                </View>
                {alert.urgency >= 7 && (
                  <View style={styles.urgentBadge}>
                    <Text style={{ color: '#D32F2F', fontSize: 11, fontWeight: '700' }}>
                      {alert.nameCalled ? 'YOUR NAME' : 'URGENT'}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  alertBanner:     { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20, gap: 12 },
  back:            { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  statusChip:      { marginLeft: 'auto', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  centerSection:   { alignItems: 'center', paddingVertical: 36, position: 'relative' },
  ring:            { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#1E88E5' },
  listenBtn:       { width: 164, height: 164, borderRadius: 82, backgroundColor: '#E3F2FD', borderWidth: 3, borderColor: '#1E88E5', alignItems: 'center', justifyContent: 'center', elevation: 8 },
  listenBtnActive: { backgroundColor: '#1E88E5', borderColor: '#fff' },
  waveRow:         { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 20, height: 52 },
  wavebar:         { width: 5, borderRadius: 3 },
  debugBox:        { marginTop: 8, backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, minWidth: 280 },
  testBtn:         { marginTop: 10, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1976D2' },
  alertRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, elevation: 1 },
  urgentBadge:     { backgroundColor: '#FFEBEE', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
});
