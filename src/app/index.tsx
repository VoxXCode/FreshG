/**
 * FreshG – Home / Beranda Screen
 * Faithful React Native translation of the HTML reference design.
 */
import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  FRESHNESS_CONFIG,
  STORAGE_TIPS,
  getFreshnessStatus,
  getDaysUntilExpiry,
  getFreshnessPercent,
} from '@/types/ingredient';
import { BottomTabInset } from '@/constants/theme';
import { useIngredients } from '@/hooks/use-ingredients';
import { ErrorState } from '@/components/ui/error-state';
import { IngredientListSkeleton } from '@/components/ui/loading-skeleton';
import { useAppTheme } from '@/context/theme-context';
import type { FreshGColors } from '@/constants/theme-colors';

// ─── Category icon map ────────────────────────────────────────────────────────

type MCName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

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

// ─── Freshness Progress Bar ───────────────────────────────────────────────────

function FreshnessBar({ percent, status }: { percent: number; status: FreshnessStatus }) {
  const { colors: C, isDark } = useAppTheme();
  const cfg = FRESHNESS_CONFIG[status];
  const barColor = isDark
    ? status === 'fresh' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'
    : cfg.barColor;
  const textColor = isDark
    ? status === 'fresh' ? '#34d399' : status === 'warning' ? '#fbbf24' : '#f87171'
    : cfg.color;

  const freshnessLabel =
    status === 'fresh'    ? 'Kondisi Sangat Segar' :
    status === 'warning'  ? 'Perlu Perhatian'       :
    status === 'expiring' ? 'Masa Simpan Kritis'    :
    'Kedaluwarsa';

  return (
    <View style={pb.wrap}>
      <View style={pb.labelRow}>
        <Text style={[pb.label, { color: textColor }]}>{freshnessLabel}</Text>
        <Text style={[pb.pct, { color: textColor }]}>Sisa {percent}%</Text>
      </View>
      <View style={[pb.track, { backgroundColor: C.surfaceContainer }]}>
        <View style={[pb.fill, { width: `${percent}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  wrap:     { marginTop: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label:    { fontSize: 11, fontWeight: '700' },
  pct:      { fontSize: 11, fontWeight: '700' },
  track:    { height: 6, borderRadius: 99, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 99 },
});

// ─── Storage Location Pill ────────────────────────────────────────────────────

function StoragePill({ location }: { location: StorageLocation }) {
  const { isDark } = useAppTheme();
  const base = STORAGE_ICON[location] || { icon: 'cube-outline', bg: '#f3f4f6', color: '#6b7280' };
  const darkStorageStyles: Partial<Record<StorageLocation, { bg: string; color: string }>> = {
    'Kulkas':     { bg: '#082f49', color: '#38bdf8' },
    'Freezer':    { bg: '#1e1b4b', color: '#818cf8' },
    'Suhu Ruang': { bg: '#451a03', color: '#fbbf24' },
    'Lemari':     { bg: '#1e293b', color: '#94a3b8' },
  };
  const darkOverride = isDark ? darkStorageStyles[location] : undefined;
  const style = darkOverride ? { ...base, ...darkOverride } : base;

  return (
    <View style={[pill.wrap, { backgroundColor: style.bg }]}>
      <Ionicons name={style.icon as any} size={11} color={style.color} />
      <Text style={[pill.text, { color: style.color }]}>{location}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  text:  { fontSize: 11, fontWeight: '700' },
});

// ─── Freshness Badge ──────────────────────────────────────────────────────────

function FreshnessBadge({ status, daysLeft }: { status: FreshnessStatus; daysLeft: number }) {
  const { isDark } = useAppTheme();
  const cfg = FRESHNESS_CONFIG[status];
  const label =
    daysLeft < 0   ? 'Kedaluwarsa'             :
    daysLeft === 0 ? `${cfg.label} - Hari ini`  :
    `${cfg.label} - ${daysLeft} Hari`;

  const badgeColor = isDark
    ? status === 'fresh' ? '#34d399' : status === 'warning' ? '#fbbf24' : '#f87171'
    : cfg.color;
  const badgeBg = isDark
    ? status === 'fresh' ? 'rgba(52,211,153,0.18)' : status === 'warning' ? 'rgba(251,191,36,0.18)' : 'rgba(248,113,113,0.2)'
    : cfg.bgColor;

  return (
    <View style={[fb.wrap, { backgroundColor: badgeBg, borderColor: badgeColor + '40' }]}>
      <View style={[fb.dot, { backgroundColor: badgeColor }]} />
      <Text style={[fb.text, { color: badgeColor }]}>{label}</Text>
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
  const { colors: C, isDark } = useAppTheme();
  const status   = getFreshnessStatus(item.expiryDate);
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  const percent  = getFreshnessPercent(daysLeft, item.totalDays);
  const cfg      = FRESHNESS_CONFIG[status];
  const isExpiring = status === 'expiring' || status === 'expired';

  const darkCategoryBgs: Record<Category, string> = {
    'Sayuran':         '#064e3b',
    'Buah-buahan':     '#831843',
    'Bumbu Dapur':     '#713f12',
    'Daging & Olahan': '#7f1d1d',
    'Susu & Telur':    '#4c1d95',
    'Herbal':          '#065f46',
    'Kering':          '#78350f',
  };
  const catBg = isDark ? (darkCategoryBgs[item.category] || '#1e293b') : CATEGORY_BG[item.category];
  const iconColor = isDark
    ? status === 'fresh' ? '#34d399' : status === 'warning' ? '#fbbf24' : '#f87171'
    : cfg.color;

  return (
    <View style={[
      ic.card,
      {
        backgroundColor: C.surfaceLowest,
        borderColor: isExpiring ? (C.error + (isDark ? '66' : '33')) : (C.outlineVariant + (isDark ? '40' : '99')),
      },
    ]}>
      {/* Top row */}
      <View style={ic.topRow}>
        {/* Icon */}
        <View style={[ic.iconWrap, { backgroundColor: catBg }]}>
          <MaterialCommunityIcons
            name={CATEGORY_MC[item.category]}
            size={24}
            color={iconColor}
          />
        </View>

        {/* Name + meta */}
        <View style={{ flex: 1 }}>
          <Text style={[ic.name, { color: C.onSurface }]} numberOfLines={1}>{item.name}</Text>
          <View style={ic.metaRow}>
            <StoragePill location={item.storageLocation} />
            {item.quantity && (
              <Text style={[ic.quantity, { color: C.outline }]}>{item.quantity}</Text>
            )}
          </View>
        </View>

        {/* Badge */}
        <FreshnessBadge status={status} daysLeft={daysLeft} />
      </View>

      {/* Progress bar */}
      <FreshnessBar percent={percent} status={status} />

      {/* Divider */}
      <View style={[ic.divider, { backgroundColor: C.surfaceContainer }]} />

      {/* Quick Actions */}
      <View style={ic.actions}>
        <TouchableOpacity
          style={[ic.btn, { borderWidth: 1, borderColor: C.error + '44' }]}
          onPress={() => onDiscard(item.id)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="delete" size={15} color={C.error} />
          <Text style={[ic.btnTxt, { color: C.error }]}>Buang</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[ic.btn, { backgroundColor: C.secondaryContainer }]}
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
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  name: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  quantity: { fontSize: 11, fontWeight: '500' },
  divider: { height: 1, marginVertical: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  btnTxt: { fontSize: 12, fontWeight: '700' },
});

// ─── Filter Pill ──────────────────────────────────────────────────────────────

type FilterPillProps = {
  label: string;
  isActive?: boolean;
  isUrgent?: boolean;
  onPress: () => void;
};
function FilterPill({ label, isActive, isUrgent, onPress }: FilterPillProps) {
  const { colors: C, isDark } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        fp.pill,
        {
          backgroundColor: isActive
            ? C.primary
            : isUrgent
              ? (isDark ? '#450a0a' : C.errorContainer + 'CC')
              : C.surfaceLowest,
          borderColor: isActive
            ? C.primary
            : isUrgent
              ? (isDark ? '#7f1d1d' : C.error + '4D')
              : C.outlineVariant,
        }
      ]}
    >
      {isUrgent && <View style={[fp.urgentDot, { backgroundColor: C.error }]} />}
      <Text style={[
        fp.text,
        {
          color: isActive
            ? C.onPrimary
            : isUrgent
              ? (isDark ? '#fecaca' : C.onErrorContainer)
              : C.onSurfaceVariant,
          fontWeight: isUrgent || isActive ? '700' : '600',
        }
      ]}>
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
    marginRight: 8,
  },
  urgentDot: { width: 6, height: 6, borderRadius: 3 },
  text:      { fontSize: 12 },
});

// ─── Storage Tip Card ─────────────────────────────────────────────────────────

function StorageTipCard({ tip, onNext }: {
  tip: typeof STORAGE_TIPS[number];
  onNext: () => void;
}) {
  const { colors: C, isDark } = useAppTheme();
  return (
    <View style={[
      st.card,
      {
        backgroundColor: isDark ? C.surfaceLowest : C.tertiaryFixed + '66',
        borderColor: isDark ? C.surfaceContainerHigh : C.tertiaryFixedDim + '99',
      }
    ]}>
      <View style={st.iconCol}>
        <View style={[st.iconWrap, { backgroundColor: isDark ? C.tertiaryContainer + '66' : C.tertiaryContainer + '33' }]}>
          <MaterialCommunityIcons name={tip.icon as any} size={20} color={C.tertiary} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={st.topRow}>
          <Text style={[st.label, { color: C.tertiary }]}>Tips Penyimpanan Hari Ini</Text>
          <MaterialCommunityIcons name="bookmark-plus-outline" size={18} color={C.tertiary} />
        </View>
        <Text style={[st.text, { color: C.onSurface }]}>{tip.tip}</Text>
        <View style={st.footer}>
          <TouchableOpacity style={st.nextBtn} onPress={onNext} activeOpacity={0.8}>
            <Text style={[st.nextTxt, { color: C.tertiary }]}>Tips Lainnya</Text>
            <Feather name="chevron-right" size={13} color={C.tertiary} />
          </TouchableOpacity>
          <Text style={[st.category, { color: C.onSurfaceVariant }]}>Kategori: {tip.category}</Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: 12,
    borderRadius: 16, padding: 14,
    borderWidth: 1,
  },
  iconCol:  { paddingTop: 2 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  label:  { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  text:   { fontSize: 13, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  nextBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  nextTxt:  { fontSize: 12, fontWeight: '700' },
  category: { fontSize: 11, fontWeight: '500' },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────

type FilterType = Category | StorageLocation | 'Semua' | 'Kritis';

export default function HomeScreen() {
  const { isDark, colors: C } = useAppTheme();
  const s = useMemo(() => createStyles(C), [C]);
  const { data, loading, refreshing, error, isRetrying, retry, refresh } = useIngredients();
  // Perubahan status lokal (Gunakan / Buang) disimpan terpisah dari data server
  const [statusOverrides, setStatusOverrides] = useState<Record<string, IngredientStatus>>({});
  const ingredients = useMemo<Ingredient[]>(
    () => (data ?? []).map(i => (statusOverrides[i.id] ? { ...i, status: statusOverrides[i.id] } : i)),
    [data, statusOverrides],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Semua');
  const [tipIndex, setTipIndex] = useState(0);

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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={C.surface} />

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        {/* Banner Error Kompak jika data lama masih tersedia namun refresh gagal */}
        {error && data && (
          <View style={{ marginBottom: 10 }}>
            <ErrorState
              error={error}
              onRetry={retry}
              isRetrying={isRetrying}
              compact
            />
          </View>
        )}

        {/* Jika terjadi Error Total saat memuat data awal */}
        {error && !data ? (
          <View style={[s.section, { paddingVertical: 40 }]}>
            <ErrorState
              error={error}
              onRetry={retry}
              isRetrying={isRetrying}
            />
          </View>
        ) : (
          <>
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
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.reminderLink}>Lihat Semua ({urgentCount})</Text>
                      <MaterialIcons name="arrow-forward" size={14} color={C.error} />
                    </TouchableOpacity>
                    <Text style={s.reminderSave}>Hemat ±Rp 32.000</Text>
                  </View>
                </View>
              </View>
            )}

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

              {/* Horizontal filter pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 10, paddingBottom: 2 }}
              >
                {filterOptions.map(opt => (
                  <FilterPill
                    key={opt.value}
                    label={opt.label}
                    isActive={activeFilter === opt.value}
                    isUrgent={opt.value === 'Kritis'}
                    onPress={() => setActiveFilter(opt.value)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* ── SECTION 4: Stok Tersedia ── */}
            <View style={s.section}>
              <View style={s.listHeader}>
                <Text style={s.sectionTitle}>Stok Tersedia</Text>
              </View>

              <View style={{ gap: 10, marginTop: 10 }}>
                {loading && !data ? (
                  <IngredientListSkeleton count={4} />
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
          </>
        )}
      </ScrollView>
    </View>
  );
}


// ─── Main Styles ──────────────────────────────────────────────────────────────

const createStyles = (C: FreshGColors) => StyleSheet.create({
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
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.onSurface },
  emptySub:   { fontSize: 14, color: C.outline, textAlign: 'center' },
});
