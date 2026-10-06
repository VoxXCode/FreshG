/**
 * FreshG – Pengaturan & Akun Screen
 * Faithful React Native translation of the HTML reference design.
 */
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabInset } from '@/constants/theme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { formatRupiah } from '@/utils/format';
import type { UserProfile } from '@/types/user';

// ─── Design Tokens ─────────────────────────────────────────────────────────────

const C = {
  primary:            '#006c49',
  primaryContainer:   '#10b981',
  onPrimary:          '#ffffff',
  onPrimaryContainer: '#00422b',
  secondary:          '#006c4a',
  secondaryContainer: '#82f5c1',
  onSecondaryContainer: '#00714e',
  surface:            '#f8f9ff',
  surfaceContainer:   '#e5eeff',
  surfaceContainerLow:'#eff4ff',
  surfaceContainerHigh:'#dce9ff',
  surfaceContainerHighest:'#d3e4fe',
  surfaceLowest:      '#ffffff',
  onSurface:          '#0b1c30',
  onSurfaceVariant:   '#3c4a42',
  outlineVariant:     '#bbcabf',
  outline:            '#6c7a71',
  error:              '#ba1a1a',
  errorContainer:     '#ffdad6',
  onErrorContainer:   '#93000a',
  tertiary:           '#855300',
  tertiaryContainer:  '#e29100',
  tertiaryFixed:      '#ffddb8',
  tertiaryFixedDim:   '#ffb95f',
  onTertiaryContainer:'#523200',
  background:         '#f8f9ff',
  surfaceBright:      '#f8f9ff',
};

// ─── Top App Bar ──────────────────────────────────────────────────────────────

function TopAppBar({ user }: { user?: UserProfile }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: C.surface + 'F2' }}>
      <View style={appBar.container}>
        <View style={appBar.left}>
          <View style={appBar.avatarWrap}>
            <Image
              source={{ uri: user?.avatarUrl || 'https://ui-avatars.com/api/?name=User&background=10b981&color=fff' }}
              style={appBar.avatar}
              contentFit="cover"
            />
          </View>
          <View>
            <Text style={appBar.title}>FreshG</Text>
            <Text style={appBar.subtitle}>Smart Kitchen Management</Text>
          </View>
        </View>
        <TouchableOpacity style={appBar.notifBtn} activeOpacity={0.7}>
          <MaterialIcons name="notifications" size={20} color={C.onSurfaceVariant} />
          <View style={appBar.notifBadge} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const appBar = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.surfaceContainer + '99',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: {
    width: 36, height: 36, borderRadius: 18, overflow: 'hidden',
    borderWidth: 2, borderColor: C.primaryContainer + 'CC', backgroundColor: C.surfaceLowest, padding: 2,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 16 },
  title: { fontSize: 16, fontWeight: '700', color: C.primary, letterSpacing: -0.2 },
  subtitle: { fontSize: 10, fontWeight: '500', color: C.outline },
  notifBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notifBadge: {
    position: 'absolute', top: 8, right: 8, width: 8, height: 8,
    borderRadius: 4, backgroundColor: C.error,
    borderWidth: 2, borderColor: C.surface,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

const ZONE_BADGE: Record<string, { bg: string; color: string; icon: MIName }> = {
  'Kulkas / Chiller': { bg: '#E0F2FE', color: '#0369A1', icon: 'ac-unit' },
  'Freezer Beku':     { bg: '#EEF2FF', color: '#4338CA', icon: 'severe-cold' },
  'Suhu Ruang / Pantry': { bg: '#FEF3C7', color: '#B45309', icon: 'wb-sunny' },
};

const DEFAULT_ZONES = [
  { name: 'Kulkas / Chiller', defaultTemp: '4°C', description: 'Notifikasi auto-expiry aktif pada sayur & susu.' },
  { name: 'Freezer Beku', defaultTemp: '-18°C', description: 'Pengingat freezer-burn interval 3 bulan.' },
  { name: 'Suhu Ruang / Pantry', defaultTemp: '', description: 'Peringatan kelembapan dan masa simpan umbi.' },
];

export default function PengaturanScreen() {
  const { data: user, loading } = useUserProfile();

  const [isDark, setIsDark] = useState(false);
  const [notif1, setNotif1] = useState(true);
  const [notif2, setNotif2] = useState(true);
  const [notif3, setNotif3] = useState(true);

  if (loading || !user) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <TopAppBar user={user} />

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Pengaturan & Akun</Text>
          <Text style={s.headerSub}>Kelola preferensi kulkas dan notifikasi pintar</Text>
        </View>

        {/* Profile Card */}
        <View style={s.card}>
          <View style={s.profileTop}>
            <View style={s.profileAvatarWrap}>
              <Image
                source={{ uri: user.avatarUrl }}
                style={s.profileAvatar}
                contentFit="cover"
              />
              <View style={s.profileBadge}>
                <MaterialIcons name="check" size={13} color={C.onPrimary} style={{ fontWeight: 'bold' }} />
              </View>
            </View>
            <View style={s.profileInfo}>
              <View style={s.profileNameRow}>
                <Text style={s.profileName} numberOfLines={1}>{user.name}</Text>
                <View style={s.memberBadge}>
                  <Text style={s.memberBadgeTxt}>{user.membershipLabel}</Text>
                </View>
              </View>
              <Text style={s.profileEmail} numberOfLines={1}>{user.email}</Text>
            </View>
          </View>
          <View style={s.profileBottom}>
            <Text style={s.memberId}>ID Anggota: {user.memberId}</Text>
            <TouchableOpacity style={s.btnEditProfile} activeOpacity={0.8}>
              <MaterialIcons name="edit" size={15} color={C.primary} />
              <Text style={s.btnEditProfileTxt}>Edit Profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dampak Dapur */}
        <View style={s.card}>
          <View style={s.dampakHeader}>
            <View style={s.dampakHeaderLeft}>
              <MaterialIcons name="eco" size={20} color={C.primary} />
              <Text style={s.dampakTitle}>Dampak Dapur & Cegah Food Waste</Text>
            </View>
            <View style={s.dampakMonthBadge}>
              <Text style={s.dampakMonthTxt}>Bulan Ini</Text>
            </View>
          </View>

          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <View style={s.statIconRow}>
                <MaterialIcons name="savings" size={15} color={C.primary} />
                <Text style={s.statLabel}>Estimasi Hemat</Text>
              </View>
              <Text style={s.statValuePrimary}>{formatRupiah(user.impact.savedAmount)}</Text>
              <Text style={s.statSub}>/ 30 hari terakhir</Text>
            </View>
            <View style={[s.statBox, s.statBorder]}>
              <View style={s.statIconRow}>
                <MaterialIcons name="kitchen" size={15} color={C.secondary} />
                <Text style={s.statLabel}>Terselamatkan</Text>
              </View>
              <Text style={s.statValue}>{user.impact.rescuedItems} Bahan</Text>
              <Text style={s.statSubBoldPrimary}>{user.impact.successPercent}% sukses diolah</Text>
            </View>
            <View style={[s.statBox, s.statBorder]}>
              <View style={s.statIconRow}>
                <MaterialCommunityIcons name="molecule-co2" size={15} color={C.tertiary} />
                <Text style={s.statLabel}>Jejak Karbon</Text>
              </View>
              <Text style={s.statValue}>{user.impact.co2PreventedKg} kg</Text>
              <Text style={s.statSub}>CO₂ tercegah</Text>
            </View>
          </View>

          <View style={s.rankingCallout}>
            <View style={s.rankingIconWrap}>
              <MaterialIcons name="verified" size={18} color={C.onSecondaryContainer} />
            </View>
            <Text style={s.rankingTxt}>Hebat! Kamu berada di peringkat {user.impact.topPercentile}% teratas rumah tangga paling hemat bahan pangan di kotamu.</Text>
          </View>
        </View>

        {/* Group 1: Tampilan & Preferensi */}
        <View style={s.group}>
          <Text style={s.groupTitle}>TAMPILAN & PREFERENSI</Text>
          <View style={[s.card, s.rowBetween]}>
            <View style={s.rowLeft}>
              <View style={s.iconWrap}>
                <MaterialIcons name="dark-mode" size={20} color={C.primary} />
              </View>
              <View>
                <Text style={s.itemTitle}>Mode Tampilan</Text>
                <Text style={s.itemDesc}>Tema Terang / Gelap</Text>
              </View>
            </View>
            <View style={s.themeToggle}>
              <TouchableOpacity
                style={[s.themeBtn, !isDark && s.themeBtnActive]}
                onPress={() => setIsDark(false)}
                activeOpacity={0.8}
              >
                <Text style={!isDark ? s.themeBtnTxtActive : s.themeBtnTxt}>Terang</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.themeBtn, isDark && s.themeBtnActive]}
                onPress={() => setIsDark(true)}
                activeOpacity={0.8}
              >
                <Text style={isDark ? s.themeBtnTxtActive : s.themeBtnTxt}>Gelap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Group 2: Notifikasi & Pengingat Pintar */}
        <View style={s.group}>
          <Text style={s.groupTitle}>NOTIFIKASI & PENGINGAT</Text>
          <View style={s.cardList}>
            <View style={s.listHeader}>
              <MaterialIcons name="notifications-active" size={18} color={C.primary} />
              <Text style={s.listHeaderTitle}>Pengaturan Notifikasi & Pengingat Pintar</Text>
            </View>

            <View style={s.listItem}>
              <View style={s.listItemContent}>
                <Text style={s.itemTitle}>Peringatan Harian Bahan Kritis</Text>
                <Text style={s.itemDesc}>Menerima peringatan bahan makanan yang akan kedaluwarsa dalam 1-2 hari.</Text>
                <View style={s.itemBadge}>
                  <MaterialIcons name="schedule" size={13} color={C.primary} />
                  <Text style={s.itemBadgeTxt}>Waktu kirim: Pukul 08:00 pagi</Text>
                </View>
              </View>
              <Switch value={notif1} onValueChange={setNotif1} trackColor={{ false: C.outlineVariant, true: C.primaryContainer }} thumbColor={C.surfaceLowest} />
            </View>

            <View style={[s.listItem, s.listBorder]}>
              <View style={s.listItemContent}>
                <Text style={s.itemTitle}>Pengingat Food Prep Akhir Pekan</Text>
                <Text style={s.itemDesc}>Panduan menata sayur dan marinasi daging sebelum minggu kerja dimulai.</Text>
                <View style={s.itemBadge}>
                  <MaterialIcons name="event-repeat" size={13} color={C.primary} />
                  <Text style={s.itemBadgeTxt}>Setiap Sabtu sore</Text>
                </View>
              </View>
              <Switch value={notif2} onValueChange={setNotif2} trackColor={{ false: C.outlineVariant, true: C.primaryContainer }} thumbColor={C.surfaceLowest} />
            </View>

            <View style={[s.listItem, s.listBorder]}>
              <View style={s.listItemContent}>
                <Text style={s.itemTitle}>Rekomendasi Resep Harian Berdasarkan Stok</Text>
                <Text style={s.itemDesc}>Ide olahan masakan otomatis disesuaikan dengan bahan sisa kulkas.</Text>
              </View>
              <Switch value={notif3} onValueChange={setNotif3} trackColor={{ false: C.outlineVariant, true: C.primaryContainer }} thumbColor={C.surfaceLowest} />
            </View>
          </View>
        </View>

        {/* Group 3: Manajemen Tempat Simpan Dapur */}
        <View style={s.group}>
          <View style={s.groupHeaderRow}>
            <Text style={s.groupTitleNoMargin}>TEMPAT SIMPAN</Text>
            <TouchableOpacity activeOpacity={0.7} style={s.groupHeaderAction}>
              <Text style={s.groupHeaderActionTxt}>+ Tambah Zona</Text>
            </TouchableOpacity>
          </View>
          <View style={s.cardList}>
            <View style={s.listHeader}>
              <MaterialCommunityIcons name="storefront-outline" size={18} color={C.primary} />
              <Text style={s.listHeaderTitle}>Manajemen Tempat Simpan Dapur</Text>
            </View>

            {DEFAULT_ZONES.map((zone: any, index: number) => {
              const badgeInfo = ZONE_BADGE[zone.name] || { bg: '#E2E8F0', color: '#475569', icon: 'kitchen' };
              return (
                <TouchableOpacity key={zone.name} style={[s.zoneItem, index > 0 && s.listBorder]} activeOpacity={0.7}>
                  <View style={s.zoneContent}>
                    <View style={s.zoneTitleRow}>
                      <View style={[s.zoneBadge, { backgroundColor: badgeInfo.bg }]}>
                        <Text style={[s.zoneBadgeTxt, { color: badgeInfo.color }]}>{zone.name}</Text>
                      </View>
                      <MaterialIcons name={badgeInfo.icon} size={16} color={badgeInfo.color} />
                      <Text style={s.zoneTitleTxt}>{zone.defaultTemp ? `Suhu default: ${zone.defaultTemp}` : 'Penyimpanan Kering'}</Text>
                    </View>
                    <Text style={s.itemDesc}>{zone.description}</Text>
                  </View>
                  <View style={s.zoneAction}>
                    <Text style={s.zoneActionTxt}>Atur Parameter</Text>
                    <MaterialIcons name="chevron-right" size={16} color={C.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Group 4: Akun & Bantuan */}
        <View style={s.group}>
          <Text style={s.groupTitle}>AKUN & BANTUAN</Text>
          <View style={s.cardList}>
            <TouchableOpacity style={s.linkItem} activeOpacity={0.7}>
              <View style={s.linkLeft}>
                <View style={s.iconWrap}>
                  <MaterialIcons name="no-meals" size={20} color={C.primary} />
                </View>
                <View style={s.linkText}>
                  <Text style={s.itemTitle}>Preferensi Diet & Alergi</Text>
                  <Text style={s.itemDesc} numberOfLines={1}>Filter rekomendasi tanpa kacang, gluten-free, dll</Text>
                </View>
              </View>
              <View style={s.linkRightRow}>
                <View style={s.linkBadge}><Text style={s.linkBadgeTxt}>Halal & Bebas Alergen</Text></View>
                <MaterialIcons name="chevron-right" size={18} color={C.outline} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.linkItem, s.listBorder]} activeOpacity={0.7}>
              <View style={s.linkLeft}>
                <View style={s.iconWrap}>
                  <MaterialIcons name="help-center" size={20} color={C.primary} />
                </View>
                <View style={s.linkText}>
                  <Text style={s.itemTitle}>Panduan Penggunaan & FAQ</Text>
                  <Text style={s.itemDesc} numberOfLines={1}>Cara scan barcode bahan, integrasi kulkas...</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={C.outline} />
            </TouchableOpacity>

            <TouchableOpacity style={[s.linkItem, s.listBorder]} activeOpacity={0.7}>
              <View style={s.linkLeft}>
                <View style={s.iconWrap}>
                  <MaterialIcons name="support-agent" size={20} color={C.primary} />
                </View>
                <View style={s.linkText}>
                  <Text style={s.itemTitle}>Hubungi Dukungan FreshG</Text>
                  <Text style={s.itemDesc} numberOfLines={1}>Layanan bantuan pelanggan 24/7</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={C.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity style={s.btnLogout} activeOpacity={0.8}>
            <MaterialIcons name="logout" size={20} color={C.error} />
            <Text style={s.btnLogoutTxt}>Keluar Akun</Text>
          </TouchableOpacity>
          <Text style={s.footerText}>FreshG App Versi 2.4.1 (Build 2024.11) • Hak Cipta Terlindungi</Text>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  header: { paddingHorizontal: 2 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.onSurface, letterSpacing: -0.2 },
  headerSub: { fontSize: 14, color: C.onSurfaceVariant, marginTop: 2 },

  card: { backgroundColor: C.surfaceLowest, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.surfaceContainerHigh + 'CC', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  
  // Profile
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatarWrap: { position: 'relative' },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: C.primaryContainer },
  profileBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.surfaceLowest, elevation: 2 },
  profileInfo: { flex: 1, gap: 4 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  profileName: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  memberBadge: { backgroundColor: C.secondaryContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  memberBadgeTxt: { fontSize: 11, fontWeight: '600', color: C.onSecondaryContainer },
  profileEmail: { fontSize: 13, fontWeight: '500', color: C.outline },
  
  profileBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.surfaceContainer + 'B3', marginTop: 12, paddingTop: 12 },
  memberId: { fontSize: 11, fontWeight: '500', color: C.outline },
  btnEditProfile: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: C.primary + '4D' },
  btnEditProfileTxt: { fontSize: 13, fontWeight: '700', color: C.primary },

  // Dampak Dapur
  dampakHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dampakHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dampakTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  dampakMonthBadge: { backgroundColor: C.primary + '1A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  dampakMonthTxt: { fontSize: 11, fontWeight: '700', color: C.primary },

  statsGrid: { flexDirection: 'row', backgroundColor: C.surfaceContainerLow + 'B3', borderRadius: 12, borderWidth: 1, borderColor: C.surfaceContainerHigh, paddingVertical: 12 },
  statBox: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: C.surfaceContainer + 'CC' },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '500', color: C.outline },
  statValuePrimary: { fontSize: 16, fontWeight: '700', color: C.primary },
  statValue: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  statSub: { fontSize: 10, fontWeight: '500', color: C.onSurfaceVariant, marginTop: 2 },
  statSubBoldPrimary: { fontSize: 10, fontWeight: '700', color: C.primary, marginTop: 2 },

  rankingCallout: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surfaceBright, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.surfaceContainer + 'CC', marginTop: 14 },
  rankingIconWrap: { backgroundColor: C.secondaryContainer, padding: 6, borderRadius: 8 },
  rankingTxt: { flex: 1, fontSize: 11, fontWeight: '500', color: C.onSurfaceVariant, lineHeight: 16 },

  // Grouped Lists
  group: { gap: 6 },
  groupTitle: { fontSize: 11, fontWeight: '700', color: C.outline, paddingHorizontal: 4, letterSpacing: 0.5 },
  groupTitleNoMargin: { fontSize: 11, fontWeight: '700', color: C.outline, letterSpacing: 0.5 },
  groupHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  groupHeaderAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  groupHeaderActionTxt: { fontSize: 11, fontWeight: '700', color: C.primary },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  
  themeToggle: { flexDirection: 'row', backgroundColor: C.surfaceContainer, borderRadius: 12, borderWidth: 1, borderColor: C.surfaceContainerHigh, padding: 4 },
  themeBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  themeBtnActive: { backgroundColor: C.surfaceLowest, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  themeBtnTxt: { fontSize: 11, fontWeight: '500', color: C.outline },
  themeBtnTxtActive: { fontSize: 11, fontWeight: '700', color: C.primary },

  cardList: { backgroundColor: C.surfaceLowest, borderRadius: 16, borderWidth: 1, borderColor: C.surfaceContainerHigh + 'CC', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surfaceContainerLow + '80', paddingHorizontal: 16, paddingVertical: 12 },
  listHeaderTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  listBorder: { borderTopWidth: 1, borderTopColor: C.surfaceContainer + 'B3' },

  listItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, gap: 12 },
  listItemContent: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface, lineHeight: 20 },
  itemDesc: { fontSize: 14, color: C.outline, lineHeight: 20 },
  itemBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  itemBadgeTxt: { fontSize: 11, fontWeight: '500', color: C.primary },

  zoneItem: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zoneContent: { flex: 1, gap: 4, paddingRight: 12 },
  zoneTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  zoneBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  zoneBadgeTxt: { fontSize: 11, fontWeight: '700' },
  zoneTitleTxt: { fontSize: 13, fontWeight: '700', color: C.onSurface },
  zoneAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  zoneActionTxt: { fontSize: 11, fontWeight: '700', color: C.primary },

  linkItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  linkText: { flex: 1 },
  linkRightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkBadge: { backgroundColor: C.secondaryContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  linkBadgeTxt: { fontSize: 11, fontWeight: '700', color: C.onSecondaryContainer },

  // Footer
  footer: { paddingTop: 8, gap: 12 },
  btnLogout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, backgroundColor: C.surfaceLowest, borderRadius: 16, borderWidth: 1, borderColor: C.errorContainer },
  btnLogoutTxt: { fontSize: 16, fontWeight: '700', color: C.error },
  footerText: { textAlign: 'center', fontSize: 11, fontWeight: '500', color: C.outline, paddingBottom: 8 },
});
