import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Image, PermissionsAndroid, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useApp } from '../../utils/AppContext';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../theme';
import SenseCard   from '../../components/common/SenseCard';
import SenseButton from '../../components/common/SenseButton';
import { analyzeScene } from '../../services/NovaService';
import Video from 'react-native-video';
import { sonicSpeak } from '../../services/NovaSonicService';

async function requestCameraPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'Kira needs camera access to analyse scenes for you.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export default function MyWorldScreen({ navigation }) {
  const { state } = useApp();
  const [analysed, setAnalysed] = useState(false);
  const [scene, setScene]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [mp3Uri, setMp3Uri]       = useState(null);

  const safetyColor = (score) => {
    if (score >= 4) return Colors.success;
    if (score >= 3) return Colors.warning;
    return Colors.danger;
  };

  const pickAndAnalyse = async (useCamera) => {
    if (useCamera) {
      const granted = await requestCameraPermission();
      if (!granted) {
        alert('Camera permission denied. Please enable it in Settings.');
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.6,
      includeBase64: true,
      maxWidth: 800,
      maxHeight: 800,
      saveToPhotos: false,
    };

    const launcher = useCamera ? launchCamera : launchImageLibrary;

    launcher(options, async (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.base64) return;

      setImageUri(asset.uri);
      setLoading(true);
      setAnalysed(false);
      setScene(null);

      try {
        const result = await analyzeScene(asset.base64);
        setScene(result);
        setAnalysed(true);
        // Bunnie reads the scene description aloud
        if (result?.description) {
          const toSpeak = result.description + (result.safety ? `. Safety: ${result.safety}.` : '');
          sonicSpeak(toSpeak, state.user?.voicePersonality).then(r => { if(r?.mp3Path) setMp3Uri(r.mp3Path); }).catch(() => {});
        }
      } catch (e) {
        console.error('Scene analysis failed:', e);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#1B5E20', '#43A047']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={{ fontSize: 22, color: '#fff' }}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={[Typography.titleLarge, { color: '#fff' }]}>🌍 My World</Text>
          <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.75)' }]}>
            Scene understanding · Powered by Bunnie
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 }}>

        {/* Image preview */}
        <View style={styles.camera}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <>
              <Text style={{ fontSize: 56 }}>📷</Text>
              <Text style={[Typography.bodyMedium, { color: 'rgba(255,255,255,0.8)', marginTop: Spacing.sm, textAlign: 'center' }]}>
                Take or pick a photo to analyse
              </Text>
              <View style={styles.crossH} />
              <View style={styles.crossV} />
            </>
          )}
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
            onPress={() => pickAndAnalyse(true)}
            disabled={loading}
          >
            <Text style={{ fontSize: 22 }}>📷</Text>
            <Text style={[Typography.labelMedium, { color: '#fff', marginTop: 4 }]}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.secondary ?? Colors.info }]}
            onPress={() => pickAndAnalyse(false)}
            disabled={loading}
          >
            <Text style={{ fontSize: 22 }}>🖼️</Text>
            <Text style={[Typography.labelMedium, { color: '#fff', marginTop: 4 }]}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <SenseCard variant="tonal" padding="md">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Text style={{ fontSize: 22 }}>🔍</Text>
              <Text style={[Typography.bodyMedium, { color: Colors.primary }]}>
                Bunnie is analysing your scene…
              </Text>
            </View>
          </SenseCard>
        )}

        {analysed && scene && (
          <>
            <SenseCard variant="elevated" padding="md">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={[styles.safetyCircle, { backgroundColor: safetyColor(scene.safety) + '20', borderColor: safetyColor(scene.safety) }]}>
                  <Text style={[Typography.headlineMedium, { color: safetyColor(scene.safety) }]}>
                    {scene.safety}/5
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.titleSmall, { color: Colors.onBackground }]}>Safety Score</Text>
                  <Text style={[Typography.bodySmall, { color: Colors.subtitle }]}>
                    {scene.safety >= 4 ? 'This place feels safe' : scene.safety >= 3 ? 'Stay aware' : 'Be cautious'}
                  </Text>
                </View>
              </View>
            </SenseCard>

            <SenseCard variant="tonal" padding="md">
              <Text style={[Typography.labelSmall, { color: Colors.primary, marginBottom: 6 }]}>SCENE DESCRIPTION</Text>
              <Text style={[Typography.bodyLarge, { color: Colors.onBackground }]}>{scene.description}</Text>
            </SenseCard>

            {scene.action ? (
              <SenseCard variant="elevated" padding="md">
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
                  <Text style={{ fontSize: 22 }}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.titleSmall, { color: Colors.success }]}>What to do</Text>
                    <Text style={[Typography.bodyMedium, { color: Colors.onBackground, marginTop: 4 }]}>{scene.action}</Text>
                  </View>
                </View>
              </SenseCard>
            ) : null}

            {scene.faceEmotions?.length > 0 && (
              <SenseCard variant="elevated" padding="md">
                <Text style={[Typography.labelSmall, { color: Colors.primary, marginBottom: Spacing.sm }]}>PEOPLE'S EMOTIONS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                  {scene.faceEmotions.map((e, i) => (
                    <View key={i} style={styles.emotionChip}>
                      <Text style={[Typography.labelMedium, { color: Colors.success }]}>{e}</Text>
                    </View>
                  ))}
                </View>
              </SenseCard>
            )}

            <SenseCard variant="elevated" padding="md">
              <Text style={[Typography.labelSmall, { color: Colors.primary, marginBottom: 4 }]}>OVERALL VIBE</Text>
              <Text style={[Typography.bodyLarge, { color: Colors.onBackground }]}>🌤️ {scene.mood}</Text>
            </SenseCard>

            <SenseButton
              label="📷 Analyse Another Scene"
              onPress={() => { setAnalysed(false); setScene(null); setImageUri(null); }}
              variant="ghost"
            />
          </>
        )}
      </ScrollView>

      {mp3Uri && (
        <Video source={{ uri: mp3Uri }} audioOnly={true} paused={false}
          repeat={false} volume={1.0} style={{ width: 0, height: 0 }}
          onEnd={() => setMp3Uri(null)} onError={() => setMp3Uri(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.lg, gap: Spacing.sm },
  back:         { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  camera:       { height: 240, backgroundColor: '#0D1F1E', borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  crossH:       { position: 'absolute', width: 60, height: 2, backgroundColor: '#00BFA5' },
  crossV:       { position: 'absolute', width: 2, height: 60, backgroundColor: '#00BFA5' },
  actionBtn:    { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', ...Shadow.sm },
  safetyCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  emotionChip:  { backgroundColor: Colors.successLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
});