import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { useLocationService } from '@/hooks/use-location-service';
import LocationMap from '@/components/location-map';
import { BottomTabInset } from '@/constants/theme';

const C = {
  primary:            '#006c49',
  primaryContainer:   '#10b981',
  onPrimary:          '#ffffff',
  secondary:          '#0284c7',
  secondaryContainer: '#e0f2fe',
  surface:            '#f8f9ff',
  surfaceContainer:   '#e5eeff',
  surfaceContainerLow:'#eff4ff',
  surfaceLowest:      '#ffffff',
  onSurface:          '#0b1c30',
  onSurfaceVariant:   '#3c4a42',
  outline:            '#6c7a71',
  outlineVariant:     '#bbcabf',
  error:              '#ba1a1a',
  errorContainer:     '#ffdad6',
  warning:            '#d97706',
  warningContainer:   '#fef3c7',
  purple:             '#6366f1',
  purpleContainer:    '#e0e7ff',
};

export default function LokasiScreen() {
  const router = useRouter();

  const {
    permissionStatus,
    location,
    isLoadingLocation,
    errorMsg,
    address,
    isLoadingAddress,
    activeGeofence,
    distanceToCenter,
    isInsideGeofence,
    geofenceBannerMessage,
    isContinuousTracking,
    accuracyLevel,
    timeInterval,
    distanceInterval,
    isSimulated,

    requestLocationPermission,
    fetchCurrentLocation,
    doReverseGeocode,
    startContinuousTracking,
    stopContinuousTracking,
    simulateLocationMove,
    setAccuracyLevel,
    setTimeInterval,
    setDistanceInterval,
    dismissBanner,
  } = useLocationService();

  const [batteryExplained, setBatteryExplained] = useState(false);

  const demoChecklist = useMemo(() => {
    const hasGps = permissionStatus === Location.PermissionStatus.GRANTED;
    const hasCoords = location !== null;
    const hasMap = true;
    const hasMarker = location !== null;
    const hasReverseGeocode = address !== null && !isLoadingAddress;
    const hasTestedGeofence = isSimulated || isInsideGeofence || distanceToCenter !== null;
    const hasBatteryOpt = isContinuousTracking || batteryExplained;

    return [
      { id: 1, title: 'Mengakses GPS & Permission', checked: hasGps },
      { id: 2, title: 'Membaca Koordinat (Lat, Lng, Accuracy)', checked: hasCoords },
      { id: 3, title: 'Menampilkan Peta Interaktif', checked: hasMap },
      { id: 4, title: 'Menampilkan Marker & Posisi User', checked: hasMarker },
      { id: 5, title: 'Melakukan Reverse Geocoding (Alamat)', checked: hasReverseGeocode },
      { id: 6, title: 'Menguji Geofencing (Masuk/Keluar Area)', checked: hasTestedGeofence },
      { id: 7, title: 'Menjelaskan Optimasi Baterai', checked: hasBatteryOpt },
    ];
  }, [
    permissionStatus,
    location,
    address,
    isLoadingAddress,
    isSimulated,
    isInsideGeofence,
    distanceToCenter,
    isContinuousTracking,
    batteryExplained,
  ]);

  const completedCount = demoChecklist.filter((c) => c.checked).length;

  return (
    <SafeAreaView edges={['top']} style={s.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <View style={s.appBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <View style={s.appBarTitleWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.appBarTitle}>Location-Based Services</Text>
            <View style={s.sprintBadge}>
              <Text style={s.sprintBadgeTxt}>Sprint 08</Text>
            </View>
          </View>
          <Text style={s.appBarSub}>Week 10 • PresidentKu / FreshG LBS</Text>
        </View>
        <View style={s.gpsStatusPill}>
          <MaterialIcons
            name={location ? 'gps-fixed' : 'gps-not-fixed'}
            size={18}
            color={location ? C.primary : C.outline}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {geofenceBannerMessage && (
          <View
            style={[
              s.geofenceBanner,
              isInsideGeofence ? s.geofenceBannerInside : s.geofenceBannerOutside,
            ]}
          >
            <View style={s.bannerIconCol}>
              <MaterialIcons
                name={isInsideGeofence ? 'verified' : 'info'}
                size={22}
                color={isInsideGeofence ? '#15803d' : '#b45309'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  s.bannerTitle,
                  { color: isInsideGeofence ? '#15803d' : '#b45309' },
                ]}
              >
                {isInsideGeofence ? 'Area Kampus UMM Terdeteksi' : 'Pemberitahuan Area'}
              </Text>
              <Text style={s.bannerText}>{geofenceBannerMessage}</Text>
            </View>
            <TouchableOpacity onPress={dismissBanner} style={s.bannerCloseBtn}>
              <MaterialIcons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        {errorMsg && (
          <View style={s.errorBanner}>
            <MaterialIcons name="error-outline" size={20} color={C.error} />
            <Text style={s.errorText}>{errorMsg}</Text>
          </View>
        )}

        {isSimulated && (
          <View style={s.simulatedBanner}>
            <MaterialIcons name="science" size={18} color="#7c3aed" />
            <Text style={s.simulatedText}>
              Mode Simulasi Aktif untuk Pengujian Geofencing & Demo.
            </Text>
            <TouchableOpacity
              onPress={fetchCurrentLocation}
              style={s.simulatedResetBtn}
              activeOpacity={0.8}
            >
              <Text style={s.simulatedResetTxt}>Gunakan GPS Asli</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.taskCard}>
          <View style={s.taskHeaderRow}>
            <View style={s.taskBadge}>
              <Text style={s.taskBadgeTxt}>TASK 01</Text>
            </View>
            <Text style={s.taskTitle}>Implement GPS Location</Text>
          </View>
          <Text style={s.taskDesc}>
            Mengakses hardware GPS menggunakan modul `expo-location`, meminta perizinan lokasi, dan membaca metrik koordinat numerik.
          </Text>

          <View style={s.permissionBox}>
            <View style={s.permLeft}>
              <MaterialIcons
                name={
                  permissionStatus === Location.PermissionStatus.GRANTED
                    ? 'security'
                    : 'lock'
                }
                size={20}
                color={
                  permissionStatus === Location.PermissionStatus.GRANTED
                    ? C.primary
                    : C.warning
                }
              />
              <View>
                <Text style={s.permTitle}>Status Perizinan Lokasi</Text>
                <Text style={s.permSub}>
                  {permissionStatus === Location.PermissionStatus.GRANTED
                    ? 'Izin Foreground Diberikan (Granted)'
                    : permissionStatus === Location.PermissionStatus.DENIED
                    ? 'Izin Ditolak oleh Pengguna'
                    : 'Belum Meminta Izin'}
                </Text>
              </View>
            </View>
            {permissionStatus !== Location.PermissionStatus.GRANTED && (
              <TouchableOpacity
                style={s.permReqBtn}
                onPress={requestLocationPermission}
                activeOpacity={0.8}
              >
                <Text style={s.permReqBtnTxt}>Minta Izin</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.coordsDisplayCard}>
            <View style={s.coordsHeaderRow}>
              <View style={s.coordsIconWrap}>
                <MaterialIcons name="my-location" size={20} color={C.primary} />
              </View>
              <Text style={s.coordsTitle}>Lokasi Saat Ini</Text>
            </View>

            <View style={s.coordRow}>
              <View style={s.coordField}>
                <MaterialIcons name="explore" size={16} color={C.secondary} />
                <Text style={s.coordLabel}>Latitude</Text>
              </View>
              <Text style={s.coordValue}>
                {location ? location.latitude.toFixed(6) : '—'}
              </Text>
            </View>

            <View style={s.coordRow}>
              <View style={s.coordField}>
                <MaterialIcons name="explore" size={16} color={C.secondary} />
                <Text style={s.coordLabel}>Longitude</Text>
              </View>
              <Text style={s.coordValue}>
                {location ? location.longitude.toFixed(6) : '—'}
              </Text>
            </View>

            <View style={[s.coordRow, { borderBottomWidth: 0 }]}>
              <View style={s.coordField}>
                <MaterialIcons name="network-check" size={16} color={C.secondary} />
                <Text style={s.coordLabel}>Accuracy</Text>
              </View>
              <View style={s.accuracyBadge}>
                <Text style={s.accuracyValue}>
                  {location?.accuracy != null ? `±${location.accuracy} m` : '—'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={s.btnPrimary}
            onPress={fetchCurrentLocation}
            disabled={isLoadingLocation}
            activeOpacity={0.85}
          >
            {isLoadingLocation ? (
              <ActivityIndicator color={C.onPrimary} size="small" />
            ) : (
              <>
                <MaterialIcons name="gps-fixed" size={20} color={C.onPrimary} />
                <Text style={s.btnPrimaryTxt}>Ambil Lokasi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.taskCard}>
          <View style={s.taskHeaderRow}>
            <View style={s.taskBadge}>
              <Text style={s.taskBadgeTxt}>TASK 02</Text>
            </View>
            <Text style={s.taskTitle}>Display Location on Map</Text>
          </View>
          <Text style={s.taskDesc}>
            Menampilkan wadah peta interaktif (Maps SDK), memusatkan kamera pada posisi GPS, dan menampilkan marker posisi terkini.
          </Text>

          <LocationMap
            userLocation={location}
            geofence={activeGeofence}
            isInsideGeofence={isInsideGeofence}
            height={290}
          />

          <View style={s.mapLegendRow}>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#0284c7' }]} />
              <Text style={s.legendTxt}>Lokasi Pengguna</Text>
            </View>
            <View style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: '#dc2626' }]} />
              <Text style={s.legendTxt}>Kampus UMM</Text>
            </View>
            <View style={s.legendItem}>
              <View
                style={[
                  s.legendCircle,
                  { borderColor: isInsideGeofence ? '#10b981' : '#6366f1' },
                ]}
              />
              <Text style={s.legendTxt}>Radius 500m</Text>
            </View>
          </View>
        </View>

        <View style={s.taskCard}>
          <View style={s.taskHeaderRow}>
            <View style={s.taskBadge}>
              <Text style={s.taskBadgeTxt}>TASK 03</Text>
            </View>
            <Text style={s.taskTitle}>Location Intelligence</Text>
          </View>
          <Text style={s.taskDesc}>
            A. Reverse Geocoding (mengubah koordinat GPS menjadi alamat terbaca) dan B. Geofencing (batas virtual deteksi masuk/keluar area).
          </Text>

          <View style={s.intelligenceSubcard}>
            <View style={s.subcardHeader}>
              <View style={s.subcardIconWrap}>
                <MaterialIcons name="pin-drop" size={18} color="#7c3aed" />
              </View>
              <Text style={s.subcardTitle}>A. Reverse Geocoding</Text>
            </View>
            <Text style={s.subcardDesc}>
              Konversi koordinat numerik menjadi alamat jalan, kecamatan, dan kota.
            </Text>

            <View style={s.addressBox}>
              <MaterialIcons name="place" size={20} color={C.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.addressLabel}>Alamat Saat Ini</Text>
                {isLoadingAddress ? (
                  <ActivityIndicator size="small" color={C.primary} style={{ marginVertical: 6 }} />
                ) : (
                  <Text style={s.addressText}>
                    {address?.formattedAddress ||
                      'Tekan "Ambil Lokasi" untuk mendeteksi alamat jalan.'}
                  </Text>
                )}
              </View>
            </View>

            {location && (
              <TouchableOpacity
                style={s.btnOutlineSmall}
                onPress={() => doReverseGeocode(location.latitude, location.longitude)}
                disabled={isLoadingAddress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="refresh" size={16} color={C.primary} />
                <Text style={s.btnOutlineSmallTxt}>Perbarui Alamat</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.intelligenceSubcard}>
            <View style={s.subcardHeader}>
              <View style={[s.subcardIconWrap, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={18} color="#d97706" />
              </View>
              <Text style={s.subcardTitle}>B. Geofencing Area</Text>
            </View>
            <Text style={s.subcardDesc}>
              Membuat batas virtual radius 500 meter di sekitar target dan mendeteksi transisi posisi pengguna.
            </Text>

            <View
              style={[
                s.geofenceStatusBox,
                isInsideGeofence ? s.geofenceBoxInside : s.geofenceBoxOutside,
              ]}
            >
              <View style={s.geofenceStatusTop}>
                <MaterialIcons
                  name="school"
                  size={22}
                  color={isInsideGeofence ? '#15803d' : '#4338ca'}
                />
                <Text style={s.geofenceTargetName}>{activeGeofence.name}</Text>
                <View
                  style={[
                    s.statusTag,
                    isInsideGeofence ? s.statusTagInside : s.statusTagOutside,
                  ]}
                >
                  <Text
                    style={[
                      s.statusTagTxt,
                      isInsideGeofence ? s.statusTagTxtInside : s.statusTagTxtOutside,
                    ]}
                  >
                    {isInsideGeofence ? '✓ Dalam Area' : '✕ Di Luar Area'}
                  </Text>
                </View>
              </View>

              <View style={s.geofenceMetricsRow}>
                <View style={s.metricItem}>
                  <Text style={s.metricLbl}>Radius Virtual</Text>
                  <Text style={s.metricVal}>{activeGeofence.radius} meter</Text>
                </View>
                <View style={s.metricDivider} />
                <View style={s.metricItem}>
                  <Text style={s.metricLbl}>Jarak dari Pusat</Text>
                  <Text style={s.metricVal}>
                    {distanceToCenter !== null ? `${distanceToCenter} m` : '—'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={s.simulationSection}>
              <Text style={s.simTitle}>Uji Skenario Geofence (Demo Event):</Text>
              <View style={s.simButtonsRow}>
                <TouchableOpacity
                  style={[s.simBtn, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}
                  onPress={() => simulateLocationMove('inside')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="login" size={16} color="#15803d" />
                  <Text style={[s.simBtnTxt, { color: '#15803d' }]}>Masuk Kampus</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.simBtn, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
                  onPress={() => simulateLocationMove('outside')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="logout" size={16} color="#b91c1c" />
                  <Text style={[s.simBtnTxt, { color: '#b91c1c' }]}>Keluar Kampus</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.simBtn, { backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' }]}
                  onPress={() => simulateLocationMove('center')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="gps-fixed" size={16} color="#0369a1" />
                  <Text style={[s.simBtnTxt, { color: '#0369a1' }]}>Tepat di Pusat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={s.taskCard}>
          <View style={s.taskHeaderRow}>
            <View style={[s.taskBadge, { backgroundColor: '#fef08a' }]}>
              <Text style={[s.taskBadgeTxt, { color: '#854d0e' }]}>OPTIMASI</Text>
            </View>
            <Text style={s.taskTitle}>Battery Optimization</Text>
          </View>
          <Text style={s.taskDesc}>
            Menyeimbangkan antara akurasi, kebutuhan fitur aplikasi, dan konsumsi baterai dengan memfilter frekuensi update dan membersihkan subscription.
          </Text>

          <View style={s.trackingToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.trackingToggleTitle}>Pelacakan Berkelanjutan (Watch)</Text>
              <Text style={s.trackingToggleSub}>
                {isContinuousTracking
                  ? 'Aktif: Lokasi diperbarui berkala sesuai interval'
                  : 'Hemat Daya: Listener dimatikan ketika tidak dipakai'}
              </Text>
            </View>
            <Switch
              value={isContinuousTracking}
              onValueChange={(val) => {
                if (val) startContinuousTracking();
                else stopContinuousTracking();
              }}
              trackColor={{ false: C.outlineVariant, true: C.primaryContainer }}
              thumbColor={C.surfaceLowest}
            />
          </View>

          <View style={s.optConfigSection}>
            <Text style={s.optConfigLabel}>1. Accuracy Configuration</Text>
            <View style={s.optPillsRow}>
              {[
                { label: 'Low (Hemat)', val: Location.Accuracy.Low },
                { label: 'Balanced (Rekomendasi)', val: Location.Accuracy.Balanced },
                { label: 'High (Presisi)', val: Location.Accuracy.High },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    s.optPill,
                    accuracyLevel === item.val && s.optPillActive,
                  ]}
                  onPress={() => setAccuracyLevel(item.val)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      s.optPillTxt,
                      accuracyLevel === item.val && s.optPillTxtActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.optConfigSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.optConfigLabel}>2. Update Interval & Distance Filter</Text>
              <Text style={{ fontSize: 10, color: C.secondary, fontWeight: '700' }}>
                {timeInterval / 1000}s / {distanceInterval}m
              </Text>
            </View>
            <View style={s.optPillsRow}>
              {[
                { label: '5 detik / 10 m', time: 5000, dist: 10 },
                { label: '10 detik / 25 m', time: 10000, dist: 25 },
                { label: '30 detik / 50 m', time: 30000, dist: 50 },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    s.optPill,
                    timeInterval === item.time && s.optPillActive,
                  ]}
                  onPress={() => {
                    setTimeInterval(item.time);
                    setDistanceInterval(item.dist);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      s.optPillTxt,
                      timeInterval === item.time && s.optPillTxtActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.comparisonCard}>
            <Text style={s.compCardTitle}>Perbandingan Efisiensi Daya</Text>
            <View style={s.compRow}>
              <View style={[s.compBox, s.compBoxBad]}>
                <View style={s.compBoxHeader}>
                  <MaterialIcons name="cancel" size={16} color="#dc2626" />
                  <Text style={s.compBadTitle}>Tidak Efisien</Text>
                </View>
                <Text style={s.compItem}>• GPS terus aktif 100%</Text>
                <Text style={s.compItem}>• Update terlalu sering</Text>
                <Text style={s.compItem}>• Akurasi selalu maksimum</Text>
                <Text style={s.compItem}>• Subscription tidak dihapus</Text>
              </View>

              <View style={[s.compBox, s.compBoxGood]}>
                <View style={s.compBoxHeader}>
                  <MaterialIcons name="check-circle" size={16} color="#16a34a" />
                  <Text style={s.compGoodTitle}>Lebih Efisien</Text>
                </View>
                <Text style={s.compItem}>• GPS sesuai kebutuhan</Text>
                <Text style={s.compItem}>• Interval terkontrol</Text>
                <Text style={s.compItem}>• Akurasi seimbang</Text>
                <Text style={s.compItem}>• Subscription dibersihkan</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.taskCard}>
          <View style={s.taskHeaderRow}>
            <View style={[s.taskBadge, { backgroundColor: '#bbf7d0' }]}>
              <Text style={[s.taskBadgeTxt, { color: '#166534' }]}>CHECKLIST DEMO</Text>
            </View>
            <Text style={s.taskTitle}>Sprint 08 Completion</Text>
          </View>
          <Text style={s.taskDesc}>
            Mahasiswa mendemonstrasikan hasil implementasi fitur berbasis lokasi pada aplikasi:
          </Text>

          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Kemajuan Sprint:</Text>
            <Text style={s.progressCount}>
              {completedCount} dari {demoChecklist.length} Selesai
            </Text>
          </View>

          <View style={s.checklistContainer}>
            {demoChecklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.checklistItem}
                onPress={() => {
                  if (item.id === 7) setBatteryExplained(!batteryExplained);
                }}
                activeOpacity={item.id === 7 ? 0.7 : 1}
              >
                <View
                  style={[
                    s.checkCircle,
                    item.checked && s.checkCircleChecked,
                  ]}
                >
                  {item.checked ? (
                    <MaterialIcons name="check" size={16} color="#ffffff" />
                  ) : (
                    <Text style={s.checkNumber}>{item.id}</Text>
                  )}
                </View>
                <Text
                  style={[
                    s.checkText,
                    item.checked && s.checkTextChecked,
                  ]}
                >
                  {item.title}
                </Text>
                {item.id === 7 && !batteryExplained && (
                  <Text style={s.tapToMark}>(Tekan untuk tanda)</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.surface,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainer,
  },
  backBtn: {
    padding: 8,
    borderRadius: 99,
    marginRight: 6,
  },
  appBarTitleWrap: {
    flex: 1,
  },
  appBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.onSurface,
  },
  sprintBadge: {
    backgroundColor: C.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sprintBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: C.secondary,
  },
  appBarSub: {
    fontSize: 11,
    color: C.outline,
    marginTop: 1,
  },
  gpsStatusPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  geofenceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  geofenceBannerInside: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  geofenceBannerOutside: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  bannerIconCol: {
    paddingTop: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  bannerCloseBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.errorContainer,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 12,
    color: C.error,
    flex: 1,
    fontWeight: '600',
  },
  simulatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f3ff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  simulatedText: {
    fontSize: 11,
    color: '#6d28d9',
    flex: 1,
    fontWeight: '600',
  },
  simulatedResetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
  },
  simulatedResetTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  taskCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.outlineVariant + '99',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskBadge: {
    backgroundColor: C.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskBadgeTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: C.secondary,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.onSurface,
  },
  taskDesc: {
    fontSize: 12,
    color: C.outline,
    lineHeight: 18,
  },
  permissionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
  },
  permLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  permTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurface,
  },
  permSub: {
    fontSize: 11,
    color: C.outline,
  },
  permReqBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.primary,
    borderRadius: 8,
  },
  permReqBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onPrimary,
  },
  coordsDisplayCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.surfaceContainer,
  },
  coordsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  coordsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.onSurface,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainer,
  },
  coordField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.outline,
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  accuracyBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accuracyValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPrimaryTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: C.onPrimary,
  },
  mapLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  legendTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: C.outline,
  },
  intelligenceSubcard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.surfaceContainer,
    gap: 8,
  },
  subcardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subcardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subcardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.onSurface,
  },
  subcardDesc: {
    fontSize: 11,
    color: C.outline,
    lineHeight: 16,
  },
  addressBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: C.surfaceLowest,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.outline,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurface,
    marginTop: 2,
    lineHeight: 18,
  },
  btnOutlineSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.primary,
  },
  btnOutlineSmallTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  geofenceStatusBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  geofenceBoxInside: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  geofenceBoxOutside: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  geofenceStatusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  geofenceTargetName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: C.onSurface,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagInside: {
    backgroundColor: '#bbf7d0',
  },
  statusTagOutside: {
    backgroundColor: '#e2e8f0',
  },
  statusTagTxt: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTagTxtInside: {
    color: '#15803d',
  },
  statusTagTxtOutside: {
    color: '#475569',
  },
  geofenceMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    paddingVertical: 8,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLbl: {
    fontSize: 10,
    color: C.outline,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: C.onSurface,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
  },
  simulationSection: {
    marginTop: 6,
    gap: 6,
  },
  simTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onSurface,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  simBtnTxt: {
    fontSize: 10,
    fontWeight: '800',
  },
  trackingToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
  },
  trackingToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurface,
  },
  trackingToggleSub: {
    fontSize: 11,
    color: C.outline,
    marginTop: 2,
  },
  optConfigSection: {
    gap: 6,
  },
  optConfigLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onSurface,
  },
  optPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  optPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  optPillActive: {
    backgroundColor: C.secondaryContainer,
    borderColor: C.secondary,
  },
  optPillTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: C.outline,
    textAlign: 'center',
  },
  optPillTxtActive: {
    color: C.secondary,
    fontWeight: '800',
  },
  comparisonCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  compCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C.onSurface,
  },
  compRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compBox: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  compBoxBad: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  compBoxGood: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  compBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  compBadTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  compGoodTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },
  compItem: {
    fontSize: 9.5,
    color: '#334155',
    lineHeight: 14,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurface,
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '800',
    color: C.primary,
  },
  checklistContainer: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surfaceContainerLow,
    padding: 10,
    borderRadius: 10,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.surfaceLowest,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: C.outline,
  },
  checkText: {
    fontSize: 12,
    color: C.onSurface,
    fontWeight: '600',
    flex: 1,
  },
  checkTextChecked: {
    fontWeight: '700',
    color: '#166534',
  },
  tapToMark: {
    fontSize: 10,
    color: C.outline,
    fontStyle: 'italic',
  },
});

