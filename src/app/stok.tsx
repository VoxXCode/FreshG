/**
 * FreshG – Stok Bahan Screen
 * Faithful React Native translation of the HTML reference design.
 *
 * Data bahan diambil lewat useIngredients():
 * src/data/server/ingredients.json → IngredientDTO → toIngredient() → Ingredient
 */
import { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
  Dimensions,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BottomTabInset } from '@/constants/theme';
import { useIngredients } from '@/hooks/use-ingredients';
import { ApiStateView } from '@/components/ui/api-state-view';
import { OfflineBanner } from '@/components/ui/offline-banner';
import {
  type Category,
  type Ingredient,
  type StorageLocation,
  type IngredientStatus,
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
    cardBorder: C.outlineVariant + '80',
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

function TopAppBar({ urgentCount }: { urgentCount: number }) {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: C.surface }}>
      <View style={appBar.header}>
        <View style={appBar.headerLeft}>
          <View>
            <View style={appBar.brandRow}>
              <Text style={appBar.brandName}>FreshG</Text>
              <MaterialCommunityIcons name="leaf" size={18} color={C.primaryContainer} />
            </View>
          </View>
        </View>
        <TouchableOpacity style={appBar.bellBtn} activeOpacity={0.8}>
          <MaterialIcons name="notifications" size={24} color={C.onSurface} />
          {urgentCount > 0 && (
            <View style={appBar.bellBadge}>
              <Text style={appBar.bellBadgeText}>{urgentCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const appBar = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.surfaceContainer,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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

function StockItemCard({
  item,
  group,
  isFirst,
  onEdit,
  onDelete,
  onUse,
}: {
  item: Ingredient;
  group: GroupKey;
  isFirst: boolean;
  onEdit: (item: Ingredient) => void;
  onDelete: (item: Ingredient) => void;
  onUse: (item: Ingredient) => void;
}) {
  const g = GROUPS[group];
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  const percent = getFreshnessPercent(daysLeft, item.totalDays);
  const metaRight = item.note ?? `Ditambahkan: ${daysSince(item.addedDate)} hari lalu`;
  const isKritis = group === 'kritis';

  const moreBtnRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number }>({ top: 0, right: 16 });

  const handleOpenMenu = () => {
    if (moreBtnRef.current) {
      moreBtnRef.current.measureInWindow((x, y, width, height) => {
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        const menuHeight = 90;
        const right = Math.max(16, screenWidth - (x + width));
        const fitsBelow = y + height + menuHeight + 20 <= screenHeight;
        const top = fitsBelow ? y + height + 4 : Math.max(16, y - menuHeight - 4);

        setMenuCoords({ top, right });
        setMenuVisible(true);
      });
    } else {
      setMenuVisible(true);
    }
  };

  return (
    <View style={[s.itemCard, { borderColor: g.cardBorder }, !isFirst && { marginTop: 10 }]}>
      {/* Top row: Nama + Info & Menu Titik 3 */}
      <View style={s.itemTop}>
        <View style={s.itemDetails}>
          <View style={s.itemTitleRow}>
            <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
          </View>
          <Text style={s.itemMeta}>
            <Text style={s.itemMetaBold}>{item.quantity ?? '-'}</Text>  •  {metaRight}
          </Text>
        </View>

        {/* Tombol Titik 3 di Atas Kanan */}
        <TouchableOpacity
          ref={moreBtnRef}
          style={s.moreBtn}
          onPress={handleOpenMenu}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Menu aksi untuk ${item.name}`}
        >
          <MaterialIcons name="more-vert" size={20} color={C.outline} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={s.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[s.dropdownMenu, { top: menuCoords.top, right: menuCoords.right }]}>
            <TouchableOpacity
              style={s.dropdownItem}
              onPress={() => {
                setMenuVisible(false);
                onEdit(item);
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="edit" size={16} color={C.onSurfaceVariant} />
              <Text style={s.dropdownItemTxt}>Edit</Text>
            </TouchableOpacity>

            <View style={s.dropdownDivider} />

            <TouchableOpacity
              style={s.dropdownItem}
              onPress={() => {
                setMenuVisible(false);
                onDelete(item);
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete-outline" size={16} color={C.error} />
              <Text style={[s.dropdownItemTxt, { color: C.error }]}>Hapus</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Bottom row: Freshness & Tombol Gunakan */}
      <View style={s.itemBottom}>
        <View style={s.progressCol}>
          <View style={s.progressRow}>
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
          <TouchableOpacity
            style={isKritis ? s.btnPrimary : s.btnSecondary}
            activeOpacity={0.8}
            onPress={() => onUse(item)}
          >
            <MaterialIcons name="soup-kitchen" size={14} color={isKritis ? C.onSecondaryContainer : C.onSurface} />
            <Text style={isKritis ? s.btnPrimaryTxt : s.btnSecondaryTxt}>Gunakan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Zone = 'Semua' | StorageLocation;

export default function StokScreen() {
  const router = useRouter();
  const [activeZone, setActiveZone] = useState<Zone>('Semua');
  const { data, loading, isRetrying, error, refetch } = useIngredients();

  // Status & Edit Overrides lokal
  const [statusOverrides, setStatusOverrides] = useState<Record<string, IngredientStatus>>({});
  const [itemOverrides, setItemOverrides] = useState<Record<string, Partial<Ingredient>>>({});

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    quantity: string;
    storageLocation: StorageLocation;
  }>({
    name: '',
    quantity: '',
    storageLocation: 'Kulkas',
  });

  const ingredients = useMemo<Ingredient[]>(() => {
    return (data ?? []).map(i => {
      let item = { ...i };
      if (itemOverrides[i.id]) {
        item = { ...item, ...itemOverrides[i.id] };
      }
      if (statusOverrides[i.id]) {
        item = { ...item, status: statusOverrides[i.id] };
      }
      return item;
    });
  }, [data, itemOverrides, statusOverrides]);

  const active = useMemo(() => ingredients.filter(i => i.status === 'active'), [ingredients]);

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

  const visibleGroups = GROUP_ORDER.filter(k => grouped[k].length > 0);

  const handleOpenEdit = (item: Ingredient) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      quantity: item.quantity ?? '',
      storageLocation: item.storageLocation,
    });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    if (!editForm.name.trim()) {
      Alert.alert('Perhatian', 'Nama bahan tidak boleh kosong.');
      return;
    }
    setItemOverrides(prev => ({
      ...prev,
      [editingItem.id]: {
        name: editForm.name.trim(),
        quantity: editForm.quantity.trim() || undefined,
        storageLocation: editForm.storageLocation,
      },
    }));
    setEditingItem(null);
  };

  const handleDelete = (item: Ingredient) => {
    Alert.alert(
      'Hapus Bahan',
      `Apakah Anda yakin ingin menghapus "${item.name}" dari stok?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setStatusOverrides(prev => ({ ...prev, [item.id]: 'discarded' }));
          },
        },
      ],
    );
  };

  const handleUse = (item: Ingredient) => {
    Alert.alert(
      'Tandai Digunakan',
      `Bahan "${item.name}" sudah digunakan untuk memasak?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Digunakan',
          onPress: () => {
            setStatusOverrides(prev => ({ ...prev, [item.id]: 'used' }));
          },
        },
      ],
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <TopAppBar urgentCount={grouped['kritis'].length} />
      <OfflineBanner onRetryAll={refetch} />

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Context & Title */}
        <View style={s.pageContext}>
          
        </View>

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

        </View>

        {/* Chronological Timeline with ApiStateView (Sprint 05) */}
        <ApiStateView
          loading={loading}
          isRetrying={isRetrying}
          error={error}
          isEmpty={!loading && !error && visible.length === 0}
          emptyTitle="Belum Ada Bahan Makanan"
          emptyMessage="Stok bahan makanan untuk zona ini masih kosong."
          onRetry={refetch}
        >
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
                    <StockItemCard
                      key={item.id}
                      item={item}
                      group={key}
                      isFirst={idx === 0}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      onUse={handleUse}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        </ApiStateView>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editingItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.editModalBackdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditingItem(null)} />
          <View style={s.editModalContent}>
            <View style={s.editModalHeader}>
              <View style={s.editModalTitleRow}>
                <MaterialIcons name="edit" size={20} color={C.primary} />
                <Text style={s.editModalTitle}>Edit Bahan</Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditingItem(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={22} color={C.outline} />
              </TouchableOpacity>
            </View>

            <View style={s.editFormGroup}>
              <Text style={s.editLabel}>Nama Bahan</Text>
              <TextInput
                style={s.editInput}
                value={editForm.name}
                onChangeText={text => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Contoh: Bayam Hijau"
                placeholderTextColor={C.outline}
              />
            </View>

            <View style={s.editFormGroup}>
              <Text style={s.editLabel}>Jumlah / Takaran</Text>
              <TextInput
                style={s.editInput}
                value={editForm.quantity}
                onChangeText={text => setEditForm(prev => ({ ...prev, quantity: text }))}
                placeholder="Contoh: 2 Ikat"
                placeholderTextColor={C.outline}
              />
            </View>

            <View style={s.editFormGroup}>
              <Text style={s.editLabel}>Zona Penyimpanan</Text>
              <View style={s.editLocRow}>
                {(['Kulkas', 'Freezer', 'Suhu Ruang'] as StorageLocation[]).map(loc => {
                  const isSelected = editForm.storageLocation === loc;
                  return (
                    <TouchableOpacity
                      key={loc}
                      style={[s.editLocBtn, isSelected && s.editLocBtnActive]}
                      onPress={() => setEditForm(prev => ({ ...prev, storageLocation: loc }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.editLocTxt, isSelected && s.editLocTxtActive]}>{loc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={s.editActions}>
              <TouchableOpacity
                style={s.editCancelBtn}
                onPress={() => setEditingItem(null)}
                activeOpacity={0.8}
              >
                <Text style={s.editCancelTxt}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.editSaveBtn}
                onPress={handleSaveEdit}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check" size={16} color={C.onPrimary} />
                <Text style={s.editSaveTxt}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Floating Action Button (Sensor Kamera) */}
      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/scan')}
      >
        <MaterialIcons name="photo-camera" size={20} color={C.onPrimary} />
        <Text style={s.fabTxt}>Pindai / Scan Barcode</Text>
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
  itemCard: { backgroundColor: C.surfaceLowest, borderRadius: 16, padding: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  itemIconWrap: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  itemDetails: { flex: 1 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  itemName: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  moreBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: -4, marginRight: -4 },
  itemLocBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceContainerHighest, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  itemLocTxt: { fontSize: 11, fontWeight: '700', color: C.primary },
  itemStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  itemStatusTxt: { fontSize: 11, fontWeight: '800' },
  itemMeta: { fontSize: 11, color: C.onSurfaceVariant, marginTop: 4 },
  itemMetaBold: { fontWeight: '700', color: C.onSurface, fontSize: 12 },

  // Dropdown Popover
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  dropdownMenu: {
    position: 'absolute',
    width: 130,
    backgroundColor: C.surfaceLowest,
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.outlineVariant + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: C.onSurface,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: C.surfaceContainer,
    marginHorizontal: 8,
  },

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

  // Edit Modal
  editModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: C.surfaceLowest,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.outlineVariant + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainer,
  },
  editModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.onSurface,
    letterSpacing: -0.2,
  },
  editFormGroup: {
    marginBottom: 14,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurfaceVariant,
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.outlineVariant + '80',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: C.onSurface,
  },
  editLocRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editLocBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.outlineVariant + '60',
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editLocBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  editLocTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurfaceVariant,
  },
  editLocTxtActive: {
    color: C.onPrimary,
    fontWeight: '700',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.surfaceContainer,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: C.outline,
  },
  editSaveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: C.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  editSaveTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onPrimary,
  },

  // FAB
  fab: { position: 'absolute', bottom: BottomTabInset + 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryContainer, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 99, shadowColor: C.primaryContainer, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabTxt: { fontSize: 13, fontWeight: '700', color: C.onPrimary },
});
