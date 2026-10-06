/**
 * FreshG – Stok Bahan Screen
 * Faithful React Native translation of the HTML reference design.
 *
 * Data bahan diambil lewat useIngredients():
 * src/data/server/ingredients.json → IngredientDTO → toIngredient() → Ingredient
 */
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabInset } from '@/constants/theme';
import { useIngredients } from '@/hooks/use-ingredients';
import {
  type Category,
  type Ingredient,
  type StorageLocation,
  getDaysUntilExpiry,
  getFreshnessPercent,
} from '@/types/ingredient';
import { daysSince } from '@/utils/format';

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
};

type MCName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

const CATEGORY_ICON: Record<Category, MCName> = {
  'Sayuran':         'sprout',
  'Buah-buahan':     'fruit-grapes',
  'Bumbu Dapur':     'chili-mild',
  'Daging & Olahan': 'food-steak',
  'Susu & Telur':    'egg',
  'Herbal':          'leaf',
  'Kering':          'grain',
};

// ─── Timeline group config ────────────────────────────────────────────────────

type GroupKey = 'kritis' | 'perhatian' | 'aman';

function getGroup(daysLeft: number): GroupKey {
  if (daysLeft <= 2) return 'kritis';
  if (daysLeft <= 4) return 'perhatian';
  return 'aman';
}

const GROUPS: Record<GroupKey, {
  title: string;
  markerColor: string;
  titleColor: string;
  badgeBg: string;
  badgeColor: string;
  cardBorder: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  statusLabel: string;
  statusBg: string;
  statusColor: string;
  showStatusDot: boolean;
  progressIcon: MIName;
  progressColor: string;
  barColor: string;
}> = {
  kritis: {
    title: 'Habis ≤ 2 Hari - Kritis',
    markerColor: C.error, titleColor: C.error,
    badgeBg: C.errorContainer, badgeColor: C.onErrorContainer,
    cardBorder: C.error + '4D',
    iconBg: C.errorContainer + '66', iconBorder: C.errorContainer, iconColor: C.error,
    statusLabel: 'Segera Masak', statusBg: C.errorContainer, statusColor: C.onErrorContainer, showStatusDot: true,
    progressIcon: 'alarm', progressColor: C.error, barColor: C.error,
  },
  perhatian: {
    title: 'Habis 3-4 Hari - Perhatian',
    markerColor: C.tertiaryContainer, titleColor: C.tertiary,
    badgeBg: C.tertiaryFixed, badgeColor: C.onTertiaryContainer,
    cardBorder: C.outlineVariant + '80',
    iconBg: C.surfaceContainer, iconBorder: C.surfaceContainerHigh, iconColor: C.secondary,
    statusLabel: 'Gunakan Segera', statusBg: C.tertiaryFixed, statusColor: C.onTertiaryContainer, showStatusDot: false,
    progressIcon: 'hourglass-empty', progressColor: C.tertiary, barColor: C.tertiaryContainer,
  },
  aman: {
    title: 'Awet ≥ 5 Hari - Aman',
    markerColor: C.primaryContainer, titleColor: C.primary,
    badgeBg: C.secondaryContainer, badgeColor: C.onSecondaryContainer,
    cardBorder: C.outlineVariant + '66',
    iconBg: C.surfaceContainerLow, iconBorder: C.surfaceContainer, iconColor: C.primary,
    statusLabel: 'Kondisi Baik', statusBg: C.secondaryContainer, statusColor: C.onSecondaryContainer, showStatusDot: false,
    progressIcon: 'check-circle', progressColor: C.primary, barColor: C.primaryContainer,
  },
};

const GROUP_ORDER: GroupKey[] = ['kritis', 'perhatian', 'aman'];

const ZONES: { value: StorageLocation; icon: React.ReactNode; iconActive: React.ReactNode }[] = [
  {
    value: 'Kulkas',
    icon: <MaterialIcons name="kitchen" size={14} color={C.onSurfaceVariant} />,
    iconActive: <MaterialIcons name="kitchen" size={14} color={C.primary} />,
  },
  {
    value: 'Freezer',
    icon: <MaterialIcons name="ac-unit" size={14} color={C.onSurfaceVariant} />,
    iconActive: <MaterialIcons name="ac-unit" size={14} color={C.primary} />,
  },
  {
    value: 'Suhu Ruang',
    icon: <MaterialCommunityIcons name="storefront-outline" size={14} color={C.onSurfaceVariant} />,
    iconActive: <MaterialCommunityIcons name="storefront-outline" size={14} color={C.primary} />,
  },
];

// ─── Shared Components ────────────────────────────────────────────────────────

function TopAppBar({ count }: { count: number }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: C.surface }}>
      <View style={appBar.container}>
        <View style={appBar.left}>
          <View style={appBar.avatarWrap}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/80?img=47' }}
              style={appBar.avatar}
              contentFit="cover"
            />
          </View>
          <View>
            <Text style={appBar.title}>FreshG</Text>
            <View style={appBar.subtitleRow}>
              <View style={appBar.dot} />
              <Text style={appBar.subtitle}>{count} Bahan Tersimpan</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const appBar = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.surfaceContainer,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
    borderWidth: 2, borderColor: C.primary + '33', backgroundColor: C.surfaceContainer,
  },
  avatar: { width: '100%', height: '100%' },
  title: { fontSize: 20, fontWeight: '800', color: C.primary, letterSpacing: -0.4 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primaryContainer },
  subtitle: { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant },
});

// ─── Location Badge ───────────────────────────────────────────────────────────

function LocationBadge({ location }: { location: StorageLocation }) {
  if (location === 'Freezer') {
    return (
      <View style={[s.itemLocBadge, { backgroundColor: C.surfaceContainerHigh }]}>
        <MaterialIcons name="ac-unit" size={10} color={C.onSecondaryContainer} />
        <Text style={[s.itemLocTxt, { color: C.onSecondaryContainer }]}>Freezer</Text>
      </View>
    );
  }
  if (location === 'Suhu Ruang') {
    return (
      <View style={[s.itemLocBadge, { backgroundColor: C.tertiaryFixed + '80' }]}>
        <Text style={[s.itemLocTxt, { color: C.onTertiaryContainer }]}>Suhu Ruang (Pantry)</Text>
      </View>
    );
  }
  return (
    <View style={s.itemLocBadge}><Text style={s.itemLocTxt}>{location}</Text></View>
  );
}

// ─── Stock Item Card ──────────────────────────────────────────────────────────

function StockItemCard({ item, group, isFirst }: { item: Ingredient; group: GroupKey; isFirst: boolean }) {
  const g = GROUPS[group];
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  const percent = getFreshnessPercent(daysLeft, item.totalDays);
  const metaRight = item.note ?? `Ditambahkan: ${daysSince(item.addedDate)} hari lalu`;
  const isKritis = group === 'kritis';

  return (
    <View style={[s.itemCard, { borderColor: g.cardBorder }, !isFirst && { marginTop: 10 }]}>
      <View style={s.itemTop}>
        <View style={[s.itemIconWrap, { backgroundColor: g.iconBg, borderColor: g.iconBorder }]}>
          <MaterialCommunityIcons name={CATEGORY_ICON[item.category]} size={20} color={g.iconColor} />
        </View>
        <View style={s.itemDetails}>
          <View style={s.itemTitleRow}>
            <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
            <LocationBadge location={item.storageLocation} />
            <View style={[s.itemStatusBadge, { backgroundColor: g.statusBg }]}>
              {g.showStatusDot && <View style={[s.statusDot, { backgroundColor: C.error }]} />}
              <Text style={[s.itemStatusTxt, { color: g.statusColor }]}>{g.statusLabel}</Text>
            </View>
          </View>
          <Text style={s.itemMeta}>
            Jumlah: <Text style={s.itemMetaBold}>{item.quantity ?? '-'}</Text>  •  {metaRight}
          </Text>
        </View>
      </View>
      <View style={s.itemBottom}>
        <View style={s.progressCol}>
          <View style={s.progressRow}>
            <MaterialIcons name={g.progressIcon} size={12} color={g.progressColor} />
            <Text style={[s.progressLabel, { color: g.progressColor }]}>
              {daysLeft < 0 ? 'Kedaluwarsa' : `Sisa ${daysLeft} Hari`}
            </Text>
          </View>
          <View style={s.progressBarWrap}>
            <View style={[s.progressBar, { width: `${percent}%`, backgroundColor: g.barColor }]} />
          </View>
          <Text style={s.progressSub}>{percent}% masa segar</Text>
        </View>
        <View style={s.actionRow}>
          <TouchableOpacity style={isKritis ? s.btnPrimary : s.btnSecondary} activeOpacity={0.8}>
            <MaterialIcons name="soup-kitchen" size={14} color={isKritis ? C.onSecondaryContainer : C.onSurface} />
            <Text style={isKritis ? s.btnPrimaryTxt : s.btnSecondaryTxt}>Gunakan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnIcon} activeOpacity={0.8}>
            <MaterialIcons name="edit" size={14} color={C.onSurfaceVariant} />
          </TouchableOpacity>
          {isKritis && (
            <TouchableOpacity style={s.btnIconDanger} activeOpacity={0.8}>
              <MaterialIcons name="delete-outline" size={14} color={C.error} />
            </TouchableOpacity>
          )}
          {group === 'perhatian' && item.storageLocation !== 'Freezer' && (
            <TouchableOpacity style={s.btnIcon} activeOpacity={0.8}>
              <MaterialIcons name="ac-unit" size={14} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Zone = 'Semua' | StorageLocation;

export default function StokScreen() {
  const [activeZone, setActiveZone] = useState<Zone>('Semua');
  const { data, loading } = useIngredients();

  const active = useMemo(() => (data ?? []).filter(i => i.status === 'active'), [data]);

  const zoneCounts = useMemo(() => {
    const counts: Partial<Record<StorageLocation, number>> = {};
    for (const i of active) counts[i.storageLocation] = (counts[i.storageLocation] ?? 0) + 1;
    return counts;
  }, [active]);

  const visible = useMemo(
    () => (activeZone === 'Semua' ? active : active.filter(i => i.storageLocation === activeZone))
      .slice()
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()),
    [active, activeZone],
  );

  const grouped = useMemo(() => {
    const result: Record<GroupKey, Ingredient[]> = { kritis: [], perhatian: [], aman: [] };
    for (const item of visible) result[getGroup(getDaysUntilExpiry(item.expiryDate))].push(item);
    return result;
  }, [visible]);

  // Rekomendasi: 2 bahan yang paling cepat habis
  const suggestion = useMemo(() => active
    .slice()
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
    .slice(0, 2), [active]);

  const visibleGroups = GROUP_ORDER.filter(k => grouped[k].length > 0);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <TopAppBar count={active.length} />

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Context & Title */}
        <View style={s.pageContext}>
          <Text style={s.pageTitle}>Inventaris Stok Bahan</Text>
          <Text style={s.pageSubtitle}>
            Pantau batas kesegaran dan kelola zonasi penyimpanan dapur secara presisi.
          </Text>
        </View>

        {/* AI Assistant Card */}
        {suggestion.length > 0 && (
          <View style={s.aiCard}>
            <View style={s.aiIconWrap}>
              <MaterialIcons name="auto-awesome" size={18} color={C.onPrimary} />
            </View>
            <View style={s.aiTextCol}>
              <Text style={s.aiTitle}>Rekomendasi Menu dari Bahan Segera Masak</Text>
              <Text style={s.aiSub}>
                Padukan{' '}
                {suggestion.map((item, idx) => (
                  <Text key={item.id}>
                    {idx > 0 && ' dan '}
                    <Text style={{ fontWeight: '700' }}>{item.name}</Text>
                  </Text>
                ))}
                {' '}menjadi menu sehat malam ini untuk mencegah basi!
              </Text>
            </View>
            <TouchableOpacity style={s.aiBtn} activeOpacity={0.8}>
              <Text style={s.aiBtnTxt}>Lihat Resep Cepat</Text>
              <MaterialIcons name="arrow-forward" size={14} color={C.onPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Zonasi Penyimpanan (Segmented Control) */}
        <View style={s.zoneSection}>
          <View style={s.zoneHeader}>
            <Text style={s.zoneTitle}>Zona Penyimpanan</Text>
            <Text style={s.zoneActive}>
              {activeZone === 'Semua' ? 'Semua Tampil' : activeZone} ({visible.length})
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.zoneScroll}>
            <View style={s.segmentedBar}>
              {ZONES.map(zone => {
                const isActive = activeZone === zone.value;
                return (
                  <TouchableOpacity
                    key={zone.value}
                    style={isActive ? s.segmentBtnActive : s.segmentBtn}
                    activeOpacity={0.8}
                    onPress={() => setActiveZone(isActive ? 'Semua' : zone.value)}
                  >
                    {isActive ? zone.iconActive : zone.icon}
                    <Text style={isActive ? s.segmentTxtActive : s.segmentTxt}>{zone.value}</Text>
                    <View style={isActive ? s.segmentBadgeActive : s.segmentBadge}>
                      <Text style={isActive ? s.segmentBadgeTxtActive : s.segmentBadgeTxt}>
                        {zoneCounts[zone.value] ?? 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Sort Filter */}
          <View style={s.sortWrap}>
            <View style={s.sortInner}>
              <MaterialIcons name="swap-vert" size={16} color={C.outline} />
              <Text style={s.sortLabel}>Urutkan:</Text>
              <View style={s.sortSelect}>
                <Text style={s.sortSelectTxt}>Masa Simpan Terdekat</Text>
                <MaterialIcons name="expand-more" size={16} color={C.onSurfaceVariant} />
              </View>
            </View>
          </View>
        </View>

        {/* Chronological Timeline */}
        {loading ? (
          <View style={s.loading}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <View style={s.timelineSection}>
            {/* Timeline track line */}
            <View style={s.timelineTrack} />

            {visibleGroups.map((key, groupIdx) => {
              const g = GROUPS[key];
              const items = grouped[key];
              return (
                <View key={key} style={[s.timeGroup, groupIdx > 0 && { marginTop: 16 }]}>
                  <View style={s.groupMarkerWrap}>
                    <View style={[s.groupMarker, { backgroundColor: g.markerColor }]}>
                      <View style={s.groupMarkerInner} />
                    </View>
                    <Text style={[s.groupTitle, { color: g.titleColor }]}>{g.title}</Text>
                    <View style={[s.groupBadge, { backgroundColor: g.badgeBg }]}>
                      <Text style={[s.groupBadgeTxt, { color: g.badgeColor }]}>{items.length} Item</Text>
                    </View>
                  </View>

                  {items.map((item, idx) => (
                    <StockItemCard key={item.id} item={item} group={key} isFirst={idx === 0} />
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={s.fab} activeOpacity={0.8}>
        <MaterialIcons name="add" size={20} color={C.onPrimary} />
        <Text style={s.fabTxt}>Tambah Stok Cepat</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  loading: { paddingVertical: 40, alignItems: 'center' },

  // Context
  pageContext: { marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: C.onSurface, letterSpacing: -0.2 },
  pageSubtitle: { fontSize: 14, color: C.onSurfaceVariant, marginTop: 4, lineHeight: 22 },

  // AI Card
  aiCard: {
    backgroundColor: C.surfaceLowest,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.primary + '33',
    flexDirection: 'column', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    marginBottom: 20,
  },
  aiIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 14, left: 14 },
  aiTextCol: { marginLeft: 42 },
  aiTitle: { fontSize: 13, fontWeight: '700', color: C.onSurface, lineHeight: 18 },
  aiSub: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 4, lineHeight: 20 },
  aiBtn: { backgroundColor: C.primary, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  aiBtnTxt: { fontSize: 11, fontWeight: '700', color: C.onPrimary },

  // Zone
  zoneSection: { marginBottom: 16 },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  zoneTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  zoneActive: { fontSize: 11, fontWeight: '700', color: C.primary },
  zoneScroll: { paddingBottom: 4 },
  segmentedBar: { flexDirection: 'row', backgroundColor: C.surfaceContainerHigh + '99', borderRadius: 12, padding: 4, gap: 4 },
  segmentBtnActive: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surfaceLowest, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 1, elevation: 1 },
  segmentBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  segmentTxtActive: { fontSize: 13, fontWeight: '700', color: C.primary },
  segmentTxt: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
  segmentBadgeActive: { backgroundColor: C.primary + '1A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
  segmentBadgeTxtActive: { fontSize: 10, fontWeight: '800', color: C.primary },
  segmentBadge: { backgroundColor: C.surfaceContainerHighest, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99 },
  segmentBadgeTxt: { fontSize: 10, fontWeight: '800', color: C.onSurfaceVariant },

  // Sort
  sortWrap: { alignItems: 'flex-end', marginTop: 12 },
  sortInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortLabel: { fontSize: 11, fontWeight: '600', color: C.outline },
  sortSelect: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceLowest, borderWidth: 1, borderColor: C.outlineVariant, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  sortSelectTxt: { fontSize: 11, fontWeight: '600', color: C.onSurface },

  // Timeline
  timelineSection: { position: 'relative', paddingLeft: 16, marginTop: 16 },
  timelineTrack: { position: 'absolute', left: 4, top: 12, bottom: 12, width: 2, backgroundColor: C.outlineVariant + '66' },
  
  timeGroup: {},
  groupMarkerWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: -19, marginBottom: 8 },
  groupMarker: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.background, alignItems: 'center', justifyContent: 'center' },
  groupMarkerInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  groupTitle: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  groupBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  groupBadgeTxt: { fontSize: 11, fontWeight: '800' },

  // Cards
  itemCard: { backgroundColor: C.surfaceLowest, borderRadius: 16, padding: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  itemTop: { flexDirection: 'row', gap: 12 },
  itemIconWrap: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  itemDetails: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  itemName: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  itemLocBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceContainerHighest, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  itemLocTxt: { fontSize: 11, fontWeight: '700', color: C.primary },
  itemStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  itemStatusTxt: { fontSize: 11, fontWeight: '800' },
  itemMeta: { fontSize: 11, color: C.onSurfaceVariant, marginTop: 4 },
  itemMetaBold: { fontWeight: '700', color: C.onSurface, fontSize: 12 },

  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.surfaceContainerHigh + '99', marginTop: 10, paddingTop: 10 },
  progressCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressLabel: { fontSize: 11, fontWeight: '800' },
  progressBarWrap: { width: 64, height: 6, backgroundColor: C.surfaceContainerHigh, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  progressSub: { fontSize: 11, color: C.outline },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.secondaryContainer, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  btnPrimaryTxt: { fontSize: 11, fontWeight: '800', color: C.onSecondaryContainer },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceContainer, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  btnSecondaryTxt: { fontSize: 11, fontWeight: '700', color: C.onSurface },
  btnIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  btnIconDanger: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.errorContainer + '66', alignItems: 'center', justifyContent: 'center' },

  // FAB
  fab: { position: 'absolute', bottom: BottomTabInset + 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryContainer, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 99, shadowColor: C.primaryContainer, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabTxt: { fontSize: 13, fontWeight: '700', color: C.onPrimary },
});
