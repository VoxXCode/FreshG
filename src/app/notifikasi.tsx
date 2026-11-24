import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Modal,
  Pressable,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BottomTabInset } from '@/constants/theme';
import { usePushNotifications } from '@/hooks/use-push-notifications';

interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
  iconBg: string;
  unread?: boolean;
  hasActions?: boolean;
}

interface NotificationGroup {
  sectionTitle: string;
  items: NotificationItem[];
}

const FRESHG_NOTIFICATION_GROUPS: NotificationGroup[] = [
  {
    sectionTitle: 'Hari Ini',
    items: [
      {
        id: 'notif-1',
        title: 'Bayam & Wortel Mendekati Kedaluwarsa',
        subtitle: 'Sisa 1 hari lagi di chiller kulkas. Masak segera untuk sup hangat hari ini.',
        time: '09:41',
        iconName: 'clock-alert-outline',
        iconColor: '#ef4444',
        iconBg: '#fee2e2',
        unread: true,
      },
      {
        id: 'notif-2',
        title: 'Restok Telur Ayam Kampung Berhasil',
        subtitle: '10 butir telur ayam telah dicatat ke rak kulkas Anda.',
        time: '08:20',
        iconName: 'fridge-outline',
        iconColor: '#064e3b',
        iconBg: '#dcfce7',
        unread: true,
      },
    ],
  },
  {
    sectionTitle: 'Kemarin',
    items: [
      {
        id: 'notif-3',
        title: 'Sup Bayam Jagung Selesai Dimasak',
        subtitle: 'Berhasil menghemat estimasi Rp 45.000 dari pengolahan bahan sisa.',
        time: '17:00',
        iconName: 'pot-steam-outline',
        iconColor: '#16a34a',
        iconBg: '#dcfce7',
      },
      {
        id: 'notif-4',
        title: 'Ide Olahan Daging & Sayur Tersedia',
        subtitle: 'Lihat 3 kreasi resep tumisan lezat berbasis bahan yang ada di kulkas.',
        time: '12:00',
        iconName: 'book-open-page-variant-outline',
        iconColor: '#d97706',
        iconBg: '#fef3c7',
      },
    ],
  },
  {
    sectionTitle: '27 November 2024',
    items: [
      {
        id: 'notif-5',
        title: 'Pengingat Belanja Mingguan Pasar',
        subtitle: '3 bahan belanjaan belum Anda centang pada daftar belanja.',
        time: '12:05',
        iconName: 'cart-outline',
        iconColor: '#0284c7',
        iconBg: '#e0f2fe',
      },
      {
        id: 'notif-6',
        title: 'Diskon Buah & Sayur Segar 25%',
        subtitle: 'Promo pasar organik mitra FreshG hari ini untuk stok akhir pekan.',
        time: '09:00',
        iconName: 'tag-outline',
        iconColor: '#d97706',
        iconBg: '#fef3c7',
      },
    ],
  },
  {
    sectionTitle: '26 November 2024',
    items: [
      {
        id: 'notif-7',
        title: 'Selamat Datang di FreshG! 🌿',
        subtitle: 'Mulai kelola kulkas Anda, rencanakan belanja segar, dan cegah pemborosan bahan pangan.',
        time: '13:30',
        iconName: 'sprout',
        iconColor: '#064e3b',
        iconBg: '#dcfce7',
        hasActions: true,
      },
    ],
  },
];

export default function NotificationScreen() {
  const router = useRouter();
  const { expoPushToken, sendTestNotification } = usePushNotifications();

  const [showMenuModal, setShowMenuModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyToken = () => {
    if (expoPushToken) {
      Clipboard.setString(expoPushToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      Alert.alert('Info', 'Push Token simulator aktif.');
    }
  };

  const handleTriggerTest = async (type: 'expiry' | 'recipe' | 'todo') => {
    setShowMenuModal(false);
    try {
      await sendTestNotification(type, undefined, 1);
      Alert.alert('Sukses', 'Notifikasi uji berhasil dikirim ke perangkat!');
    } catch {
      Alert.alert('Info', 'Notifikasi dijadwalkan.');
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView edges={['top']} style={s.topSafeArea} />

      <View style={s.headerContainer}>
        <TouchableOpacity
          style={s.headerBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Kembali"
        >
          <Feather name="chevron-left" size={24} color="#064e3b" />
        </TouchableOpacity>

        <Text style={s.headerTitle}>Notifikasi</Text>

        <TouchableOpacity
          style={s.headerBtn}
          onPress={() => setShowMenuModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Opsi Notifikasi"
        >
          <MaterialIcons name="more-vert" size={22} color="#064e3b" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {FRESHG_NOTIFICATION_GROUPS.map(group => (
          <View key={group.sectionTitle} style={s.groupContainer}>
            <Text style={s.groupHeader}>{group.sectionTitle}</Text>

            <View style={s.groupCard}>
              {group.items.map((item, idx) => (
                <View key={item.id} style={[s.itemCard, idx > 0 && s.itemDivider]}>
                  <View style={[s.iconBox, { backgroundColor: item.iconBg }]}>
                    <MaterialCommunityIcons name={item.iconName} size={22} color={item.iconColor} />
                  </View>

                  <View style={s.itemContent}>
                    <View style={s.titleRow}>
                      <Text style={s.itemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={s.timeRow}>
                        <Text style={s.itemTime}>{item.time}</Text>
                        {item.unread && <View style={s.unreadDot} />}
                      </View>
                    </View>

                    <Text style={s.itemSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>

                    {item.hasActions && (
                      <View style={s.actionBtnRow}>
                        <TouchableOpacity
                          style={s.primaryActionBtn}
                          activeOpacity={0.8}
                          onPress={() => router.push('/scan')}
                        >
                          <Text style={s.primaryActionTxt}>Coba Scan Bahan</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={s.secondaryActionBtn}
                          activeOpacity={0.8}
                          onPress={() => router.push('/stok')}
                        >
                          <Text style={s.secondaryActionTxt}>Lihat Stok Kulkas</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setShowMenuModal(false)}>
          <Pressable style={s.modalCard} onPress={e => e.stopPropagation()}>
            <View style={s.modalHeader}>
              <View style={s.modalHeaderLeft}>
                <MaterialCommunityIcons name="bell-cog-outline" size={22} color="#064e3b" />
                <Text style={s.modalTitle}>Opsi Notifikasi FreshG</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenuModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.menuRow}
              onPress={() => {
                setShowMenuModal(false);
                router.push('/setting-notifikasi');
              }}
            >
              <View style={s.menuIconWrap}>
                <Feather name="sliders" size={18} color="#064e3b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuRowTitle}>Pengaturan Notifikasi</Text>
                <Text style={s.menuRowDesc}>Atur suara, getar, pembaruan stok & rekomendasi tips</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            <View style={s.menuDivider} />

            <TouchableOpacity style={s.menuRow} onPress={handleCopyToken}>
              <View style={s.menuIconWrap}>
                <Feather name="copy" size={18} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuRowTitle}>
                  {copiedToken ? 'Token Berhasil Disalin!' : 'Salin Expo Push Token (Week 11)'}
                </Text>
                <Text style={s.menuRowDesc} numberOfLines={1}>
                  {expoPushToken ? expoPushToken : 'Token simulator terdeteksi'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={s.menuDivider} />

            <Text style={s.menuSectionLabel}>KIRIM NOTIFIKASI UJI (WEEK 11)</Text>
            <View style={s.testBtnGrid}>
              <TouchableOpacity
                style={s.testChip}
                onPress={() => handleTriggerTest('expiry')}
              >
                <Text style={s.testChipTxt}>+ Bahan Kedaluwarsa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.testChip}
                onPress={() => handleTriggerTest('recipe')}
              >
                <Text style={s.testChipTxt}>+ Rekomendasi Resep</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.testChip}
                onPress={() => handleTriggerTest('todo')}
              >
                <Text style={s.testChipTxt}>+ Pengingat Belanja</Text>
              </TouchableOpacity>
            </View>
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
  topSafeArea: {
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 24 : Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  groupContainer: {
    marginBottom: 18,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    paddingLeft: 4,
    letterSpacing: 0.2,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  primaryActionBtn: {
    backgroundColor: '#064e3b',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  primaryActionTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryActionTxt: {
    color: '#064e3b',
    fontSize: 12,
    fontWeight: '700',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064e3b',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  menuRowDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  menuSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  testBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testChip: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  testChipTxt: {
    fontSize: 12,
    color: '#064e3b',
    fontWeight: '600',
  },
});
