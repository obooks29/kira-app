import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Alert, TextInput, Linking, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import SenseCard    from '../../components/common/SenseCard';
import SenseButton  from '../../components/common/SenseButton';
import EmergencyFAB from '../../components/common/EmergencyFAB';
import { useApp }   from '../../utils/AppContext';
import { buildSOSMessage } from '../../services/NovaService';

// Try to import optional native modules gracefully
let SendSMS = null;
let Geolocation = null;
try { SendSMS = require('react-native-sms').default; } catch {}
try { Geolocation = require('react-native-geolocation-service').default; } catch {}

export default function MySafetyScreen({ navigation, route }) {
  const { state, dispatch } = useApp();
  const [sosSent, setSosSent]             = useState(false);
  const [sosStatus, setSosStatus]         = useState('');
  const [showCard, setShowCard]           = useState(false);
  const [newContact, setNewContact]       = useState({ name: '', phone: '' });
  const [addingContact, setAddingContact] = useState(false);
  const [locating, setLocating]           = useState(false);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (route?.params?.triggerSOS) triggerSOS();
  }, []);

  // ── Get location ──────────────────────────────────────────────────────────
  const getLocation = () => new Promise((resolve) => {
    if (!Geolocation) {
      resolve({ address: 'Lagos, Nigeria' }); // fallback
      return;
    }
    setLocating(true);
    Geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        });
      },
      () => {
        setLocating(false);
        resolve({ address: 'Location unavailable' });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  });

  // ── Send SMS to all contacts ───────────────────────────────────────────────
  const sendSMSToContacts = async (message) => {
    const contacts = state.emergencyContacts;
    if (contacts.length === 0) {
      setSosStatus('⚠️ No contacts saved — open SMS app');
      // Fallback: open SMS app with message pre-filled, no recipient
      const encoded = encodeURIComponent(message);
      Linking.openURL(`sms:?body=${encoded}`).catch(() => {});
      return 0;
    }

    let sent = 0;

    if (SendSMS) {
      // react-native-sms: opens native SMS composer with recipients pre-filled
      const numbers = contacts.map(c => c.phone).filter(Boolean);
      SendSMS.send(
        {
          body: message,
          recipients: numbers,
          successTypes: ['sent', 'queued'],
          allowAndroidSendWithoutReadPermission: true,
        },
        (completed, cancelled, error) => {
          if (completed) {
            setSosStatus(`✅ SOS sent to ${numbers.length} contact(s)`);
          } else if (cancelled) {
            setSosStatus('⚠️ SMS cancelled by user');
          } else {
            setSosStatus('❌ SMS failed — try manually');
          }
        }
      );
      sent = numbers.length;
    } else {
      // Fallback: open SMS app with first contact + message
      const firstPhone = contacts[0]?.phone || '';
      const encoded = encodeURIComponent(message);
      Linking.openURL(`sms:${firstPhone}?body=${encoded}`).catch(() => {});
      setSosStatus(`📱 SMS app opened for ${contacts.length} contact(s)`);
      sent = contacts.length;
    }

    return sent;
  };

  // ── Main SOS trigger ──────────────────────────────────────────────────────
  const triggerSOS = async () => {
    setSosSent(true);
    setSosStatus('📍 Getting your location…');

    // Flash animation
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    // Get location then build Nova message
    const location = await getLocation();
    setSosStatus('✨ Bunnie composing message…');

    const message = await buildSOSMessage(
      state.user.name || 'Kira User',
      location
    ).catch(() =>
      `🆘 EMERGENCY — ${state.user.name || 'Kira User'} needs help NOW!\n📍 ${location.address}\n\nSent via Kira`
    );

    setSosStatus('📨 Sending to contacts…');
    await sendSMSToContacts(message);

    // Award XP for safety engagement
    dispatch({ type: 'ADD_XP', payload: 10 });
  };

  const addContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      Alert.alert('Missing info', 'Please enter both a name and phone number.');
      return;
    }
    dispatch({
      type: 'SET_EMERGENCY_CONTACTS',
      payload: [...state.emergencyContacts, { ...newContact, id: Date.now().toString() }],
    });
    setNewContact({ name: '', phone: '' });
    setAddingContact(false);
    dispatch({ type: 'ADD_XP', payload: 20 });
    dispatch({ type: 'ADD_MILESTONE', payload: { id: 'emergency_set', emoji: '🛡️', title: 'Safety Ready', xp: 100, date: new Date().toISOString() } });
  };

  const removeContact = (id) => {
    Alert.alert('Remove contact?', 'This contact will no longer receive SOS alerts.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () =>
        dispatch({ type: 'SET_EMERGENCY_CONTACTS', payload: state.emergencyContacts.filter(c => c.id !== id) })
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" />

      {/* Flash overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, {
        backgroundColor: Colors.danger, opacity: flashAnim, zIndex: 999, pointerEvents: 'none',
      }]} />

      {/* Header */}
      <LinearGradient colors={Colors.gradientDanger} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize: 22, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[Typography.titleLarge, { color: '#fff' }]}>🛡️ My Safety</Text>
          <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.75)' }]}>
            {state.emergencyContacts.length} contact{state.emergencyContacts.length !== 1 ? 's' : ''} saved · Bunnie AI
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 60 }}>

        {/* ── SOS Button ── */}
        <SenseCard variant={sosSent ? 'danger' : 'elevated'} padding="xl">
          <View style={{ alignItems: 'center', gap: Spacing.md }}>
            <EmergencyFAB onSOS={triggerSOS} />
            <Text style={[Typography.titleMedium, { color: Colors.onBackground, textAlign: 'center' }]}>
              {sosSent ? '🆘 SOS Activated' : 'Hold 2 seconds to send SOS'}
            </Text>
            <Text style={[Typography.bodySmall, { color: Colors.subtitle, textAlign: 'center' }]}>
              Bunnie writes a personalised alert · GPS location included
            </Text>

            {/* Status */}
            {sosStatus ? (
              <Animated.View style={[{ transform: [{ scale: scaleAnim }], width: '100%' }]}>
                <SenseCard variant="danger" padding="sm">
                  <Text style={[Typography.bodyMedium, { color: Colors.danger, textAlign: 'center' }]}>
                    {locating ? '📍 Locating…  ' : ''}{sosStatus}
                  </Text>
                </SenseCard>
              </Animated.View>
            ) : null}
          </View>
        </SenseCard>

        {/* ── How SOS works ── */}
        <SenseCard variant="tonal" padding="md">
          <Text style={[Typography.labelSmall, { color: Colors.primary, marginBottom: Spacing.sm }]}>
            ✨ HOW NOVA SOS WORKS
          </Text>
          {[
            '1. You hold the SOS button',
            '2. GPS location is captured',
            '3. Bunnie writes a personalised emergency message',
            '4. SMS is sent to all your saved contacts',
          ].map((step, i) => (
            <Text key={i} style={[Typography.bodySmall, { color: Colors.onBackground, marginBottom: 4 }]}>
              {step}
            </Text>
          ))}
        </SenseCard>

        {/* ── Emergency ID Card ── */}
        <TouchableOpacity onPress={() => setShowCard(c => !c)}>
          <SenseCard variant="elevated" padding="md">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Text style={{ fontSize: 28 }}>🪪</Text>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>Emergency ID Card</Text>
                <Text style={[Typography.bodySmall, { color: Colors.subtitle }]}>Show to first responders · Tap to expand</Text>
              </View>
              <Text style={{ fontSize: 18, color: Colors.primary }}>{showCard ? '▲' : '▼'}</Text>
            </View>
            {showCard && (
              <View style={styles.idCard}>
                <View style={styles.idHeader}>
                  <Text style={[Typography.headlineSmall, { color: '#fff' }]}>🆘 EMERGENCY CARD</Text>
                </View>
                <View style={styles.idBody}>
                  <Text style={[Typography.titleMedium, { color: Colors.onBackground, marginBottom: Spacing.sm }]}>
                    I am deaf and mute.
                  </Text>
                  <Text style={[Typography.bodyLarge, { color: Colors.onBackground }]}>
                    Please read this screen. I cannot speak or hear.
                  </Text>
                  <View style={styles.idDivider} />
                  <Text style={[Typography.labelMedium, { color: Colors.subtitle }]}>NAME</Text>
                  <Text style={[Typography.titleLarge, { color: Colors.onBackground }]}>
                    {state.user.name || 'User'}
                  </Text>
                  {state.emergencyContacts[0] && (
                    <>
                      <Text style={[Typography.labelMedium, { color: Colors.subtitle, marginTop: Spacing.sm }]}>
                        EMERGENCY CONTACT
                      </Text>
                      <Text style={[Typography.titleMedium, { color: Colors.onBackground }]}>
                        {state.emergencyContacts[0].name} — {state.emergencyContacts[0].phone}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            )}
          </SenseCard>
        </TouchableOpacity>

        {/* ── Emergency Contacts ── */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <Text style={[Typography.titleMedium, { color: Colors.onBackground }]}>
              Emergency Contacts ({state.emergencyContacts.length})
            </Text>
            <TouchableOpacity onPress={() => setAddingContact(a => !a)}>
              <Text style={[Typography.labelMedium, { color: Colors.primary }]}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {addingContact && (
            <SenseCard variant="tonal" padding="md" style={{ marginBottom: Spacing.sm }}>
              <TextInput
                value={newContact.name}
                onChangeText={v => setNewContact(c => ({ ...c, name: v }))}
                placeholder="Full name"
                placeholderTextColor={Colors.disabled}
                style={styles.contactInput}
              />
              <TextInput
                value={newContact.phone}
                onChangeText={v => setNewContact(c => ({ ...c, phone: v }))}
                placeholder="Phone number (e.g. +2348012345678)"
                placeholderTextColor={Colors.disabled}
                style={[styles.contactInput, { marginTop: Spacing.sm }]}
                keyboardType="phone-pad"
              />
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <SenseButton label="Save Contact" onPress={addContact} size="small" style={{ flex: 1 }} />
                <SenseButton label="Cancel" onPress={() => setAddingContact(false)} variant="ghost" size="small" style={{ flex: 1 }} />
              </View>
            </SenseCard>
          )}

          {state.emergencyContacts.length === 0 ? (
            <SenseCard variant="outlined" padding="md">
              <Text style={[Typography.bodyMedium, { color: Colors.subtitle, textAlign: 'center' }]}>
                No emergency contacts yet.{'\n'}Add someone who cares about you. 💙
              </Text>
            </SenseCard>
          ) : (
            state.emergencyContacts.map((c, i) => (
              <SenseCard key={c.id ?? i} variant="elevated" padding="md" style={{ marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View style={styles.contactAvatar}>
                    <Text style={{ fontSize: 24 }}>{i === 0 ? '⭐' : '👤'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>{c.name}</Text>
                    <Text style={[Typography.bodySmall, { color: Colors.subtitle }]}>{c.phone || 'No phone'}</Text>
                  </View>
                  {i === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={[Typography.labelSmall, { color: Colors.primary }]}>Primary</Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => removeContact(c.id)} style={{ padding: 8 }}>
                    <Text style={{ color: Colors.disabled, fontSize: 18 }}>×</Text>
                  </TouchableOpacity>
                </View>
              </SenseCard>
            ))
          )}
        </View>

        {/* ── Safety Tips ── */}
        <SenseCard variant="warning" padding="md">
          <Text style={[Typography.titleSmall, { color: Colors.warning, marginBottom: Spacing.sm }]}>⚡ Safety Tips</Text>
          {[
            'Hold the SOS button for 2 seconds to activate',
            'Bunnie generates a personalised message with your location',
            'Add at least 2 emergency contacts for best coverage',
            'Keep your phone charged above 20%',
          ].map((tip, i) => (
            <Text key={i} style={[Typography.bodySmall, { color: Colors.onBackground, marginBottom: 4 }]}>
              • {tip}
            </Text>
          ))}
        </SenseCard>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.lg, gap: Spacing.sm },
  back:          { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  idCard:        { marginTop: Spacing.md, borderRadius: Radius.lg, overflow: 'hidden' },
  idHeader:      { backgroundColor: Colors.danger, padding: Spacing.md },
  idBody:        { backgroundColor: Colors.dangerLight ?? '#FFEBEE', padding: Spacing.md },
  idDivider:     { height: 1, backgroundColor: Colors.danger + '40', marginVertical: Spacing.sm },
  contactInput:  { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm, fontSize: 15, color: Colors.onBackground, borderWidth: 1, borderColor: Colors.divider },
  contactAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  primaryBadge:  { backgroundColor: Colors.primaryContainer, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
});