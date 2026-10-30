/**
 * FreshG – Sensor Perangkat Screen (Week 7: Sprint 06 - Accelerometer & Sensor API)
 *
 * Mengimplementasikan:
 * 1. Koneksi hardware Accelerometer real-time (Task 01)
 * 2. Tampilan metrik numerik X, Y, Z dan grafik perubahan nilai (Task 02)
 * 3. Sensor Interaction: Deteksi goyang (Shake Detection) & getaran (Task 03)
 * 4. Fitur Tematik FreshG: "Shake to Surprise Recipe" (Kocok HP untuk rekomendasi resep)
 */
import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMotionSensor } from '@/hooks/use-motion-sensor';
import { useRecipes } from '@/hooks/use-recipes';
import type { Recipe } from '@/types/recipe';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:            '#006c49',
  primaryContainer:   '#10b981',
  onPrimary:          '#ffffff',
  surface:            '#f8f9ff',
  surfaceContainer:   '#e5eeff',
  surfaceContainerLow:'#eff4ff',
  surfaceContainerHigh:'#dce9ff',
  surfaceLowest:      '#ffffff',
  onSurface:          '#0b1c30',
  onSurfaceVariant:   '#3c4a42',
  outline:            '#6c7a71',
  outlineVariant:     '#bbcabf',
  error:              '#ba1a1a',
  errorContainer:     '#ffdad6',
  axisX:              '#dc2626', // Merah untuk Sumbu X
  axisY:              '#16a34a', // Hijau untuk Sumbu Y
  axisZ:              '#2563eb', // Biru untuk Sumbu Z
};

export default function SensorScreen() {
  const router = useRouter();
  const { data: recipes } = useRecipes();
  const [surpriseRecipe, setSurpriseRecipe] = useState<Recipe | null>(null);

  // Fungsi pengacak resep saat goyang terdeteksi (Shake to Surprise Recipe)
  const handleShakeAction = useCallback(() => {
    if (!recipes || recipes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * recipes.length);
    setSurpriseRecipe(recipes[randomIndex]);
  }, [recipes]);

  // Hook sensor akselerometer dengan interval 100ms
  const {
    data,
    history,
    isActive,
    isShaking,
    shakeCount,
    isAvailable,
    setIsActive,
    simulateShake,
    magnitude,
  } = useMotionSensor({
    updateInterval: 100,
    shakeThreshold: 1.45,
    onShake: handleShakeAction,
  });

  // Pilih resep default pertama jika belum ada yang dikocok
  const currentRecipe = useMemo(() => {
    if (surpriseRecipe) return surpriseRecipe;
    return recipes?.[0] ?? null;
  }, [surpriseRecipe, recipes]);

  return (
    <SafeAreaView edges={['top']} style={s.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* ── Top App Bar ── */}
      <View style={s.appBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <View style={s.appBarTitleWrap}>
          <Text style={s.appBarTitle}>Sensor Perangkat</Text>
          <Text style={s.appBarSub}>Week 7 • Accelerometer & Shake API</Text>
        </View>
        <TouchableOpacity
          style={s.cameraShortcut}
          onPress={() => router.push('/scan')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="photo-camera" size={20} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Status Banner (Slide 3 & 6) ── */}
        <View style={s.statusCard}>
          <View style={s.statusHeader}>
            <View style={s.statusLeft}>
              <View style={[s.statusDot, isActive ? s.statusDotActive : s.statusDotInactive]} />
              <Text style={s.statusLabel}>
                {isActive ? 'Sensor Accelerometer Aktif (100ms)' : 'Sensor Dijeda'}
              </Text>
            </View>
            <TouchableOpacity
              style={s.pauseBtn}
              onPress={() => setIsActive(prev => !prev)}
              activeOpacity={0.7}
            >
              <Text style={s.pauseBtnTxt}>{isActive ? 'Jeda' : 'Aktifkan'}</Text>
            </TouchableOpacity>
          </View>
          {!isAvailable && (
            <Text style={s.warningTxt}>
              Catatan: Berjalan di mode Web/Simulator. Gunakan tombol simulasi di bawah untuk menguji pergerakan goyang.
            </Text>
          )}
        </View>

        {/* ── 3 Sumbu Metric Cards (Slide 6, 9, 10, 11) ── */}
        <View style={s.metricsRow}>
          {/* Sumbu X */}
          <View style={[s.metricCard, { borderTopColor: C.axisX }]}>
            <Text style={[s.axisTitle, { color: C.axisX }]}>Sumbu X</Text>
            <Text style={s.axisSub}>Kiri - Kanan</Text>
            <Text style={s.axisVal}>{data.x.toFixed(2)}</Text>
            <Text style={s.axisUnit}>m/s²</Text>
            <View style={s.levelTrack}>
              <View
                style={[
                  s.levelFill,
                  {
                    backgroundColor: C.axisX,
                    width: `${Math.min(Math.abs(data.x) * 50, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Sumbu Y */}
          <View style={[s.metricCard, { borderTopColor: C.axisY }]}>
            <Text style={[s.axisTitle, { color: C.axisY }]}>Sumbu Y</Text>
            <Text style={s.axisSub}>Atas - Bawah</Text>
            <Text style={s.axisVal}>{data.y.toFixed(2)}</Text>
            <Text style={s.axisUnit}>m/s²</Text>
            <View style={s.levelTrack}>
              <View
                style={[
                  s.levelFill,
                  {
                    backgroundColor: C.axisY,
                    width: `${Math.min(Math.abs(data.y) * 50, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Sumbu Z */}
          <View style={[s.metricCard, { borderTopColor: C.axisZ }]}>
            <Text style={[s.axisTitle, { color: C.axisZ }]}>Sumbu Z</Text>
            <Text style={s.axisSub}>Depan - Belakang</Text>
            <Text style={s.axisVal}>{data.z.toFixed(2)}</Text>
            <Text style={s.axisUnit}>m/s²</Text>
            <View style={s.levelTrack}>
              <View
                style={[
                  s.levelFill,
                  {
                    backgroundColor: C.axisZ,
                    width: `${Math.min(Math.abs(data.z) * 50, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* ── Real-time Value Changes Visualizer (Slide 6, 8, 9, 10) ── */}
        <View style={s.chartCard}>
          <View style={s.chartHeader}>
            <Text style={s.chartTitle}>Grafik Perubahan Nilai Real-time</Text>
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: C.axisX }]} />
                <Text style={s.legendTxt}>X</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: C.axisY }]} />
                <Text style={s.legendTxt}>Y</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: C.axisZ }]} />
                <Text style={s.legendTxt}>Z</Text>
              </View>
            </View>
          </View>

          {/* Sumbu visualizer bars */}
          <View style={s.graphBarsWrap}>
            {history.map((pt, index) => (
              <View key={index} style={s.graphColumn}>
                <View
                  style={[
                    s.graphBar,
                    {
                      backgroundColor: C.axisX,
                      height: Math.max(Math.min(Math.abs(pt.x) * 22, 60), 4),
                    },
                  ]}
                />
                <View
                  style={[
                    s.graphBar,
                    {
                      backgroundColor: C.axisY,
                      height: Math.max(Math.min(Math.abs(pt.y) * 22, 60), 4),
                    },
                  ]}
                />
                <View
                  style={[
                    s.graphBar,
                    {
                      backgroundColor: C.axisZ,
                      height: Math.max(Math.min(Math.abs(pt.z) * 22, 60), 4),
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <Text style={s.graphFooterTxt}>Magnitudo Total Akselerasi: {magnitude.toFixed(2)} G</Text>
        </View>

        {/* ── Task 03: Sensor Interaction (Shake Detection & Surprise Recipe) ── */}
        <View style={[s.shakeSection, isShaking && s.shakeSectionActive]}>
          <View style={s.shakeHeader}>
            <View style={s.shakeHeaderLeft}>
              <View style={[s.shakeIconWrap, isShaking && s.shakeIconWrapActive]}>
                <MaterialCommunityIcons
                  name="vibrate"
                  size={24}
                  color={isShaking ? C.onPrimary : C.primary}
                />
              </View>
              <View>
                <Text style={s.shakeTitle}>
                  {isShaking ? 'Goyang Terdeteksi! 📳' : 'Interaksi Goyang (Shake)'}
                </Text>
                <Text style={s.shakeSub}>
                  {isShaking
                    ? 'Getaran aktif • Mengacak resep bahan...'
                    : 'Goyangkan ponsel untuk mengacak ide resep'}
                </Text>
              </View>
            </View>
            <View style={s.shakeCountBadge}>
              <Text style={s.shakeCountTxt}>{shakeCount}x Goyang</Text>
            </View>
          </View>

          {/* Tombol Simulasi Goyang untuk Pengujian/Demo */}
          <TouchableOpacity
            style={s.simulateBtn}
            onPress={simulateShake}
            activeOpacity={0.8}
          >
            <MaterialIcons name="touch-app" size={18} color={C.primary} />
            <Text style={s.simulateBtnTxt}>Simulasikan Goyang Handphone (Test Shake)</Text>
          </TouchableOpacity>

          {/* Hasil Resep Terkocok */}
          {currentRecipe && (
            <View style={s.recipeCard}>
              <Text style={s.recipeBadge}>🎉 Resep Terpilih dari Kocokan Anda</Text>
              <View style={s.recipeRow}>
                <Image source={{ uri: currentRecipe.imageUrl }} style={s.recipeImage} contentFit="cover" />
                <View style={s.recipeDetails}>
                  <Text style={s.recipeName}>{currentRecipe.title}</Text>
                  <Text style={s.recipeDesc} numberOfLines={2}>{currentRecipe.description}</Text>
                  <View style={s.recipeMeta}>
                    <MaterialIcons name="schedule" size={14} color={C.primary} />
                    <Text style={s.recipeMetaTxt}>{currentRecipe.cookTimeMinutes} menit</Text>
                    <Text style={s.recipeMetaTxt}>• Sisa stok cocok</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── Tautan ke Sensor Kamera ── */}
        <TouchableOpacity
          style={s.cameraCardLink}
          onPress={() => router.push('/scan')}
          activeOpacity={0.8}
        >
          <View style={s.cameraCardLeft}>
            <View style={s.cameraIconCircle}>
              <MaterialIcons name="qr-code-scanner" size={24} color={C.primary} />
            </View>
            <View>
              <Text style={s.cameraCardTitle}>Buka Sensor Kamera</Text>
              <Text style={s.cameraCardSub}>Scan barcode kemasan atau foto bahan makanan</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={C.outline} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.surface,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainer,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  appBarTitleWrap: {
    flex: 1,
    marginLeft: 10,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.onSurface,
  },
  appBarSub: {
    fontSize: 11,
    color: C.outline,
    fontWeight: '600',
  },
  cameraShortcut: {
    padding: 8,
    borderRadius: 99,
    backgroundColor: C.surfaceContainer,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.surfaceContainer,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotActive: {
    backgroundColor: '#16a34a',
  },
  statusDotInactive: {
    backgroundColor: C.outline,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurface,
  },
  pauseBtn: {
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pauseBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  warningTxt: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 8,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: C.surfaceLowest,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.surfaceContainer,
    borderTopWidth: 4,
  },
  axisTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  axisSub: {
    fontSize: 9,
    color: C.outline,
    marginBottom: 6,
  },
  axisVal: {
    fontSize: 18,
    fontWeight: '800',
    color: C.onSurface,
  },
  axisUnit: {
    fontSize: 10,
    color: C.outline,
    marginBottom: 8,
  },
  levelTrack: {
    width: '100%',
    height: 4,
    backgroundColor: C.surfaceContainer,
    borderRadius: 99,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 99,
  },
  chartCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.surfaceContainer,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurface,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onSurfaceVariant,
  },
  graphBarsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainer,
  },
  graphColumn: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  graphBar: {
    width: 5,
    borderRadius: 2,
  },
  graphFooterTxt: {
    fontSize: 11,
    color: C.outline,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  shakeSection: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.surfaceContainer,
    gap: 14,
  },
  shakeSectionActive: {
    borderColor: C.primary,
    backgroundColor: '#ecfdf5',
  },
  shakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shakeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  shakeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shakeIconWrapActive: {
    backgroundColor: C.primary,
  },
  shakeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.onSurface,
  },
  shakeSub: {
    fontSize: 12,
    color: C.outline,
    marginTop: 2,
  },
  shakeCountBadge: {
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  shakeCountTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.primary + '4D',
    paddingVertical: 10,
    borderRadius: 12,
  },
  simulateBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  recipeCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.primary + '33',
    gap: 10,
  },
  recipeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: C.primary,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recipeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  recipeDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.onSurface,
  },
  recipeDesc: {
    fontSize: 11,
    color: C.outline,
    lineHeight: 15,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  recipeMetaTxt: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '600',
  },
  cameraCardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.surfaceContainer,
  },
  cameraCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cameraIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.onSurface,
  },
  cameraCardSub: {
    fontSize: 12,
    color: C.outline,
    marginTop: 2,
  },
});

