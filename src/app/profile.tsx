import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabInset } from '@/constants/theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useAuth } from '@/hooks/use-auth';
import { LoadingStateView, ErrorStateView } from '@/components/ui/api-state-view';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { useNetworkStatus, setSimulatedOffline } from '@/hooks/use-network-status';
import { setSimulatedError, getSimulatedError } from '@/data/services/api';

type SimOption = 'normal' | 'offline' | '500' | '404' | 'timeout' | 'empty';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { data: user, loading, isRetrying, error, refetch } = useUserProfile();

  const [isDark, setIsDark] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'Indonesia' | 'English'>('English');
  const [showSimModal, setShowSimModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const { simulatedOffline } = useNetworkStatus();
  const [activeSim, setActiveSim] = useState<SimOption>(() => {
    if (simulatedOffline) return 'offline';
    const err = getSimulatedError();
    if (err !== 'none') return err;
    return 'normal';
  });

  const handleSelectSim = (sim: SimOption) => {
    setActiveSim(sim);
    if (sim === 'offline') {
      setSimulatedOffline(true);
      setSimulatedError('none');
    } else {
      setSimulatedOffline(false);
      setSimulatedError(sim === 'normal' ? 'none' : sim);
    }
  };

  const handleLogout = () => {
    const performLogout = async () => {
      await logout();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Apakah Anda yakin ingin keluar dari akun?')) {
        void performLogout();
      }
    } else {
      Alert.alert(
        'Konfirmasi Keluar',
        'Apakah Anda yakin ingin keluar dari akun? Sesi login Anda akan diakhiri.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Keluar', style: 'destructive', onPress: () => void performLogout() },
        ]
      );
    }
  };

  if (loading && !isRetrying && !user) {
    return (
      <View style={[s.root, s.centerContent]}>
        <LoadingStateView />
      </View>
    );
  }

  if (error && !user) {
    return (
      <View style={[s.root, s.centerContent, { paddingHorizontal: 16 }]}>
        <ErrorStateView error={error} onRetry={refetch} />
      </View>
    );
  }

  const avatarUrl = user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80';
  const displayName = user?.name || 'Ronald Richards';
  const displayEmail = user?.email || 'ronaldrichards@gmail.com';

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView edges={['top']} style={s.topSafeArea} />

      <View style={s.headerContainer}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>

      <OfflineBanner onRetryAll={refetch} />

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: BottomTabInset + 44 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.profileCard}>
          <Image
            source={{ uri: avatarUrl }}
            style={s.avatar}
            contentFit="cover"
          />
          <View style={s.profileTextCol}>
            <Text style={s.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={s.userEmail} numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <View style={s.groupCard}>
            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Kelola Profil', `Nama: ${displayName}\nEmail: ${displayEmail}\nID: ${user?.memberId || 'FG-8821'}`)}
            >
              <View style={s.itemLeft}>
                <Feather name="user" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>Manage Profile</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Password & Security', 'Sistem keamanan akun Anda terenkripsi dengan aman via SecureStore.')}
            >
              <View style={s.itemLeft}>
                <Feather name="lock" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>Password & Security</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => router.push('/setting-notifikasi')}
            >
              <View style={s.itemLeft}>
                <Feather name="bell" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>Notifications</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => setSelectedLanguage(prev => prev === 'English' ? 'Indonesia' : 'English')}
            >
              <View style={s.itemLeft}>
                <Feather name="globe" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>Language</Text>
              </View>
              <View style={s.itemRight}>
                <Text style={s.itemValueText}>{selectedLanguage}</Text>
                <Feather name="chevron-right" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>
          <View style={s.groupCard}>
            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => setShowAboutModal(true)}
            >
              <View style={s.itemLeft}>
                <Feather name="info" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>About Us</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => setIsDark(prev => !prev)}
            >
              <View style={s.itemLeft}>
                <Feather name="moon" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>Theme</Text>
              </View>
              <View style={s.itemRight}>
                <Text style={s.itemValueText}>{isDark ? 'Dark' : 'Light'}</Text>
                <Feather name="chevron-right" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => router.push('/lokasi')}
            >
              <View style={s.itemLeft}>
                <Feather name="map-pin" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>Lokasi</Text>
              </View>
              <View style={s.itemRight}>
                <Feather name="chevron-right" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Support</Text>
          <View style={s.groupCard}>
            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Pusat Bantuan FreshG', 'Hubungi tim bantuan kami via email support@freshg.app atau kunjungi dokumentasi integrasi.')}
            >
              <View style={s.itemLeft}>
                <Feather name="help-circle" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>Help Center</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => router.push('/sensor')}
            >
              <View style={s.itemLeft}>
                <Feather name="cpu" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>Sensor Perangkat</Text>
              </View>
              <View style={s.itemRight}>
                <Feather name="chevron-right" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={() => setShowSimModal(true)}
            >
              <View style={s.itemLeft}>
                <Feather name="sliders" size={19} color="#334155" style={s.itemIcon} />
                <Text style={s.itemLabel}>Simulasi</Text>
              </View>
              <View style={s.itemRight}>
                <Feather name="chevron-right" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>

            <View style={s.divider} />

            <TouchableOpacity
              style={s.itemRow}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <View style={s.itemLeft}>
                <Feather name="log-out" size={19} color="#ef4444" style={s.itemIcon} />
                <Text style={[s.itemLabel, { color: '#ef4444', fontWeight: '700' }]}>Log Out</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.buildFooterText}>FreshG App Version 2.4.1 (Build 2024.11)</Text>
      </ScrollView>

      <Modal
        visible={showSimModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSimModal(false)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setShowSimModal(false)}>
          <Pressable style={s.modalCard} onPress={e => e.stopPropagation()}>
            <View style={s.modalHeader}>
              <View style={s.modalHeaderTitleRow}>
                <MaterialIcons name="science" size={22} color="#064e3b" />
                <Text style={s.modalTitle}>Simulasi API & Jaringan</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSimModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={s.modalSubtext}>
              Pilih skenario respon server untuk menguji error handling, timeout, dan mode offline pada aplikasi:
            </Text>

            <View style={s.simList}>
              {[
                { id: 'normal', label: 'Normal (200 OK)', desc: 'Request berhasil dan data termuat normal' },
                { id: 'offline', label: 'Mode Offline', desc: 'Uji respon saat koneksi internet terputus' },
                { id: '500', label: 'Server Error 500', desc: 'Uji respon HTTP 500 & penanganan crash' },
                { id: 'timeout', label: 'Timeout Request', desc: 'Uji batas waktu 10 detik & pembatalan' },
                { id: 'empty', label: 'Data Kosong []', desc: 'Uji respon array kosong dari server' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={[s.simOptionItem, activeSim === opt.id && s.simOptionItemActive]}
                  onPress={() => {
                    handleSelectSim(opt.id as SimOption);
                    setShowSimModal(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.simOptionTitle, activeSim === opt.id && s.simOptionTitleActive]}>
                      {opt.label}
                    </Text>
                    <Text style={s.simOptionDesc}>{opt.desc}</Text>
                  </View>
                  <MaterialIcons
                    name={activeSim === opt.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={22}
                    color={activeSim === opt.id ? '#064e3b' : '#cbd5e1'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setShowAboutModal(false)}>
          <Pressable style={s.modalCard} onPress={e => e.stopPropagation()}>
            <View style={s.modalHeader}>
              <View style={s.modalHeaderTitleRow}>
                <MaterialCommunityIcons name="leaf" size={22} color="#064e3b" />
                <Text style={s.modalTitle}>Tentang FreshG</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={s.aboutText}>
              FreshG adalah aplikasi pintar manajemen persediaan kulkas, perencanaan belanja segar, dan pencegahan food waste berbasis Expo React Native.
            </Text>
            <Text style={[s.aboutText, { marginTop: 10 }]}>
              Dikembangkan dengan integrasi REST API asinkron, sensor akselerometer & kamera, layanan berbasis lokasi (LBS), serta notifikasi pintar.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSafeArea: {
    backgroundColor: '#f8fafc',
  },

  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 32 : Platform.OS === 'android' ? 24 : 18,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 18,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e2e8f0',
  },
  profileTextCol: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },

  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.2,
    paddingLeft: 4,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  itemIcon: {
    width: 22,
    textAlign: 'center',
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemValueText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  divider: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
  },

  buildFooterText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtext: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  simList: {
    gap: 8,
  },
  simOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  simOptionItemActive: {
    borderColor: '#064e3b',
    backgroundColor: '#f0fdf4',
  },
  simOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  simOptionTitleActive: {
    color: '#064e3b',
  },
  simOptionDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  aboutText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
});
