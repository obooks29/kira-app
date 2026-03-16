/**
 * NovaSonicService.js
 * 
 * Pipeline: Text → Nova Sonic (rephrases) → Amazon Polly (speaks) → MP3 → Phone
 * 
 * MP3 playback uses react-native-fs (already installed) to write the file,
 * then Android's built-in MediaPlayer via Linking — no extra packages needed.
 */

const SONIC_SERVER_URL = 'wss://kira-sonic-server.onrender.com';

let Tts  = null;
let RNFS = null;
try { Tts  = require('react-native-tts').default; } catch {}
try { RNFS = require('react-native-fs');          } catch {}

let currentWs      = null;
let isSpeaking     = false;
let pendingResolve = null;
let fallbackCalled = false;

// ── Main speak function ───────────────────────────────────────────────────────
export async function sonicSpeak(text, personality = 'Warm & Friendly') {
  if (!text?.trim()) return;
  await sonicStop();

  return new Promise((resolve) => {
    pendingResolve = resolve;
    isSpeaking     = true;
    fallbackCalled = false;

    const requestId = Date.now().toString();

    try {
      const ws = new WebSocket(SONIC_SERVER_URL);
      currentWs = ws;

      // 15s timeout — Render free tier wakes up slowly
      const connectTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('[Sonic] Server timeout — TTS fallback');
          ws.close();
          doFallback(text, resolve);
        }
      }, 15000);

      ws.onopen = () => {
        clearTimeout(connectTimeout);
        console.log('[Sonic+Polly] ✅ Connected — sending text');
        ws.send(JSON.stringify({ type: 'speak', text, personality, requestId }));
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'start') {
            console.log('[Sonic+Polly] Processing pipeline started');

          } else if (msg.type === 'mp3_audio') {
            // Polly returned MP3 — play it natively
            console.log('[Sonic+Polly] ✅ MP3 received from Polly — playing');
            ws.close();
            await playMP3(msg.audio, text, resolve);

          } else if (msg.type === 'done') {
            console.log('[Sonic+Polly] Pipeline complete');

          } else if (msg.type === 'error') {
            console.log('[Sonic+Polly] Error:', msg.message, '— TTS fallback');
            ws.close();
            doFallback(text, resolve);

          } else if (msg.type === 'pong') {
            console.log('[Sonic+Polly] Server alive');
          }
        } catch (e) {
          console.log('[Sonic+Polly] Message error:', e.message);
        }
      };

      ws.onerror = () => {
        console.log('[Sonic+Polly] WebSocket error — TTS fallback');
        doFallback(text, resolve);
      };

      ws.onclose = () => {
        isSpeaking = false;
        currentWs  = null;
      };

      // 60s overall timeout (Nova Sonic + Polly can take time on cold start)
      setTimeout(() => {
        if (isSpeaking && !fallbackCalled) {
          console.log('[Sonic+Polly] Overall timeout — TTS fallback');
          if (currentWs) { try { currentWs.close(); } catch {} }
          doFallback(text, resolve);
        }
      }, 60000);

    } catch (err) {
      console.log('[Sonic+Polly] Setup error — TTS fallback:', err.message);
      doFallback(text, resolve);
    }
  });
}

// ── Play MP3 via react-native-video (already installed) ──────────────────────
async function playMP3(mp3Base64, originalText, resolve) {
  if (!RNFS) {
    console.log('[Sonic+Polly] RNFS unavailable — TTS fallback');
    doFallback(originalText, resolve);
    return;
  }

  try {
    const filePath = `${RNFS.CachesDirectoryPath}/kira_polly_${Date.now()}.mp3`;
    await RNFS.writeFile(filePath, mp3Base64, 'base64');
    console.log('[Sonic+Polly] MP3 written to:', filePath);

    // Pass mp3Path back to UI — Video component in MyVoiceScreen plays it
    // react-native-video is already installed and handles MP3 natively
    isSpeaking = false;
    fallbackCalled = true;  // prevent TTS from also firing
    resolve({ mp3Path: `file://${filePath}` });

  } catch (e) {
    console.log('[Sonic+Polly] MP3 write error:', e.message);
    doFallback(originalText, resolve);
  }
}

// ── Stop ──────────────────────────────────────────────────────────────────────
export async function sonicStop() {
  isSpeaking = false;
  if (currentWs) { try { currentWs.close(); } catch {} currentWs = null; }
  if (Tts) { try { Tts.stop(); } catch {} }
  if (pendingResolve) { pendingResolve(); pendingResolve = null; }
}

// ── TTS fallback ──────────────────────────────────────────────────────────────
function doFallback(text, resolve) {
  if (fallbackCalled) return;
  fallbackCalled = true;
  isSpeaking = false;
  if (!text?.trim() || !Tts) { resolve(); return; }
  try {
    Tts.removeAllListeners('tts-finish');
    Tts.removeAllListeners('tts-error');
    Tts.speak(text);
    Tts.addEventListener('tts-finish', () => {
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-error');
      resolve();
    });
    Tts.addEventListener('tts-error', () => {
      Tts.removeAllListeners('tts-finish');
      resolve();
    });
  } catch { resolve(); }
}

// ── Check availability ────────────────────────────────────────────────────────
export async function isSonicAvailable() {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(SONIC_SERVER_URL);
      const t = setTimeout(() => { ws.close(); resolve(false); }, 8000);
      ws.onopen    = () => { clearTimeout(t); ws.send(JSON.stringify({ type: 'ping' })); };
      ws.onmessage = (e) => {
        try { if (JSON.parse(e.data).type === 'pong') { ws.close(); resolve(true); } }
        catch { ws.close(); resolve(false); }
      };
      ws.onerror = () => { clearTimeout(t); resolve(false); };
    } catch { resolve(false); }
  });
}