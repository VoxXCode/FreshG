/**
 * FreshG – Home / Beranda Screen
 * Faithful React Native translation of the HTML reference design.
 */
import { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  Ionicons,
} from '@expo/vector-icons';

import {
  type Ingredient,
  type Category,
  type StorageLocation,
  type FreshnessStatus,
  type IngredientStatus,
  CATEGORIES,
  STORAGE_LOCATIONS,
  FRESHNESS_CONFIG,
  STORAGE_TIPS,
  DEFAULT_EXPIRY_DAYS,
  getFreshnessStatus,
  getDaysUntilExpiry,
  getFreshnessPercent,
} from '@/types/ingredient';
import { BottomTabInset } from '@/constants/theme';
import { useIngredients } from '@/hooks/use-ingredients';

// ─── Design Tokens (translated from Tailwind config) ─────────────────────────

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
};

// ─── Category icon map ────────────────────────────────────────────────────────

type MCName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

const CATEGORY_MC: Record<Category, MCName> = {
  'Sayuran':         'sprout',
  'Buah-buahan':     'fruit-grapes',
  'Bumbu Dapur':     'chili-mild',
  'Daging & Olahan': 'food-steak',
  'Susu & Telur':    'egg',
  'Herbal':          'leaf',
  'Kering':          'grain',
};

const CATEGORY_BG: Record<Category, string> = {
  'Sayuran':         '#dcfce7',
  'Buah-buahan':     '#fce7f3',
  'Bumbu Dapur':     '#fef9c3',
  'Daging & Olahan': '#fee2e2',
  'Susu & Telur':    '#ede9fe',
  'Herbal':          '#d1fae5',
  'Kering':          '#fef3c7',
};

const STORAGE_ICON: Record<StorageLocation, { icon: string; bg: string; color: string }> = {
  'Kulkas':      { icon: 'snow-outline',               bg: '#e0f2fe', color: '#0369a1' },
  'Freezer':     { icon: 'ice-cream-outline',           bg: '#eef2ff', color: '#4338ca' },
  'Suhu Ruang':  { icon: 'sunny-outline',               bg: '#fef3c7', color: '#b45309' },
  'Lemari':      { icon: 'file-tray-stacked-outline',   bg: '#f3f4f6', color: '#6b7280' },
};

// ─── Data ─────────────────────────────────────────────────────────────────────
// Data bahan diambil dari server lewat useIngredients():
// src/data/server/ingredients.json → IngredientDTO → toIngredient() → Ingredient

// ─── Freshness Progress Bar ───────────────────────────────────────────────────

function FreshnessBar({ percent, status }: { percent: number; status: FreshnessStatus }) {
  const cfg = FRESHNESS_CONFIG[status];
  const freshnessLabel =
    status === 'fresh'    ? 'Kondisi Sangat Segar' :
    status === 'warning'  ? 'Perlu Perhatian'       :
    status === 'expiring' ? 'Masa Simpan Kritis'    :
    'Kedaluwarsa';

  return (
    <View style={pb.wrap}>
      <View style={pb.labelRow}>
        <Text style={[pb.label, { color: cfg.color }]}>{freshnessLabel}</Text>
        <Text style={[pb.pct, { color: cfg.color }]}>Sisa {percent}%</Text>
      </View>
      <View style={pb.track}>
        <View style={[pb.fill, { width: `${percent}%`, backgroundColor: cfg.barColor }]} />
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  wrap:     { marginTop: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label:    { fontSize: 11, fontWeight: '700' },
  pct:      { fontSize: 11, fontWeight: '700' },
  track:    { height: 6, backgroundColor: '#e5eeff', borderRadius: 99, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 99 },
});

// ─── Storage Location Pill ────────────────────────────────────────────────────

function StoragePill({ location }: { location: StorageLocation }) {
  const { bg, color, icon } = STORAGE_ICON[location];
  return (
    <View style={[pill.wrap, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={11} color={color} />
      <Text style={[pill.text, { color }]}>{location}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  text:  { fontSize: 11, fontWeight: '700' },
});

// ─── Freshness Badge ──────────────────────────────────────────────────────────

function FreshnessBadge({ status, daysLeft }: { status: FreshnessStatus; daysLeft: number }) {
  const cfg = FRESHNESS_CONFIG[status];
  const label =
    daysLeft < 0   ? 'Kedaluwarsa'             :
    daysLeft === 0 ? `${cfg.label} - Hari ini`  :
    `${cfg.label} - ${daysLeft} Hari`;

  return (
    <View style={[fb.wrap, { backgroundColor: cfg.bgColor, borderColor: cfg.color + '33' }]}>
      <View style={[fb.dot, { backgroundColor: cfg.dotColor }]} />
      <Text style={[fb.text, { color: cfg.color }]}>{label}</Text>
    </View>
  );
}

const fb = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '700' },
});

// ─── Ingredient Card ──────────────────────────────────────────────────────────

function IngredientCard({
  item, onUse, onDiscard,
}: {
  item: Ingredient;
  onUse: (id: string) => void;
  onDiscard: (id: string) => void;
}) {
  const status   = getFreshnessStatus(item.expiryDate);
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  const percent  = getFreshnessPercent(daysLeft, item.totalDays);
  const catBg    = CATEGORY_BG[item.category];
  const cfg      = FRESHNESS_CONFIG[status];

  const isExpiring = status === 'expiring' || status === 'expired';

  return (
    <View style={[ic.card, isExpiring && ic.cardUrgent]}>
      {/* Top row */}
      <View style={ic.topRow}>
        {/* Icon */}
        <View style={[ic.iconWrap, { backgroundColor: catBg }]}>
          <MaterialCommunityIcons
            name={CATEGORY_MC[item.category]}
            size={24}
            color={cfg.color}
          />
        </View>

        {/* Name + meta */}
        <View style={{ flex: 1 }}>
          <Text style={ic.name} numberOfLines={1}>{item.name}</Text>
          <View style={ic.metaRow}>
            <StoragePill location={item.storageLocation} />
            {item.quantity && (
              <Text style={ic.quantity}>{item.quantity}</Text>
            )}
          </View>
        </View>

        {/* Badge */}
        <FreshnessBadge status={status} daysLeft={daysLeft} />
      </View>

      {/* Progress bar */}
      <FreshnessBar percent={percent} status={status} />

      {/* Divider */}
      <View style={ic.divider} />

      {/* Quick Actions */}
      <View style={ic.actions}>
        <TouchableOpacity
          style={[ic.btn, ic.btnDiscard]}
          onPress={() => onDiscard(item.id)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="delete" size={15} color={C.error} />
          <Text style={[ic.btnTxt, { color: C.error }]}>Buang</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[ic.btn, ic.btnUse]}
          onPress={() => onUse(item.id)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="check" size={15} color={C.onSecondaryContainer} />
          <Text style={[ic.btnTxt, { color: C.onSecondaryContainer }]}>Gunakan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ic = StyleSheet.create({
  card: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.outlineVariant + '99',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardUrgent: {
    borderColor: C.error + '33',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  name: { fontSize: 15, fontWeight: '700', color: C.onSurface, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  quantity: { fontSize: 11, color: C.outline, fontWeight: '500' },
  divider: { height: 1, backgroundColor: C.surfaceContainer, marginVertical: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  btnDiscard: {
    borderWidth: 1, borderColor: C.error + '44',
  },
  btnUse: {
    backgroundColor: C.secondaryContainer,
  },
  btnTxt: { fontSize: 12, fontWeight: '700' },
});

// ─── Category Filter Chip ─────────────────────────────────────────────────────

function CategoryChip({
  label, icon, isActive, onPress,
}: {
  label: string; icon: MCName; isActive: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[ch.chip, isActive && ch.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color={isActive ? C.onPrimary : C.onSurface}
      />
      <Text style={[ch.text, isActive && ch.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const ch = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12,
    backgroundColor: C.surfaceLowest,
    borderWidth: 1, borderColor: C.outlineVariant + '80',
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  text:       { fontSize: 12, fontWeight: '600', color: C.onSurface },
  textActive: { color: C.onPrimary },
});

// ─── Filter Pill ──────────────────────────────────────────────────────────────

type FilterPillProps = {
  label: string;
  isActive?: boolean;
  isUrgent?: boolean;
  onPress: () => void;
};
function FilterPill({ label, isActive, isUrgent, onPress }: FilterPillProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        fp.pill,
        isActive && fp.pillActive,
        isUrgent && fp.pillUrgent,
      ]}
    >
      {isUrgent && <View style={fp.urgentDot} />}
      <Text style={[fp.text, isActive && fp.textActive, isUrgent && fp.textUrgent]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const fp = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 99, borderWidth: 1,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceLowest,
    marginRight: 8,
  },
  pillActive:  { backgroundColor: C.primary, borderColor: C.primary },
  pillUrgent:  { backgroundColor: C.errorContainer + 'CC', borderColor: C.error + '4D' },
  urgentDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.error },
  text:        { fontSize: 12, fontWeight: '600', color: C.onSurfaceVariant },
  textActive:  { color: C.onPrimary },
  textUrgent:  { color: C.onErrorContainer, fontWeight: '700' },
});

// ─── Storage Tip Card ─────────────────────────────────────────────────────────

function StorageTipCard({ tip, onNext }: {
  tip: typeof STORAGE_TIPS[number];
  onNext: () => void;
}) {
  return (
    <View style={st.card}>
      <View style={st.iconCol}>
        <View style={st.iconWrap}>
          <MaterialCommunityIcons name={tip.icon as any} size={20} color={C.tertiary} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={st.topRow}>
          <Text style={st.label}>Tips Penyimpanan Hari Ini</Text>
          <MaterialCommunityIcons name="bookmark-plus-outline" size={18} color={C.tertiary} />
        </View>
        <Text style={st.text}>{tip.tip}</Text>
        <View style={st.footer}>
          <TouchableOpacity style={st.nextBtn} onPress={onNext} activeOpacity={0.8}>
            <Text style={st.nextTxt}>Tips Lainnya</Text>
            <Feather name="chevron-right" size={13} color={C.tertiary} />
          </TouchableOpacity>
          <Text style={st.category}>Kategori: {tip.category}</Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.tertiaryFixed + '66',
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.tertiaryFixedDim + '99',
  },
  iconCol:  { paddingTop: 2 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.tertiaryContainer + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  label:  { fontSize: 10, fontWeight: '800', color: C.tertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  text:   { fontSize: 13, color: C.onSurface, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  nextBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  nextTxt:  { fontSize: 12, fontWeight: '700', color: C.tertiary },
  category: { fontSize: 11, color: C.onSurfaceVariant, fontWeight: '500' },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────

type FilterType = Category | StorageLocation | 'Semua' | 'Kritis';

export default function HomeScreen() {
  const { data, loading } = useIngredients();
  // Perubahan status lokal (Gunakan / Buang) disimpan terpisah dari data server
  const [statusOverrides, setStatusOverrides] = useState<Record<string, IngredientStatus>>({});
  const ingredients = useMemo<Ingredient[]>(
    () => (data ?? []).map(i => (statusOverrides[i.id] ? { ...i, status: statusOverrides[i.id] } : i)),
    [data, statusOverrides],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Semua');
  const [tipIndex, setTipIndex] = useState(0);
  const [sortBy] = useState<'expiry' | 'name'>('expiry');

  const active = useMemo(() => ingredients.filter(i => i.status === 'active'), [ingredients]);

  const urgentItems = useMemo(() =>
    active
      .filter(i => {
        const s = getFreshnessStatus(i.expiryDate);
        return s === 'expiring' || s === 'expired';
      })
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()),
  [active]);
  const urgentCount = urgentItems.length;
  const urgentNames = urgentItems.slice(0, 2).map(i => i.name).join(' & ');

  const filtered = useMemo(() => {
    let list = active.filter(i =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (activeFilter === 'Kritis') {
      list = list.filter(i => {
        const s = getFreshnessStatus(i.expiryDate);
        return s === 'expiring' || s === 'expired';
      });
    } else if (activeFilter !== 'Semua') {
      list = list.filter(i =>
        i.category === activeFilter || i.storageLocation === activeFilter,
      );
    }
    // Sort by expiry ascending
    return [...list].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  }, [active, searchQuery, activeFilter]);

  const handleUse = useCallback((id: string) => {
    Alert.alert('Tandai Terpakai', 'Bahan ini sudah terpakai?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Konfirmasi',
        onPress: () => setStatusOverrides(p => ({ ...p, [id]: 'used' })),
      },
    ]);
  }, []);

  const handleDiscard = useCallback((id: string) => {
    Alert.alert('Buang Bahan', 'Yakin ingin membuang bahan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Buang',
        style: 'destructive',
        onPress: () => setStatusOverrides(p => ({ ...p, [id]: 'discarded' })),
      },
    ]);
  }, []);

  const currentTip = STORAGE_TIPS[tipIndex];

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: `Semua (${active.length})`, value: 'Semua' },
    { label: `Kritis/Segera (<2 hari)`,  value: 'Kritis' },
    { label: 'Kulkas ❄️',               value: 'Kulkas' },
    { label: 'Freezer 🧊',              value: 'Freezer' },
    { label: 'Suhu Ruang',              value: 'Suhu Ruang' },
    { label: 'Sayuran',                 value: 'Sayuran' },
    { label: 'Buah',                    value: 'Buah-buahan' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* ── Top App Bar ── */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: C.surface }}>
        <View style={s.header}>
          {/* Avatar + Greeting */}
          <View style={s.headerLeft}>
            
            <View>
              
              <View style={s.brandRow}>
                <Text style={s.brandName}>FreshG</Text>
                <MaterialCommunityIcons name="leaf" size={18} color={C.primaryContainer} />
              </View>
            </View>
          </View>
          {/* Notification Bell */}
          <TouchableOpacity style={s.bellBtn} activeOpacity={0.8}>
            <MaterialIcons name="notifications" size={24} color={C.onSurface} />
            {urgentCount > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeText}>{urgentCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1, backgroundColor: C.surface }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: BottomTabInset + 32 }]}
      >
        {/* ── SECTION 1: Smart Reminder Banner ── */}
        {urgentCount > 0 && (
          <View style={s.reminderCard}>
            <View style={s.reminderIconWrap}>
              <MaterialIcons name="warning" size={22} color={C.error} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.reminderTopRow}>
                <Text style={s.reminderChip}>SMART REMINDER</Text>
                <View style={s.reminderBadge}>
                  <Text style={s.reminderBadgeText}>Segera Masak</Text>
                </View>
              </View>
              <Text style={s.reminderTitle}>
                {urgentCount} bahan mendekati masa simpan!
              </Text>
              <Text style={s.reminderSub}>
                {urgentNames} perlu dimasak hari ini agar nutrisinya tetap optimal.
              </Text>
              <View style={s.reminderFooter}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                  activeOpacity={0.8}>
                  <Text style={s.reminderLink}>Lihat Semua ({urgentCount})</Text>
                  <MaterialIcons name="arrow-forward" size={14} color={C.error} />
                </TouchableOpacity>
                <Text style={s.reminderSave}>Hemat ±Rp 32.000</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── SECTION 2: Quick Input & Category Presets ── */}
        

        {/* ── SECTION 3: Search & Filter ── */}
        <View style={s.section}>
          {/* Search bar */}
          <View style={s.searchWrap}>
            <Feather name="search" size={18} color={C.outline} />
            <TextInput
              style={s.searchInput}
              placeholder="Cari bahan makanan..."
              placeholderTextColor={C.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity activeOpacity={0.7}>
              <MaterialIcons name="tune" size={20} color={C.outline} />
            </TouchableOpacity>
          </View>

        </View>

        {/* ── SECTION 4: Stok Tersedia ── */}
        <View style={s.section}>
          <View style={s.listHeader}>
            <Text style={s.sectionTitle}>Stok Tersedia</Text>
            
          </View>

          <View style={{ gap: 10, marginTop: 10 }}>
            {loading ? (
              <View style={s.empty}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={s.emptySub}>Memuat data bahan...</Text>
              </View>
            ) : filtered.length === 0 ? (
              <View style={s.empty}>
                <MaterialCommunityIcons name="basket-outline" size={52} color={C.outlineVariant} />
                <Text style={s.emptyTitle}>Tidak ada bahan</Text>
                <Text style={s.emptySub}>Coba ubah filter atau tambah bahan baru</Text>
              </View>
            ) : (
              filtered.map(item => (
                <IngredientCard
                  key={item.id}
                  item={item}
                  onUse={handleUse}
                  onDiscard={handleDiscard}
                />
              ))
            )}
          </View>
        </View>

        {/* ── SECTION 5: Storage Tips ── */}
        <View style={s.section}>
          <StorageTipCard
            tip={currentTip}
            onNext={() => setTipIndex((tipIndex + 1) % STORAGE_TIPS.length)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.surfaceContainer,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: C.primaryContainer + '44',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.primaryContainer,
    borderWidth: 2, borderColor: C.surfaceLowest,
  },
  greeting:  { fontSize: 11, color: C.onSurfaceVariant, fontWeight: '500' },
  brandRow:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  brandName: { fontSize: 20, fontWeight: '800', color: C.primary, letterSpacing: -0.4 },
  bellBtn:   { padding: 8, borderRadius: 99, position: 'relative' },
  bellBadge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.error,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2, borderColor: C.surface,
  },
  bellBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // ── Smart Reminder ──
  reminderCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: C.errorContainer + 'CC',
    borderRadius: 16, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: C.error + '33',
    overflow: 'hidden',
  },
  reminderIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.error + '26',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  reminderTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderChip: { fontSize: 10, fontWeight: '800', color: C.error, letterSpacing: 0.8 },
  reminderBadge: {
    backgroundColor: C.error + '1A', borderRadius: 99,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  reminderBadgeText: { fontSize: 10, fontWeight: '700', color: C.error },
  reminderTitle: { fontSize: 14, fontWeight: '800', color: C.onSurface, marginTop: 2, lineHeight: 20 },
  reminderSub:   { fontSize: 12, color: C.onSurfaceVariant, lineHeight: 17, marginTop: 3 },
  reminderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  reminderLink: { fontSize: 12, fontWeight: '700', color: C.error },
  reminderSave: { fontSize: 11, color: C.outline, fontWeight: '500' },

  // ── Sections ──
  section:       { marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: C.onSurface },
  autoLabel:     { fontSize: 12, fontWeight: '700', color: C.primary },

  // ── Add Button ──
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.primary, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
  addBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtnIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 16, fontWeight: '700', color: C.onPrimary, letterSpacing: 0.2 },

  // ── Info box ──
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.secondaryContainer + '4D',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: C.secondaryContainer + '99',
    marginTop: 10,
  },
  infoText: { flex: 1, fontSize: 12, color: C.onSecondaryContainer, lineHeight: 17 },

  // ── Search ──
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surfaceLowest, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    borderWidth: 1.5, borderColor: C.outlineVariant,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.onSurface, padding: 0 },

  // ── List header ──
  listHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortLabel: { fontSize: 12, color: C.outline },
  sortValue: { fontSize: 12, fontWeight: '700', color: C.onSurface },

  // ── Empty ──
  empty:      { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptySub:   { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
