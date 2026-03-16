/**
 * Kira — AI Co-pilot for the Deaf & Mute
 * Powered by Bunnie AI (Amazon Nova)
 *
 * NOTE: AppRegistry name must match the native Android/iOS registration.
 * The native module was built as "SenseVoice" — do NOT change this string
 * without also updating MainActivity.java and a full rebuild.
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';

// ── Suppress known harmless warnings ────────────────────────────────────────
LogBox.ignoreLogs([
  // react-native-audio-record uses old NativeEventEmitter API — harmless
  'new NativeEventEmitter() was called with a non-null argument without the required',
  'NativeEventEmitter',
  // Reanimated setup warning
  'Reanimated 2',
  '[Sonic]',
  'WebSocket error',
  'Expected HTTP 101',
  'NovaSonic',
  // Gradle version mismatch — build-time only
  'Gradle',
]);

// ── Register app — name MUST match native side ───────────────────────────────
// Display name is "Kira" (set in app.json + strings.xml)
// Registration name stays "SenseVoice" to match MainActivity.java
AppRegistry.registerComponent('SenseVoice', () => App);
