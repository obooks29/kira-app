/**
 * BunnieAgent.js
 * Kira's agentic AI flow powered by Amazon Nova
 *
 * Agent chain:
 * Step 1 — My Ears detects DANGER sound (urgency >= 7)
 * Step 2 — Nova reasons about the threat and composes personalised SOS
 * Step 3 — Nova decides who to notify (contacts, caregiver, or both)
 * Step 4 — SMS dispatched automatically, caregiver log updated
 *
 * This is a multi-step Nova reasoning chain — each step uses Nova's
 * output as input to the next, forming a true agentic pipeline.
 */

import { invoke } from './NovaService';
import { Linking } from 'react-native';

// SMS — optional package, gracefully handled
let SendSMS = null;
try { SendSMS = require('react-native-sms').default; } catch {}

// ── Agent state ───────────────────────────────────────────────────────────────
let agentLog = []; // full chain-of-thought log for demo/judging

export function getAgentLog() { return [...agentLog]; }
export function clearAgentLog() { agentLog = []; }

function logStep(step, input, output) {
  const entry = {
    step,
    timestamp: new Date().toLocaleTimeString(),
    input:     JSON.stringify(input).slice(0, 200),
    output:    typeof output === 'string' ? output.slice(0, 300) : JSON.stringify(output).slice(0, 300),
  };
  agentLog.unshift(entry);
  console.log(`[BunnieAgent] Step ${step}:`, entry);
  return entry;
}

// ── Main agent entry point ────────────────────────────────────────────────────
/**
 * runDangerAgent — triggered when My Ears detects urgency >= 7
 *
 * @param {object} params
 *   alertData     — { category, type, urgency, message, emoji }
 *   userName      — from AppContext
 *   location      — { address } or null
 *   contacts      — emergency contacts array
 *   caregiverName — from AppContext
 *   onStep        — callback(stepNum, description) for UI updates
 *   onComplete    — callback(result) when agent finishes
 */
export async function runDangerAgent({
  alertData,
  userName,
  location,
  contacts,
  caregiverName,
  onStep,
  onComplete,
}) {
  agentLog = [];
  const results = {};

  try {

    // ── STEP 1: Nova reasons about the threat ─────────────────────────────
    onStep?.(1, '🧠 Bunnie is assessing the situation…');

    const threatAssessment = await invoke([{
      role: 'user',
      content: [{ text: `You are Bunnie, an AI safety agent for ${userName}, who is deaf and mute.

A sound sensor just detected: "${alertData.message}" (category: ${alertData.category}, urgency: ${alertData.urgency}/10).
Location: ${location?.address ?? 'unknown'}.

Assess this threat and decide:
1. Is this a genuine emergency requiring immediate help? (true/false)
2. What is most likely happening?
3. Who should be notified — emergency contacts, caregiver, or both?
4. What tone should the alert have — urgent/calm?

Return ONLY JSON:
{
  "isEmergency": true,
  "situation": "<one sentence describing what is likely happening>",
  "notifyContacts": true,
  "notifyCaregiver": true,
  "tone": "urgent",
  "reasoning": "<brief chain of thought>"
}` }],
    }], 200);

    const assessment = parseJSON(threatAssessment) ?? {
      isEmergency: true, situation: alertData.message,
      notifyContacts: true, notifyCaregiver: true, tone: 'urgent',
    };

    logStep(1, { alert: alertData.message }, assessment);
    results.assessment = assessment;

    if (!assessment.isEmergency) {
      onComplete?.({ cancelled: true, reason: 'Nova assessed as non-emergency', log: agentLog });
      return results;
    }

    // ── STEP 2: Nova composes personalised SOS message ────────────────────
    onStep?.(2, '✍️ Bunnie is composing your emergency message…');

    const sosText = await invoke([{
      role: 'user',
      content: [{ text: `Write an emergency SMS for ${userName}, who is deaf and mute.

Situation: ${assessment.situation}
Location: ${location?.address ?? 'unknown'}
Tone: ${assessment.tone}
Recipient: emergency contact

Requirements:
- Under 160 characters
- Include name, situation, location
- Mention they cannot call for help themselves
- End with "— Kira AI"

Return ONLY the SMS text, nothing else.` }],
    }], 120);

    const sosMessage = sosText?.trim() ?? `🆘 ${userName} needs help! ${assessment.situation}. Location: ${location?.address}. They are deaf and cannot call. — Kira AI`;

    logStep(2, { situation: assessment.situation }, sosMessage);
    results.sosMessage = sosMessage;

    // ── STEP 3: Nova composes caregiver notification ───────────────────────
    if (assessment.notifyCaregiver && caregiverName) {
      onStep?.(3, '💙 Notifying caregiver…');

      const caregiverMsg = await invoke([{
        role: 'user',
        content: [{ text: `Write a caregiver notification for ${caregiverName} about ${userName}.

Situation: ${assessment.situation}
Time: ${new Date().toLocaleTimeString()}
Location: ${location?.address ?? 'unknown'}

Write 2 sentences: what happened and what the caregiver should do.
Return ONLY the message text.` }],
      }], 100);

      logStep(3, { caregiver: caregiverName }, caregiverMsg);
      results.caregiverMessage = caregiverMsg?.trim();
    }

    // ── STEP 4: Dispatch ──────────────────────────────────────────────────
    onStep?.(4, '📨 Sending alerts…');

    const dispatched = [];

    // Send SMS to emergency contacts
    if (assessment.notifyContacts && contacts.length > 0) {
      const numbers = contacts.map(c => c.phone).filter(Boolean);
      if (SendSMS && numbers.length > 0) {
        try {
          SendSMS.send({
            body:       sosMessage,
            recipients: numbers,
            successTypes: ['sent', 'queued'],
            allowAndroidSendWithoutReadPermission: true,
          }, (completed) => {
            console.log('[BunnieAgent] SMS dispatched:', completed ? 'sent' : 'cancelled');
          });
          dispatched.push(`SMS to ${numbers.length} contact(s)`);
        } catch (smsErr) {
          console.log('[BunnieAgent] SMS fallback:', smsErr.message);
          const encoded = encodeURIComponent(sosMessage);
          Linking.openURL(`sms:${numbers[0]}?body=${encoded}`).catch(() => {});
          dispatched.push('SMS app opened');
        }
      } else if (numbers.length > 0) {
        const encoded = encodeURIComponent(sosMessage);
        Linking.openURL(`sms:${numbers[0]}?body=${encoded}`).catch(() => {});
        dispatched.push('SMS app opened');
      } else {
        dispatched.push('No contacts saved — add contacts in My Safety');
      }
    } else if (!assessment.notifyContacts) {
      dispatched.push('Nova assessed as non-emergency — no SMS sent');
    } else {
      dispatched.push('No emergency contacts saved');
    }

    logStep(4, { contacts: contacts.length }, dispatched.join(', ') || 'No contacts');
    results.dispatched = dispatched;

    // ── Complete ──────────────────────────────────────────────────────────
    onStep?.(5, '✅ Bunnie has handled the emergency');
    onComplete?.({ success: true, results, log: agentLog });

    return results;

  } catch (err) {
    console.error('[BunnieAgent] Agent error:', err.message);
    logStep('ERROR', {}, err.message);
    onComplete?.({ success: false, error: err.message, log: agentLog });
    return results;
  }
}

// ── Helper: parse JSON from Nova response ─────────────────────────────────────
function parseJSON(text) {
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}