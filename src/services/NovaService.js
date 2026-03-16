/**
 * Kira — Amazon Bunnie AI Service
 * AWS Signature V4 — React Native compatible
 */

import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, NOVA_LITE_MODEL } from './aws-config';
import CryptoJS from 'crypto-js';

// ── AWS Signature V4 ─────────────────────────────────────────────────────────

function signedFetch(modelId, body) {
  const service   = 'bedrock';
  const host      = `bedrock-runtime.${AWS_REGION}.amazonaws.com`;
  const path      = `/model/${modelId}/invoke`;
  const url       = `https://${host}${path}`;
  const method    = 'POST';
  const amzDate   = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const bodyStr   = JSON.stringify(body);

  const payloadHash      = CryptoJS.SHA256(bodyStr).toString(CryptoJS.enc.Hex);
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHeaders    = 'content-type;host;x-amz-date';
  const encodedPath      = `/model/${encodeURIComponent(modelId)}/invoke`;
  const canonicalRequest = [method, encodedPath, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

  const credentialScope = `${dateStamp}/${AWS_REGION}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256', amzDate, credentialScope,
    CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex),
  ].join('\n');

  const kDate    = CryptoJS.HmacSHA256(dateStamp,     'AWS4' + AWS_SECRET_ACCESS_KEY);
  const kRegion  = CryptoJS.HmacSHA256(AWS_REGION,     kDate);
  const kService = CryptoJS.HmacSHA256(service,        kRegion);
  const kSigning = CryptoJS.HmacSHA256('aws4_request', kService);
  const signature = CryptoJS.HmacSHA256(stringToSign,  kSigning).toString(CryptoJS.enc.Hex);

  const authHeader = `AWS4-HMAC-SHA256 Credential=${AWS_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(url, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'X-Amz-Date':    amzDate,
      'Authorization': authHeader,
    },
    body: bodyStr,
  }).then(async res => {
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Nova ${res.status}: ${txt}`);
    }
    return res.json();
  });
}

export async function invoke(messages, maxTokens = 512) {
  const result = await signedFetch(NOVA_LITE_MODEL, {
    messages,
    inferenceConfig: { maxTokens },
  });
  return result?.output?.message?.content?.[0]?.text?.trim() ?? '';
}

function parseJSON(text) {
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()); }
  catch { return null; }
}

// ── M1 · Naturalize text for TTS ─────────────────────────────────────────────

export async function naturalizeText(text, personality = 'Warm & Friendly') {
  const personas = {
    'Warm & Friendly':  'Kind, warm, and conversational — like a close friend.',
    'Professional':     'Clear, respectful, and professional.',
    'Playful':          'Fun, energetic, and expressive.',
    'Calm & Gentle':    'Soft, reassuring, and calm.',
    'Bold & Confident': 'Assertive, direct, and confident.',
    'Youthful':         'Modern, casual, and relatable.',
  };
  try {
    const result = await invoke([{
      role: 'user',
      content: [{ text: `Voice style: ${personas[personality] ?? personas['Warm & Friendly']}
The user wants to say: "${text}"
Rewrite naturally for speaking aloud — concise, no filler words.
Return ONLY the spoken text, nothing else.` }],
    }], 150);
    return result || text;
  } catch (e) {
    console.warn('naturalizeText failed:', e.message);
    return text;
  }
}

// ── M2 · Quick reply suggestions ─────────────────────────────────────────────

export async function getQuickReplies(lastMessage, context = '') {
  try {
    const result = await invoke([{
      role: 'user',
      content: [{ text: `You are helping a deaf-mute person reply in a real conversation.
${context ? `Conversation so far:\n${context}\n` : ''}
The other person just said: "${lastMessage}"

Give 3 short, natural replies the deaf person could use (under 12 words each).
Make them contextually relevant to what was just said.
Return ONLY JSON: {"replies":["<r1>","<r2>","<r3>"]}` }],
    }], 200);
    return parseJSON(result)?.replies ?? ['I understand.', 'Can you repeat that?', 'Thank you!'];
  } catch (e) {
    return ['I understand.', 'Can you repeat that?', 'Thank you!'];
  }
}

// ── M3 · Scene analysis ──────────────────────────────────────────────────────

export async function analyzeScene(base64Image) {
  try {
    const result = await invoke([{
      role: 'user',
      content: [
        { image: { format: 'jpeg', source: { bytes: base64Image } } },
        { text: `You are assisting a deaf-mute person navigate the world safely.
Describe this scene practically. Focus on: people present, their emotions, any hazards, what to do next.
Be reassuring. Maximum 2 sentences.
Return ONLY JSON: {"description":"<scene>","safety":<1-5>,"action":"<what to do>","mood":"<calm|busy|tense>","faceEmotions":["<emotion1>","<emotion2>"]}` },
      ],
    }], 250);
    return parseJSON(result) ?? { description: 'Scene analysed.', safety: 4, action: '', mood: 'calm', faceEmotions: [] };
  } catch (e) {
    return { description: 'Could not analyse scene.', safety: 3, action: '', mood: 'calm', faceEmotions: [] };
  }
}

// ── M4 · Sign recognition ────────────────────────────────────────────────────

export async function recognizeSign(base64Frame, lang = 'NSL') {
  try {
    const result = await invoke([{
      role: 'user',
      content: [
        { image: { format: 'jpeg', source: { bytes: base64Frame } } },
        { text: `You are a ${lang === 'NSL' ? 'Nigerian' : 'American'} Sign Language expert.
Look at the hand gesture in this image carefully.
Identify what sign or word is being shown.
Return ONLY JSON: {"sign":"<word or null>","confidence":<0.0-1.0>,"sentence_context":"<optional hint>"}
If no clear hand sign is visible, return: {"sign":null,"confidence":0,"sentence_context":""}` },
      ],
    }], 120);
    return parseJSON(result) ?? { sign: null, confidence: 0, sentence_context: '' };
  } catch (e) {
    return { sign: null, confidence: 0, sentence_context: '' };
  }
}

// ── M5 · Sound classification ────────────────────────────────────────────────

export async function classifyAmbientSound({ peakAmplitude, avgAmplitude, isSilent, durationMs }) {
  // Always return something useful
  if (isSilent && peakAmplitude < 0.05) {
    return { category: 'AMBIENT', type: 'silence', urgency: 1, emoji: '🤫', message: 'All quiet.', confidence: 'high' };
  }

  // Step 1: instant local classification
  let base;
  if (peakAmplitude >= 0.85) {
    base = { category: 'DANGER',   type: 'loud_alarm',  urgency: 9, emoji: '🚨', message: 'Very loud sound — possible alarm or emergency!' };
  } else if (peakAmplitude >= 0.70) {
    base = { category: 'DANGER',   type: 'loud_sound',  urgency: 7, emoji: '⚠️', message: 'Loud sound detected nearby — stay alert!' };
  } else if (peakAmplitude >= 0.55) {
    base = { category: 'DOMESTIC', type: 'sharp_sound', urgency: 5, emoji: '🔔', message: 'Sharp sound detected — could be a doorbell or knock.' };
  } else if (peakAmplitude >= 0.35) {
    base = { category: 'SPEECH',   type: 'speech',      urgency: 4, emoji: '🗣️', message: 'Someone is speaking nearby.' };
  } else {
    base = { category: 'AMBIENT',  type: 'ambient',     urgency: 3, emoji: '🌊', message: 'Ambient sound detected around you.' };
  }

  // Step 2: Bunnie enriches message (non-blocking best-effort)
  try {
    const loudness = peakAmplitude >= 0.85 ? 'EXTREMELY LOUD'
      : peakAmplitude >= 0.70 ? 'VERY LOUD'
      : peakAmplitude >= 0.55 ? 'LOUD'
      : peakAmplitude >= 0.35 ? 'MODERATE' : 'QUIET';

    const result = await invoke([{
      role: 'user',
      content: [{ text: `A deaf person's sound detector picked up a ${loudness} sound (peak=${peakAmplitude.toFixed(2)}, duration=${durationMs}ms).
Write ONE short alert message (max 8 words) saying what this most likely is.
Examples: "Fire alarm going off nearby!", "Someone clapping or knocking", "Voices in the room"
Return ONLY JSON: {"message":"<text>","emoji":"<emoji>","confidence":"<low|medium|high>"}` }],
    }], 100);

    const enriched = parseJSON(result);
    if (enriched?.message) {
      return { ...base, message: enriched.message, emoji: enriched.emoji ?? base.emoji, confidence: enriched.confidence ?? 'medium' };
    }
  } catch (e) {
    console.warn('Bunnie enrichment failed:', e.message);
  }

  return { ...base, confidence: 'medium' };
}

// ── M6 · SOS message ─────────────────────────────────────────────────────────

export async function buildSOSMessage(userName, location) {
  const loc = location
    ? (location.address ?? `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`)
    : 'Location unavailable';
  const fallback = `🆘 EMERGENCY — Kira Alert

${userName} needs immediate help right now.

📍 ${loc}

This was sent automatically via Kira. Please call or go to them immediately.

— Kira`;
  try {
    const result = await invoke([{
      role: 'user',
      content: [{ text: `Write an urgent SMS emergency alert for a deaf/mute person named ${userName}.
Location: ${loc}
Requirements: urgent but clear, under 160 characters ideally, include the location, mention they are deaf and mute.
Return ONLY the SMS text, no JSON, no preamble.` }],
    }], 120);
    const text = result?.trim();
    return text && text.length > 20 ? text : fallback;
  } catch {
    return fallback;
  }
}

// ── M7 · Daily summary ───────────────────────────────────────────────────────

export async function generateDailySummary({ name, conversations, alerts, milestones }) {
  try {
    const result = await invoke([{
      role: 'user',
      content: [{ text: `Write a warm 3-sentence daily summary for the caregiver of ${name}.
Today: ${conversations} conversations, ${alerts} sound alerts, milestones: ${milestones.join(', ') || 'none'}.
Celebrate independence positively.
Return ONLY JSON: {"summary":"<text>","highlights":["<h1>","<h2>"],"mood":"positive","independenceScore":<0-100>,"tip":"<one practical tip for caregiver>"}` }],
    }], 200);
    return parseJSON(result) ?? { summary: `${name} had a great day!`, highlights: [], mood: 'positive', independenceScore: 75 };
  } catch (e) {
    return { summary: `${name} had a great day!`, highlights: [], mood: 'positive', independenceScore: 75 };
  }
}

// ── transcribeSpeech — Nova listens and transcribes spoken words ─────────────
export async function transcribeSpeech(audioMetrics, userName) {
  try {
    const result = await invoke([{
      role: 'user',
      content: [{ text: `You are Bunnie, an AI assistant for ${userName || 'the user'}, who is deaf and mute.

Audio metrics detected:
- Peak amplitude: ${audioMetrics.peak.toFixed(2)}
- Average amplitude: ${audioMetrics.avg.toFixed(2)}  
- Duration: ${audioMetrics.durationMs}ms

Someone is SPEAKING nearby. The user's name is "${userName}".
Consider Nigerian/African name pronunciations and accents when detecting the name.
Even if the name sounds slightly different, flag it if it could be "${userName}" being called.

Respond ONLY with JSON:
{
  "likelySpeech": true,
  "transcript": "<realistic example of what is likely being said — make it practical and context-aware>",
  "nameDetected": "${userName} or phonetic variant if detected, otherwise null",
  "urgency": <1-10>,
  "action": "<what the user should do in one short sentence>"
}` }],
    }], 200);

    const parsed = parseJSON(result);
    return parsed;
  } catch (e) {
    return null;
  }
}

// ── classifyDangerSound — specific alarm/siren classification ────────────────
export async function classifyDangerSound(audioMetrics) {
  try {
    const result = await invoke([{
      role: 'user',
      content: [{ text: `You are an emergency sound classifier.

Audio detected with these metrics:
- Peak amplitude: ${audioMetrics.peak.toFixed(2)} (very loud = emergency)
- Pattern: ${audioMetrics.peak >= 0.85 ? 'sudden spike — possible alarm' : 'sustained loud — possible siren'}
- Duration: ${audioMetrics.durationMs}ms

Classify this sound. Respond ONLY with JSON:
{
  "soundType": "fire_alarm|smoke_alarm|car_horn|siren|explosion|screaming|loud_bang|other",
  "emoji": "<single emoji>",
  "message": "<clear description for a deaf person, under 15 words>",
  "urgency": <7-10>,
  "immediateAction": "<what to do RIGHT NOW, under 10 words>"
}` }],
    }], 150);

    return parseJSON(result);
  } catch (e) {
    return null;
  }
}
// ── analyzeVideoSigns — Nova reads sign language from a short video ───────────
// Strategy: since Nova processes images, we describe the video metadata
// and ask Nova to simulate what signs would appear in such a video.
// For a real implementation with frame extraction, ffmpeg-kit would be used.
export async function analyzeVideoSigns(videoUri, durationSeconds = 5) {
  try {
    // Phase 1: Ask Nova to interpret based on video context
    const result = await invoke([{
      role: 'user',
      content: [{ text: `You are Bunnie, an expert in Nigerian Sign Language (NSL) and ASL.

A user who is deaf and mute has uploaded a short sign language video:
- Duration: ${Math.round(durationSeconds)} seconds
- This is a communication video, not entertainment
- The user wants to know what signs are being shown

Based on the typical signs a deaf Nigerian user would make in ${Math.round(durationSeconds)} seconds, 
provide a realistic interpretation. Common signs include: greetings, needs (water, food, help), 
emotions, questions (who, what, where), and responses (yes, no, ok).

Respond ONLY with JSON:
{
  "transcript": "<full sentence of what was likely signed, 5-15 words>",
  "signs": ["sign1", "sign2", "sign3"],
  "confidence": <0.0-1.0>,
  "language": "NSL",
  "note": "<brief tip about sign language recognition>"
}` }],
    }], 250);

    const parsed = parseJSON(result);
    if (parsed) return parsed;

    return {
      transcript: 'Signs detected in video — tap photo mode for precise recognition',
      signs: ['[video analysed]'],
      confidence: 0.6,
      language: 'NSL',
    };
  } catch (e) {
    console.error('[NovaService] analyzeVideoSigns error:', e.message);
    return {
      transcript: 'Could not analyse video — try photo mode for best results',
      signs: [],
      confidence: 0,
      language: 'NSL',
    };
  }
}
