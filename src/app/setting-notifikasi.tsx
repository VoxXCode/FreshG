import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BottomTabInset } from '@/constants/theme';

export default function SettingNotifikasiScreen() {
  const router = useRouter();

  const [generalNotif, setGeneralNotif] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(false);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [recipeTips, setRecipeTips] = useState(true);
  const [shoppingReminder, setShoppingReminder] = useState(false);

  const SETTING_ITEMS = [
    {
      id: 'general',
      icon: 'bell-outline',
      title: 'Notifikasi Umum',
      subtitle: 'Terima informasi penting dan pembaruan sistem aplikasi',
      value: generalNotif,
      setter: setGeneralNotif,
    },
    {
      id: 'sound',
      icon: 'volume-high',
      title: 'Suara Notifikasi',
      subtitle: 'Bunyikan nada saat ada peringatan atau pesan baru',
      value: sound,
      setter: setSound,
    },
    {
      id: 'vibrate',
      icon: 'vibrate',
      title: 'Getaran',
      subtitle: 'Getar perangkat saat notifikasi push masuk',
      value: vibrate,
      setter: setVibrate,
    },
    {
      id: 'stock',
      icon: 'clock-alert-outline',
      title: 'Peringatan Stok & Kedaluwarsa',
      subtitle: 'Peringatan bahan makanan yang mendekati masa kedaluwarsa ≤2 hari',
      value: stockAlerts,
      setter: setStockAlerts,
    },
    {
      id: 'recipes',
      icon: 'pot-steam-outline',
      title: 'Rekomendasi Resep Harian',
      subtitle: 'Ide kreasi masakan otomatis dari bahan sisa kulkas Anda',
      value: recipeTips,
      setter: setRecipeTips,
    },
    {
      id: 'shopping',
      icon: 'cart-outline',
      title: 'Pengingat Belanja Mingguan',
      subtitle: 'Pengingat rutin untuk mengecek checklist bahan belanjaan',
      value: shoppingReminder,
      setter: setShoppingReminder,
    },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView edges={['top']} style={s.topSafeArea} />

      <View style={s.headerContainer}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Kembali"
        >
          <Feather name="arrow-left" size={22} color="#064e3b" />
        </TouchableOpacity>

        <Text style={s.headerTitle}>Pengaturan Notifikasi</Text>

        <View style={s.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionHeader}>PREFERENSI PEMBERITAHUAN</Text>

        <View style={s.groupCard}>
          {SETTING_ITEMS.map((item, idx) => (
            <View key={item.id} style={[s.settingRow, idx > 0 && s.divider]}>
              <View style={s.itemLeft}>
                <View style={s.iconWrap}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={20}
                    color={item.value ? '#064e3b' : '#94a3b8'}
                  />
                </View>
                <View style={s.textCol}>
                  <Text style={s.settingTitle}>{item.title}</Text>
                  <Text style={s.settingSubtitle}>{item.subtitle}</Text>
                </View>
              </View>

              <Switch
                value={item.value}
                onValueChange={item.setter}
                trackColor={{ false: '#e2e8f0', true: '#16a34a' }}
                thumbColor="#ffffff"
                ios_backgroundColor="#e2e8f0"
              />
            </View>
          ))}
        </View>

        <View style={s.infoBox}>
          <Feather name="info" size={16} color="#064e3b" />
          <Text style={s.infoText}>
            Notifikasi pintar FreshG membantu mencegah makanan terbuang sia-sia dengan jadwal pengingat pukul 08:00 pagi setiap hari.
          </Text>
        </View>
      </ScrollView>
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
  backBtn: {
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
    fontSize: 17,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: -0.3,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.2,
  },
  settingSubtitle: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#064e3b',
    lineHeight: 18,
    fontWeight: '500',
  },
});
