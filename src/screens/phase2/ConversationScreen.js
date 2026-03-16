import React, { useState, useRef, useEffect, useCallback } from 'react';
import Tts from 'react-native-tts';
import { sonicSpeak, sonicStop } from '../../services/NovaSonicService';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, Keyboard, StatusBar, Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import { useApp } from '../../utils/AppContext';
import { getQuickReplies, naturalizeText } from '../../services/NovaService';
import BunnieIcon from '../../components/common/BunnieIcon';
import Video from 'react-native-video';

// Who is currently typing — the deaf user OR the hearing person
const MODES = {
  USER:  'user',   // deaf/mute person typing → will be spoken aloud
  OTHER: 'other',  // hearing person typing what they said → shows as their bubble
};

export default function ConversationScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [messages, setMessages]         = useState([]);
  const [mp3Uri, setMp3Uri] = useState(null);
  const [typed, setTyped]               = useState('');
  const [inputMode, setInputMode]       = useState(MODES.USER);
  const [replyTrigger, setReplyTrigger] = useState(0);
  const [replies, setReplies]           = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [speaking, setSpeaking]         = useState(false);
  const scrollRef   = useRef(null);
  const inputRef    = useRef(null);
  const speakAnim   = useRef(new Animated.Value(1)).current;

  // Whenever a new "other" message arrives → ask Nova for smart replies
  useEffect(() => {
    const lastOther = [...messages].reverse().find(m => m.from === 'other');
    if (!lastOther) return;
    fetchReplies(lastOther.text);
  }, [messages]);

  const fetchReplies = async (lastText) => {
    setLoadingReplies(true);
    setReplyTrigger(t => t + 1);
    setReplies([]);
    try {
      const context = messages
        .slice(-6)
        .map(m => `${m.from === 'user' ? 'Me' : 'Them'}: ${m.text}`)
        .join('\n');
      const r = await getQuickReplies(lastText, context);
      setReplyTrigger(t => t + 1);
    setReplies(Array.isArray(r) ? r : []);
    } catch {
      setReplyTrigger(t => t + 1);
    setReplies(['I understand.', 'Can you repeat that?', 'Thank you!']);
    } finally {
      setLoadingReplies(false);
    }
  };

  const startSpeakAnim = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(speakAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
        Animated.timing(speakAnim, { toValue: 1,    duration: 400, useNativeDriver: true }),
      ])
    ).start();
  };

  const speakAloud = async (text) => {
    if (!text.trim()) return;
    setSpeaking(true);
    startSpeakAnim();
    try {
      const natural = await naturalizeText(text, state.user.voicePersonality).catch(() => text);
      const sonicRes = await sonicSpeak(natural, state.user.voicePersonality);
      if (sonicRes?.mp3Path) {
        setMp3Uri(sonicRes.mp3Path);
        // setSpeaking handled by Video onEnd
        return;
      }
    } catch (e) {
      console.error('TTS error:', e);
    } finally {
      setSpeaking(false);
      speakAnim.stopAnimation();
      speakAnim.setValue(1);
    }
  };

  const sendMessage = async (text, fromMode = inputMode) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg  = { id: Date.now().toString(), from: fromMode, text: text.trim(), time };

    setMessages(m => [...m, msg]);
    setTyped('');
    Keyboard.dismiss();

    if (fromMode === MODES.USER) {
      // Deaf user's message → speak it out loud for the hearing person
      dispatch({ type: 'INCREMENT_CONVERSATIONS' });
      dispatch({ type: 'ADD_XP', payload: 15 });
      await speakAloud(text);
    }
    // "other" mode messages just appear as bubbles — no TTS
  };

  const switchMode = (mode) => {
    setInputMode(mode);
    setTyped('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const time = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize: 22, color: Colors.primary }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.titleLarge, { color: Colors.onBackground }]}>💬 Live Conversation</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.dot, { backgroundColor: speaking ? Colors.success : Colors.primary }]} />
            <Text style={[Typography.bodySmall, { color: Colors.subtitle }]}>
              {speaking ? 'Speaking aloud…' : 'Two-way · Bunnie AI'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Mode toggle — who is typing right now? ── */}
      <View style={styles.modeBar}>
        <BunnieIcon size={14} animation="pop" trigger={replyTrigger} />
            <Text style={[Typography.labelSmall, { color: Colors.subtitle, marginRight: Spacing.sm }]}>
          Now typing:
        </Text>
        <TouchableOpacity
          onPress={() => switchMode(MODES.USER)}
          style={[styles.modeChip, inputMode === MODES.USER && styles.modeChipActive]}
        >
          <Text style={[Typography.labelMedium, { color: inputMode === MODES.USER ? '#fff' : Colors.primary }]}>
            🤲 Me (speak)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => switchMode(MODES.OTHER)}
          style={[styles.modeChip, inputMode === MODES.OTHER && styles.modeChipOther]}
        >
          <Text style={[Typography.labelMedium, { color: inputMode === MODES.OTHER ? '#fff' : Colors.subtitle }]}>
            🧑 They said
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 8 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>💬</Text>
            <Text style={[Typography.titleSmall, { color: Colors.subtitle, marginTop: Spacing.sm, textAlign: 'center' }]}>
              Start the conversation!
            </Text>
            <Text style={[Typography.bodySmall, { color: Colors.disabled, marginTop: 4, textAlign: 'center' }]}>
              Switch between "Me" and "They said"{'\n'}to have a two-way conversation
            </Text>
          </View>
        )}

        {messages.map(msg => (
          <View key={msg.id} style={[
            styles.bubbleWrap,
            msg.from === 'user' ? styles.alignRight : styles.alignLeft,
          ]}>
            {msg.from === 'other' && (
              <View style={styles.avatar}>
                <Text style={{ fontSize: 16 }}>🧑</Text>
              </View>
            )}
            <TouchableOpacity
              activeOpacity={msg.from === 'user' ? 0.7 : 1}
              onPress={() => msg.from === 'user' && speakAloud(msg.text)}
              style={[styles.bubble, msg.from === 'user' ? styles.bubbleUser : styles.bubbleOther]}
            >
              <Text style={[
                Typography.bodyLarge,
                { color: msg.from === 'user' ? '#fff' : Colors.onBackground },
              ]}>
                {msg.text}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                {msg.from === 'user' && (
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>🔊 tap to repeat</Text>
                )}
                <Text style={[Typography.bodySmall, {
                  color: msg.from === 'user' ? 'rgba(255,255,255,0.6)' : Colors.subtitle,
                }]}>
                  {msg.time}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* ── Nova Quick Replies (only when last message is from other) ── */}
      {replies.length > 0 && (
        <View style={styles.repliesSection}>
          <Text style={[Typography.labelSmall, { color: Colors.subtitle, marginBottom: 4 }]}>
            {loadingReplies ? '🐰 Bunnie thinking…' : '🐰 Bunnie suggests:'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.xs }}
          >
            {replies.map((r, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => sendMessage(r, MODES.USER)}
                style={styles.replyChip}
              >
                <Text style={[Typography.bodySmall, { color: Colors.primary }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Input bar ── */}
      <Animated.View style={[styles.inputRow, speaking && { transform: [{ scale: speakAnim }] },
        inputMode === MODES.OTHER && { backgroundColor: Colors.surfaceVariant },
      ]}>
        <TextInput
          ref={inputRef}
          value={typed}
          onChangeText={setTyped}
          placeholder={inputMode === MODES.USER
            ? 'Type what you want to say…'
            : 'Type what the other person said…'}
          placeholderTextColor={Colors.disabled}
          style={[styles.input, inputMode === MODES.OTHER && { color: Colors.subtitle }]}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(typed)}
          multiline={false}
        />
        <TouchableOpacity
          onPress={() => sendMessage(typed)}
          disabled={!typed.trim() || speaking}
          style={[
            styles.sendBtn,
            inputMode === MODES.OTHER && { backgroundColor: Colors.surfaceVariant, borderWidth: 1, borderColor: Colors.divider },
            (!typed.trim() || speaking) && { opacity: 0.4 },
          ]}
        >
          <Text style={{ fontSize: 22 }}>
            {inputMode === MODES.USER ? '🔊' : '✍️'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

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
          }}
          onError={() => setMp3Uri(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm, gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  back:            { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dot:             { width: 8, height: 8, borderRadius: 4 },
  modeBar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  modeChip:        { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary },
  modeChipActive:  { backgroundColor: Colors.primary },
  modeChipOther:   { backgroundColor: Colors.subtitle },
  emptyState:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl },
  bubbleWrap:      { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xs },
  alignRight:      { justifyContent: 'flex-end' },
  alignLeft:       { justifyContent: 'flex-start' },
  avatar:          { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
  bubble:          { maxWidth: '75%', borderRadius: Radius.xl, padding: Spacing.md },
  bubbleUser:      { backgroundColor: Colors.primary, borderBottomRightRadius: Radius.xs },
  bubbleOther:     { backgroundColor: Colors.surface, borderBottomLeftRadius: Radius.xs, ...Shadow.sm },
  repliesSection:  { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  replyChip:       { backgroundColor: Colors.primaryContainer, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  inputRow:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingBottom: 28, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.divider, gap: Spacing.sm },
  input:           { flex: 1, backgroundColor: Colors.surfaceVariant, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: 15, color: Colors.onBackground, minHeight: 44 },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});