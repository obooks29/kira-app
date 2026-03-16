import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, StatusBar, Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import SenseCard from '../../components/common/SenseCard';
import { useApp } from '../../utils/AppContext';

export default function SettingsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const s = state.settings;

  const toggle = (key) => dispatch({ type:'SET_SETTINGS', payload:{ [key]: !s[key] }});

  const resetAll = () => {
    Alert.alert('Reset SenseVoice?', 'This will clear all your data. This cannot be undone.', [
      { text:'Cancel', style:'cancel' },
      { text:'Reset',  style:'destructive', onPress:() => dispatch({ type:'RESET' }) },
    ]);
  };

  return (
    <View style={{ flex:1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize:22, color: Colors.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[Typography.titleLarge, { color: Colors.onBackground }]}>⚙️ Settings</Text>
        <View style={{ width:40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 60 }}>
        {/* Accessibility */}
        <Text style={[Typography.titleSmall, { color: Colors.subtitle, marginBottom: Spacing.sm }]}>ACCESSIBILITY</Text>
        {[
          { key:'hapticEnabled',  label:'Haptic Feedback',   sub:'Vibrations for alerts and interactions',  emoji:'📳' },
          { key:'highContrast',   label:'High Contrast',     sub:'Stronger colours for readability',        emoji:'🔆' },
        ].map(item => (
          <SenseCard key={item.key} variant="elevated" padding="md" style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.md }}>
              <Text style={{ fontSize:24 }}>{item.emoji}</Text>
              <View style={{ flex:1 }}>
                <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>{item.label}</Text>
                <Text style={[Typography.bodySmall,  { color: Colors.subtitle }]}>{item.sub}</Text>
              </View>
              <Switch
                value={s[item.key] ?? false}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: Colors.disabled, true: Colors.primaryLight }}
                thumbColor={Colors.primary}
              />
            </View>
          </SenseCard>
        ))}

        {/* Alerts */}
        <Text style={[Typography.titleSmall, { color: Colors.subtitle, marginBottom: Spacing.sm, marginTop: Spacing.md }]}>SOUND ALERTS</Text>
        {[
          { key:'dangerAlerts',   label:'Danger Alerts',   sub:'Fire, siren, crash (always on)',   emoji:'⚠️', disabled:true },
          { key:'speechAlerts',   label:'Speech Alerts',   sub:'Your name, conversations',          emoji:'🗣️' },
          { key:'domesticAlerts', label:'Home Sounds',      sub:'Doorbell, baby, dog',              emoji:'🏠' },
        ].map(item => (
          <SenseCard key={item.key} variant="elevated" padding="md" style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.md }}>
              <Text style={{ fontSize:24 }}>{item.emoji}</Text>
              <View style={{ flex:1 }}>
                <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>{item.label}</Text>
                <Text style={[Typography.bodySmall,  { color: Colors.subtitle }]}>{item.sub}</Text>
              </View>
              <Switch
                value={item.disabled ? true : (s[item.key] ?? true)}
                onValueChange={() => !item.disabled && toggle(item.key)}
                trackColor={{ false: Colors.disabled, true: Colors.primaryLight }}
                thumbColor={Colors.primary}
                disabled={item.disabled}
              />
            </View>
          </SenseCard>
        ))}

        {/* Danger zone */}
        <Text style={[Typography.titleSmall, { color: Colors.error, marginBottom: Spacing.sm, marginTop: Spacing.md }]}>DANGER ZONE</Text>
        <SenseCard variant="danger" padding="md">
          <TouchableOpacity onPress={resetAll}>
            <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.md }}>
              <Text style={{ fontSize:24 }}>🗑️</Text>
              <View style={{ flex:1 }}>
                <Text style={[Typography.titleSmall, { color: Colors.danger }]}>Reset All Data</Text>
                <Text style={[Typography.bodySmall,  { color: Colors.subtitle }]}>Clear all saved data and start over</Text>
              </View>
              <Text style={{ color: Colors.danger, fontSize:18 }}>›</Text>
            </View>
          </TouchableOpacity>
        </SenseCard>

        {/* Version */}
        <Text style={[Typography.bodySmall, { color: Colors.disabled, textAlign:'center', marginTop: Spacing.xl }]}>
          SenseVoice v1.0.0  ·  Built with ❤️ for 70M people
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: Spacing.md, paddingTop:56, paddingBottom: Spacing.md },
  back:   { width:40, height:40, alignItems:'center', justifyContent:'center' },
});
