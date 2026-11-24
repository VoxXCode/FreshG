/**
 * FreshG – Push Notification Integration Screen
 * Mengimplementasikan Task 01, Task 02, dan Task 03 (Week 11: Sprint 09)
 *
 * Sesuai Slide 15: DEMO — SHOW YOUR PUSH NOTIFICATION INTEGRATION
 * 1. Jalankan Aplikasi
 * 2. Minta Permission
 * 3. Registrasi Perangkat
 * 4. Dapatkan Push Token
 * 5. Kirim Notifikasi (Expo Push API / Local Schedule)
 * 6. Terima Notifikasi (Foreground & Background Handling)
 * 7. Tekan & Buka Halaman (Deep Linking)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BottomTabInset } from '@/constants/theme';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const C = {
  primary:            '#006c49',
  primaryContainer:   '#10b981',
  onPrimary:          '#ffffff',
  surface:            '#f8f9ff',
  surfaceCard:        '#ffffff',
  surfaceContainer:   '#e5eeff',
  surfaceContainerLow:'#eff4ff',
  onSurface:          '#0b1c30',
  onSurfaceVariant:   '#3c4a42',
  outline:            '#6c7a71',
  outlineVariant:     '#bbcabf',
  error:              '#ba1a1a',
  errorContainer:     '#ffdad6',
  success:            '#16a34a',
  successContainer:   '#dcfce7',
  warning:            '#d97706',
  warningContainer:   '#fef3c7',
  blue:               '#2563eb',
  blueContainer:      '#dbeafe',
};

export default function NotificationScreen() {
  const router = useRouter();
  const {
    expoPushToken,
    permissionStatus,
    isDevice,
    isLoading,
    logs,
    registerDevice,
    requestPermissions,
    sendTestNotification,
    clearLogs,
  } = usePushNotifications();

  const [copied, setCopied] = useState<boolean>(false);
  const [sendingType, setSendingType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCopyToken = () => {
    if (!expoPushToken) {
      Alert.alert('Perhatian', 'Push token belum tersedia.');
      return;
    }
    Clipboard.setString(expoPushToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerTest = async (preset: 'expiry' | 'recipe' | 'todo', delaySec = 1) => {
    setSendingType(`${preset}_${delaySec}`);
    try {
      await sendTestNotification(preset, undefined, delaySec);
      setToastMessage(
        delaySec > 1
          ? `Notifikasi dijadwalkan dalam ${delaySec} detik! Silakan tekan tombol HOME HP Anda sekarang untuk melihat notifikasi muncul di bilah status / layar kunci HP.`
          : 'Notifikasi dikirim langsung ke sistem HP! Tarik bar notifikasi dari atas layar HP Anda.'
      );
      setTimeout(() => setToastMessage(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim notifikasi';
      Alert.alert('Info', msg);
    } finally {
      setSendingType(null);
    }
  };

  const handleOpenDeviceSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      Alert.alert('Info', 'Buka Pengaturan HP > Aplikasi > FreshG > Notifikasi.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={C.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Push Notification</Text>
          <Text style={styles.headerSubtitle}>Week 11 • Sprint 09: Connected App</Text>
        </View>
        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={() => void registerDevice()}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <MaterialIcons name="refresh" size={22} color={C.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Info Dukungan Expo Go Android */}
        {Platform.OS === 'android' && (
          <View style={styles.expoGoBanner}>
            <MaterialIcons name="notifications-active" size={18} color="#0284c7" />
            <Text style={styles.expoGoBannerTxt}>
              Mode Expo Go: Notifikasi lokal & Deep Linking aktif sepenuhnya. Tekan tombol uji di bawah untuk memunculkan notifikasi langsung di baki status bar HP Anda.
            </Text>
          </View>
        )}

        {/* ── Slide 15: 7 Alur Pengerjaan Sprint 09 ──────────────────────────── */}
        <View style={styles.flowCard}>
          <View style={styles.flowHeader}>
            <MaterialIcons name="alt-route" size={16} color={C.blue} />
            <Text style={styles.flowTitle}>Alur Integrasi Push Notification (Slide 15):</Text>
          </View>
          <View style={styles.flowStepsGrid}>
            <View style={[styles.stepPill, styles.stepPillDone]}>
              <Text style={styles.stepPillTxtDone}>1. Jalankan</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={12} color="#94a3b8" />
            <View style={[styles.stepPill, permissionStatus === 'granted' ? styles.stepPillDone : styles.stepPillActive]}>
              <Text style={styles.stepPillTxtDone}>2. Izin</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={12} color="#94a3b8" />
            <View style={[styles.stepPill, expoPushToken ? styles.stepPillDone : styles.stepPillPending]}>
              <Text style={styles.stepPillTxtDone}>3. Device</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={12} color="#94a3b8" />
            <View style={[styles.stepPill, expoPushToken ? styles.stepPillDone : styles.stepPillPending]}>
              <Text style={styles.stepPillTxtDone}>4. Token</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={12} color="#94a3b8" />
            <View style={[styles.stepPill, styles.stepPillDone]}>
              <Text style={styles.stepPillTxtDone}>5. Kirim</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={12} color="#94a3b8" />
            <View style={[styles.stepPill, styles.stepPillDone]}>
              <Text style={styles.stepPillTxtDone}>6. Terima</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={12} color="#94a3b8" />
            <View style={[styles.stepPill, styles.stepPillDone]}>
              <Text style={styles.stepPillTxtDone}>7. Deep Link</Text>
            </View>
          </View>
        </View>

        {/* ── TASK 01: Status Izin & Push Token Perangkat ──────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.badgeIcon, { backgroundColor: C.blueContainer }]}>
              <MaterialCommunityIcons name="cellphone-key" size={20} color={C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Task 01: Device & Push Token</Text>
              <Text style={styles.cardSubtitle}>Registrasi perangkat dan identitas push token</Text>
            </View>
          </View>

          {/* Device & Permission Status Row */}
          <View style={styles.statusGrid}>
            <View style={styles.statusBox}>
              <Text style={styles.statusBoxLabel}>Tipe Perangkat</Text>
              <View style={styles.statusBoxValueRow}>
                <MaterialIcons
                  name={isDevice ? 'phone-android' : 'laptop'}
                  size={14}
                  color={isDevice ? C.success : C.warning}
                />
                <Text style={[styles.statusBoxValue, { color: isDevice ? C.success : C.warning }]}>
                  {isDevice ? 'Perangkat Fisik' : 'Simulator / Web'}
                </Text>
              </View>
            </View>

            <View style={styles.statusBox}>
              <Text style={styles.statusBoxLabel}>Status Izin</Text>
              <View style={styles.statusBoxValueRow}>
                <MaterialIcons
                  name={permissionStatus === 'granted' ? 'check-circle' : 'warning'}
                  size={14}
                  color={permissionStatus === 'granted' ? C.success : C.error}
                />
                <Text
                  style={[
                    styles.statusBoxValue,
                    { color: permissionStatus === 'granted' ? C.success : C.error },
                  ]}
                >
                  {permissionStatus === 'granted' ? 'Diizinkan (Granted)' : 'Ditolak / Belum'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tombol Kontrol Izin Sistem Perangkat */}
          <View style={styles.permBtnGroup}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => void requestPermissions()}
              activeOpacity={0.8}
            >
              <MaterialIcons name="security" size={16} color="#ffffff" />
              <Text style={styles.primaryActionBtnTxt}>Minta Izin Notifikasi Sistem HP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={handleOpenDeviceSettings}
              activeOpacity={0.7}
            >
              <MaterialIcons name="settings" size={16} color={C.outline} />
              <Text style={styles.secondaryActionBtnTxt}>Buka Pengaturan HP (Device Settings)</Text>
            </TouchableOpacity>
          </View>

          {/* Token Box */}
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>Expo Push Token (Slide 6 & 11):</Text>
            <Text style={styles.tokenValue} numberOfLines={2} selectable>
              {expoPushToken || 'Sedang mengambil token...'}
            </Text>
            <View style={styles.tokenActionRow}>
              <TouchableOpacity
                style={[styles.copyBtn, copied && { backgroundColor: C.successContainer }]}
                onPress={handleCopyToken}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={copied ? 'check' : 'content-copy'}
                  size={15}
                  color={copied ? C.success : C.primary}
                />
                <Text style={[styles.copyBtnText, copied && { color: C.success }]}>
                  {copied ? 'Tersalin' : 'Salin Token'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reRegBtn}
                onPress={() => void registerDevice()}
                activeOpacity={0.7}
              >
                <MaterialIcons name="refresh" size={15} color={C.outline} />
                <Text style={styles.reRegBtnText}>Refresh Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Toast Notifikasi Terkirim (Non-Intrusive) ───────────────────── */}
        {toastMessage && (
          <View style={styles.toastCard}>
            <MaterialCommunityIcons name="bell-ring" size={20} color="#006c49" />
            <Text style={styles.toastCardTxt}>{toastMessage}</Text>
          </View>
        )}

        {/* ── TASK 02: Pengiriman Notifikasi & Test Presets ───────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.badgeIcon, { backgroundColor: C.successContainer }]}>
              <MaterialCommunityIcons name="send-check" size={20} color={C.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Task 02: Send Push Notification</Text>
              <Text style={styles.cardSubtitle}>Muncul di bar notifikasi HP (Layar Atas / Status Bar)</Text>
            </View>
          </View>

          {/* Test Preset 1: Expiry Alert */}
          <View style={styles.testItemCard}>
            <View style={[styles.presetIconWrap, { backgroundColor: '#fee2e2' }]}>
              <MaterialIcons name="warning" size={20} color="#dc2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.presetTitle}>1. Peringatan Kedaluwarsa Bahan</Text>
              <Text style={styles.presetDesc}>
                Notifikasi bahan kulkas tersisa 1 hari ➔ Mengarah ke halaman{' '}
                <Text style={{ fontWeight: '700', color: C.onSurface }}>/stok</Text>
              </Text>
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={styles.triggerInstantBtn}
                  onPress={() => handleTriggerTest('expiry', 1)}
                  disabled={sendingType !== null}
                >
                  {sendingType === 'expiry_1' ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.triggerBtnTxt}>Kirim Sekarang (1 dtk)</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.triggerDelayBtn}
                  onPress={() => handleTriggerTest('expiry', 5)}
                  disabled={sendingType !== null}
                >
                  {sendingType === 'expiry_5' ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Text style={styles.triggerDelayTxt}>Jeda 5 dtk (Tekan Home HP)</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Test Preset 2: Recipe Recommendation */}
          <View style={styles.testItemCard}>
            <View style={[styles.presetIconWrap, { backgroundColor: '#fef3c7' }]}>
              <MaterialCommunityIcons name="chef-hat" size={20} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.presetTitle}>2. Rekomendasi Menu Resep</Text>
              <Text style={styles.presetDesc}>
                Inspirasi memasak dari TheMealDB ➔ Mengarah ke halaman{' '}
                <Text style={{ fontWeight: '700', color: C.onSurface }}>/tips</Text>
              </Text>
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={styles.triggerInstantBtn}
                  onPress={() => handleTriggerTest('recipe', 1)}
                  disabled={sendingType !== null}
                >
                  {sendingType === 'recipe_1' ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.triggerBtnTxt}>Kirim Sekarang (1 dtk)</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.triggerDelayBtn}
                  onPress={() => handleTriggerTest('recipe', 5)}
                  disabled={sendingType !== null}
                >
                  {sendingType === 'recipe_5' ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Text style={styles.triggerDelayTxt}>Jeda 5 dtk (Tekan Home HP)</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Test Preset 3: Todo Shopping Reminder */}
          <View style={styles.testItemCard}>
            <View style={[styles.presetIconWrap, { backgroundColor: '#e0f2fe' }]}>
              <MaterialCommunityIcons name="cart-outline" size={20} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.presetTitle}>3. Pengingat Daftar Belanja</Text>
              <Text style={styles.presetDesc}>
                Pengingat daftar belanjaan mingguan ➔ Mengarah ke halaman{' '}
                <Text style={{ fontWeight: '700', color: C.onSurface }}>/todo</Text>
              </Text>
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={styles.triggerInstantBtn}
                  onPress={() => handleTriggerTest('todo', 1)}
                  disabled={sendingType !== null}
                >
                  {sendingType === 'todo_1' ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.triggerBtnTxt}>Kirim Sekarang (1 dtk)</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.triggerDelayBtn}
                  onPress={() => handleTriggerTest('todo', 5)}
                  disabled={sendingType !== null}
                >
                  {sendingType === 'todo_5' ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Text style={styles.triggerDelayTxt}>Jeda 5 dtk (Tekan Home HP)</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ── TASK 03: Event Logs & Deep Linking Monitor ──────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.badgeIcon, { backgroundColor: '#f3e8ff' }]}>
              <MaterialCommunityIcons name="history" size={20} color="#9333ea" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Task 03: Notification Response & Logs</Text>
              <Text style={styles.cardSubtitle}>Deteksi aksi tap pengguna & payload data</Text>
            </View>
            {logs.length > 0 && (
              <TouchableOpacity onPress={clearLogs} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Bersihkan</Text>
              </TouchableOpacity>
            )}
          </View>

          {logs.length === 0 ? (
            <View style={styles.emptyLog}>
              <MaterialCommunityIcons name="bell-sleep-outline" size={36} color={C.outlineVariant} />
              <Text style={styles.emptyLogTxt}>Belum ada event notifikasi.</Text>
              <Text style={styles.emptyLogSub}>
                Tekan tombol kirim di atas untuk memunculkan notifikasi dan menguji tap listener.
              </Text>
            </View>
          ) : (
            logs.map((log) => {
              const isTap = log.source === 'response_tapped';
              return (
                <View
                  key={log.id}
                  style={[
                    styles.logItem,
                    isTap && { borderColor: C.blue, backgroundColor: '#f8faff' },
                  ]}
                >
                  <View style={styles.logHeaderRow}>
                    <View style={styles.logBadgeWrap}>
                      <MaterialCommunityIcons
                        name={isTap ? 'gesture-tap' : 'bell-ring'}
                        size={14}
                        color={isTap ? C.blue : C.primary}
                      />
                      <Text style={[styles.logSourceTxt, isTap && { color: C.blue }]}>
                        {isTap ? 'TAP RESPONSE (DEEP LINK)' : 'NOTIFIKASI DITERIMA'}
                      </Text>
                    </View>
                    <Text style={styles.logTime}>{log.timestamp}</Text>
                  </View>
                  <Text style={styles.logTitle}>{log.title}</Text>
                  <Text style={styles.logBody}>{log.body}</Text>
                  {log.data?.screen && (
                    <View style={styles.logDataPill}>
                      <MaterialIcons name="link" size={12} color="#0369a1" />
                      <Text style={styles.logDataTxt}>
                        Deep Link Target: {String(log.data.screen)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.onSurface,
  },
  headerSubtitle: {
    fontSize: 11,
    color: C.outline,
    marginTop: 1,
  },
  headerRightBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  expoGoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: 10,
  },
  expoGoBannerTxt: {
    flex: 1,
    fontSize: 11,
    color: '#0369a1',
    lineHeight: 16,
  },
  flowCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  flowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurface,
  },
  flowStepsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  stepPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  stepPillDone: {
    backgroundColor: C.blue,
  },
  stepPillActive: {
    backgroundColor: C.primary,
  },
  stepPillPending: {
    backgroundColor: '#cbd5e1',
  },
  stepPillTxtDone: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.onSurface,
  },
  cardSubtitle: {
    fontSize: 11,
    color: C.outline,
    marginTop: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBox: {
    flex: 1,
    backgroundColor: C.surfaceContainerLow,
    padding: 10,
    borderRadius: 10,
  },
  statusBoxLabel: {
    fontSize: 11,
    color: C.outline,
    marginBottom: 4,
  },
  statusBoxValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBoxValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  tokenBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  tokenActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },
  reRegBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  reRegBtnText: {
    fontSize: 11,
    color: C.outline,
  },
  permBtnGroup: {
    gap: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  primaryActionBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryActionBtnTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: C.onSurfaceVariant,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 12,
  },
  toastCardTxt: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#14532d',
    lineHeight: 16,
  },
  testItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  triggerInstantBtn: {
    backgroundColor: C.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  triggerDelayBtn: {
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerDelayTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: C.primary,
  },
  presetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurface,
  },
  presetDesc: {
    fontSize: 11,
    color: C.outline,
    marginTop: 2,
    lineHeight: 15,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '600',
  },
  emptyLog: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyLogTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: C.outline,
  },
  emptyLogSub: {
    fontSize: 11,
    color: C.outlineVariant,
    textAlign: 'center',
    maxWidth: 260,
  },
  logItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 4,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logSourceTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: C.primary,
  },
  logTime: {
    fontSize: 10,
    color: C.outline,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurface,
  },
  logBody: {
    fontSize: 11,
    color: C.onSurfaceVariant,
  },
  logDataPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  logDataTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369a1',
  },
});
