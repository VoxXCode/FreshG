import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
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

interface FilterTab {
  id: string;
  label: string;
  type: 'all' | 'category' | 'location' | 'status';
}

const FILTER_TABS: FilterTab[] = [
  { id: 'all', label: 'Semua', type: 'all' },
  { id: 'Sayuran', label: 'Sayuran', type: 'category' },
  { id: 'Daging & Olahan', label: 'Daging', type: 'category' },
  { id: 'Buah-buahan', label: 'Buah', type: 'category' },
  { id: 'Susu & Telur', label: 'Susu & Telur', type: 'category' },
  { id: 'Bumbu Dapur', label: 'Bumbu', type: 'category' },
  { id: 'Kulkas', label: 'Kulkas', type: 'location' },
  { id: 'Freezer', label: 'Freezer', type: 'location' },
  { id: 'kritis', label: 'Kritis (≤2 Hari)', type: 'status' },
];

interface IngredientVisual {
  bg: string;
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor: string;
}

function getIngredientVisual(name: string, category: Category): IngredientVisual {
  const n = name.toLowerCase();

  if (n.includes('telur') || n.includes('egg') || n.includes('ceplok') || n.includes('dadar')) {
    return { bg: '#fef3c7', iconName: 'egg-fried', iconColor: '#d97706' };
  }
  if (n.includes('salad') || n.includes('selada')) {
    return { bg: '#dcfce7', iconName: 'bowl-mix', iconColor: '#16a34a' };
  }
  if (n.includes('roti') || n.includes('toast') || n.includes('bread')) {
    return { bg: '#ffedd5', iconName: 'bread-slice', iconColor: '#c2410c' };
  }
  if (n.includes('salmon') || n.includes('ikan') || n.includes('fish') || n.includes('tuna')) {
    return { bg: '#e0f2fe', iconName: 'fish', iconColor: '#0284c7' };
  }
  if (n.includes('sup') || n.includes('soup') || n.includes('soto') || n.includes('rawon') || n.includes('kuah')) {
    return { bg: '#fef9c3', iconName: 'pot-steam', iconColor: '#ca8a04' };
  }
  if (n.includes('ayam') || n.includes('chicken') || n.includes('bebek')) {
    return { bg: '#fed7aa', iconName: 'food-drumstick', iconColor: '#ea580c' };
  }
  if (n.includes('daging') || n.includes('steak') || n.includes('sapi') || n.includes('beef')) {
    return { bg: '#ffe4e6', iconName: 'food-steak', iconColor: '#e11d48' };
  }
  if (n.includes('jamur') || n.includes('mushroom')) {
    return { bg: '#f5d0fe', iconName: 'mushroom', iconColor: '#a21caf' };
  }
  if (n.includes('kue') || n.includes('cake') || n.includes('dessert') || n.includes('cokelat')) {
    return { bg: '#fce7f3', iconName: 'cupcake', iconColor: '#db2777' };
  }
  if (n.includes('bayam') || n.includes('kangkung') || n.includes('sawi') || n.includes('brokoli') || n.includes('wortel')) {
    return { bg: '#dcfce7', iconName: 'sprout', iconColor: '#15803d' };
  }
  if (n.includes('apel') || n.includes('pisang') || n.includes('jeruk') || n.includes('mangga') || n.includes('anggur')) {
    return { bg: '#fce7f3', iconName: 'food-apple', iconColor: '#e11d48' };
  }
  if (n.includes('susu') || n.includes('milk') || n.includes('keju') || n.includes('cheese') || n.includes('yogurt')) {
    return { bg: '#e0f2fe', iconName: 'cup-water', iconColor: '#0284c7' };
  }
  if (n.includes('bawang') || n.includes('cabai') || n.includes('chili') || n.includes('jahe') || n.includes('kunyit')) {
    return { bg: '#ffedd5', iconName: 'chili-mild', iconColor: '#ea580c' };
  }

  switch (category) {
    case 'Sayuran':
      return { bg: '#dcfce7', iconName: 'sprout', iconColor: '#16a34a' };
    case 'Buah-buahan':
      return { bg: '#fce7f3', iconName: 'food-apple', iconColor: '#db2777' };
    case 'Daging & Olahan':
      return { bg: '#ffe4e6', iconName: 'food-steak', iconColor: '#e11d48' };
    case 'Susu & Telur':
      return { bg: '#fef3c7', iconName: 'egg-fried', iconColor: '#d97706' };
    case 'Bumbu Dapur':
      return { bg: '#ffedd5', iconName: 'chili-mild', iconColor: '#ea580c' };
    case 'Herbal':
      return { bg: '#ecfdf5', iconName: 'leaf', iconColor: '#059669' };
    case 'Kering':
    default:
      return { bg: '#f3f4f6', iconName: 'grain', iconColor: '#64748b' };
  }
}

export default function StokScreen() {
  const router = useRouter();
  const { data, loading, isRetrying, error, refetch } = useIngredients();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const [statusOverrides, setStatusOverrides] = useState<Record<string, IngredientStatus>>({});
  const [itemOverrides, setItemOverrides] = useState<Record<string, Partial<Ingredient>>>({});

  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Ingredient | null>(null);

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

  const activeIngredients = useMemo<Ingredient[]>(() => {
    return (data ?? [])
      .map(i => {
        let item = { ...i };
        if (itemOverrides[i.id]) {
          item = { ...item, ...itemOverrides[i.id] };
        }
        if (statusOverrides[i.id]) {
          item = { ...item, status: statusOverrides[i.id] };
        }
        return item;
      })
      .filter(i => i.status === 'active')
      .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  }, [data, itemOverrides, statusOverrides]);

  const filteredIngredients = useMemo(() => {
    let list = activeIngredients;

    const tabObj = FILTER_TABS.find(t => t.id === activeTab);
    if (tabObj && tabObj.type !== 'all') {
      if (tabObj.type === 'category') {
        list = list.filter(item => item.category === tabObj.id);
      } else if (tabObj.type === 'location') {
        list = list.filter(item => item.storageLocation === tabObj.id);
      } else if (tabObj.type === 'status' && tabObj.id === 'kritis') {
        list = list.filter(item => getDaysUntilExpiry(item.expiryDate) <= 2);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.storageLocation.toLowerCase().includes(q) ||
          (item.quantity && item.quantity.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeIngredients, activeTab, searchQuery]);

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
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Apakah Anda yakin ingin menghapus "${item.name}" dari stok?`);
      if (ok) {
        setStatusOverrides(prev => ({ ...prev, [item.id]: 'discarded' }));
      }
      return;
    }

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
      ]
    );
  };

  const handleUse = (item: Ingredient) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`Bahan "${item.name}" sudah digunakan untuk memasak?`);
      if (ok) {
        setStatusOverrides(prev => ({ ...prev, [item.id]: 'used' }));
      }
      return;
    }

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
      ]
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <SafeAreaView edges={['top']} style={s.topSafeArea} />

      <View style={s.headerContainer}>
        <Text style={s.headerTitle}>Stok Bahan</Text>

        <TouchableOpacity
          style={s.roundBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/scan')}
          accessibilityLabel="Tambah atau Pindai Bahan"
        >
          <MaterialCommunityIcons name="camera-plus-outline" size={20} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <OfflineBanner onRetryAll={refetch} />

      <View style={s.searchContainer}>
        <View style={s.searchBar}>
          <Feather name="search" size={17} color="#064e3b" style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            placeholder="Cari stok bahan makanan..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 4 }}
            >
              <MaterialIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterScroll}
        >
          {FILTER_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[s.filterChip, isActive ? s.filterChipActive : s.filterChipInactive]}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[
                    s.filterChipText,
                    isActive ? s.filterChipTextActive : s.filterChipTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          s.listContainer,
          { paddingBottom: BottomTabInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ApiStateView
          loading={loading}
          isRetrying={isRetrying}
          error={error}
          isEmpty={!loading && !error && filteredIngredients.length === 0}
          emptyTitle="Tidak Ada Bahan Ditemukan"
          emptyMessage={
            searchQuery.trim()
              ? `Tidak ada stok yang cocok dengan kata kunci "${searchQuery}".`
              : 'Stok bahan makanan untuk kategori ini masih kosong.'
          }
          onRetry={refetch}
        >
          {filteredIngredients.map(item => {
            const visual = getIngredientVisual(item.name, item.category);
            const daysLeft = getDaysUntilExpiry(item.expiryDate);
            const isUrgent = daysLeft <= 2;

            let timeLabel = `${daysLeft} Hari`;
            if (daysLeft < 0) timeLabel = 'Kedaluwarsa';
            else if (daysLeft === 0) timeLabel = 'Hari ini';

            return (
              <TouchableOpacity
                key={item.id}
                style={s.card}
                activeOpacity={0.85}
                onPress={() => setSelectedItemForDetail(item)}
              >
                <View style={[s.cardThumbnail, { backgroundColor: visual.bg }]}>
                  <MaterialCommunityIcons
                    name={visual.iconName}
                    size={28}
                    color={visual.iconColor}
                  />
                </View>

                <View style={s.cardMiddle}>
                  <Text style={s.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={s.cardMetaRow}>
                    <MaterialIcons
                      name="access-time"
                      size={13}
                      color={isUrgent ? '#ef4444' : '#64748b'}
                    />
                    <Text style={[s.cardMetaText, isUrgent && s.cardMetaTextAlert]}>
                      {timeLabel}
                    </Text>
                    <Text style={s.cardMetaDot}>•</Text>
                    <Text style={s.cardMetaText}>
                      {item.storageLocation}{item.quantity ? ` (${item.quantity})` : ''}
                    </Text>
                  </View>
                </View>

                <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
              </TouchableOpacity>
            );
          })}
        </ApiStateView>
      </ScrollView>

      <Modal
        visible={selectedItemForDetail !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItemForDetail(null)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setSelectedItemForDetail(null)}
        >
          <Pressable style={s.detailSheetContainer} onPress={e => e.stopPropagation()}>
            {selectedItemForDetail && (() => {
              const item = selectedItemForDetail;
              const visual = getIngredientVisual(item.name, item.category);
              const daysLeft = getDaysUntilExpiry(item.expiryDate);
              const percent = getFreshnessPercent(daysLeft, item.totalDays);
              const isUrgent = daysLeft <= 2;

              return (
                <View>
                  <View style={s.sheetHandleBar} />

                  <View style={s.detailHeaderRow}>
                    <View style={[s.detailThumbnail, { backgroundColor: visual.bg }]}>
                      <MaterialCommunityIcons
                        name={visual.iconName}
                        size={36}
                        color={visual.iconColor}
                      />
                    </View>
                    <View style={s.detailHeaderTextCol}>
                      <Text style={s.detailItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={s.detailBadgeRow}>
                        <View style={[s.detailTag, { backgroundColor: visual.bg }]}>
                          <Text style={[s.detailTagText, { color: visual.iconColor }]}>
                            {item.category}
                          </Text>
                        </View>
                        <View style={[s.detailTag, { backgroundColor: '#f1f5f9' }]}>
                          <Text style={[s.detailTagText, { color: '#475569' }]}>
                            {item.storageLocation}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={s.detailCloseBtn}
                      onPress={() => setSelectedItemForDetail(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="close" size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <View style={s.detailStatsCard}>
                    <View style={s.detailStatItem}>
                      <Text style={s.detailStatLabel}>Masa Simpan</Text>
                      <Text style={[s.detailStatValue, isUrgent && { color: '#ef4444' }]}>
                        {daysLeft <= 0
                          ? daysLeft === 0
                            ? 'Hari ini'
                            : 'Kedaluwarsa'
                          : `${daysLeft} Hari Lagi`}
                      </Text>
                    </View>
                    <View style={s.detailStatDivider} />
                    <View style={s.detailStatItem}>
                      <Text style={s.detailStatLabel}>Kondisi</Text>
                      <Text style={[s.detailStatValue, isUrgent ? { color: '#ef4444' } : { color: '#16a34a' }]}>
                        {isUrgent ? 'Segera Olah' : `${percent}% Segar`}
                      </Text>
                    </View>
                    <View style={s.detailStatDivider} />
                    <View style={s.detailStatItem}>
                      <Text style={s.detailStatLabel}>Jumlah</Text>
                      <Text style={s.detailStatValue}>{item.quantity ?? '1 Porsi'}</Text>
                    </View>
                  </View>

                  <View style={s.detailActions}>
                    <TouchableOpacity
                      style={s.actionBtnPrimary}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedItemForDetail(null);
                        handleUse(item);
                      }}
                    >
                      <MaterialCommunityIcons name="chef-hat" size={20} color="#ffffff" />
                      <Text style={s.actionBtnPrimaryText}>Tandai Sudah Digunakan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionBtnSecondary}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedItemForDetail(null);
                        router.push('/');
                      }}
                    >
                      <MaterialIcons name="lightbulb-outline" size={20} color="#064e3b" />
                      <Text style={s.actionBtnSecondaryText}>Cari Ide Resep Olahan Sisa</Text>
                    </TouchableOpacity>

                    <View style={s.actionBtnRow}>
                      <TouchableOpacity
                        style={s.actionBtnOutline}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedItemForDetail(null);
                          handleOpenEdit(item);
                        }}
                      >
                        <MaterialIcons name="edit" size={18} color="#475569" />
                        <Text style={s.actionBtnOutlineText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.actionBtnDestructive}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedItemForDetail(null);
                          handleDelete(item);
                        }}
                      >
                        <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
                        <Text style={s.actionBtnDestructiveText}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

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
                <MaterialIcons name="edit" size={20} color="#064e3b" />
                <Text style={s.editModalTitle}>Edit Bahan</Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditingItem(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={s.editFormGroup}>
              <Text style={s.editLabel}>Nama Bahan</Text>
              <TextInput
                style={s.editInput}
                value={editForm.name}
                onChangeText={text => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Contoh: Bayam Hijau"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={s.editFormGroup}>
              <Text style={s.editLabel}>Jumlah / Takaran</Text>
              <TextInput
                style={s.editInput}
                value={editForm.quantity}
                onChangeText={text => setEditForm(prev => ({ ...prev, quantity: text }))}
                placeholder="Contoh: 2 Ikat"
                placeholderTextColor="#94a3b8"
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
                <MaterialIcons name="check" size={16} color="#ffffff" />
                <Text style={s.editSaveTxt}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
  },
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: -0.4,
  },

  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 44,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 22,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
    paddingVertical: 0,
  },
  cameraBtn: {
    padding: 4,
  },

  filterContainer: {
    marginBottom: 14,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#18181b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipText: {
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterChipTextInactive: {
    color: '#475569',
    fontWeight: '600',
  },

  listContainer: {
    paddingTop: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardThumbnail: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMiddle: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
    justifyContent: 'center',
    gap: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  cardMetaTextAlert: {
    color: '#ef4444',
    fontWeight: '700',
  },
  cardMetaDot: {
    fontSize: 10,
    color: '#cbd5e1',
    marginHorizontal: 2,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  detailSheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  detailThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderTextCol: {
    flex: 1,
    marginLeft: 14,
    gap: 6,
  },
  detailItemName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  detailBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  detailTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  detailTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  detailStatItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  detailStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  detailStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  detailActions: {
    gap: 10,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064e3b',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 13,
    borderRadius: 16,
    gap: 8,
  },
  actionBtnSecondaryText: {
    color: '#064e3b',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnOutlineText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnDestructive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  actionBtnDestructiveText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },

  editModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  editModalContent: {
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
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  editModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
  },
  editFormGroup: {
    marginBottom: 14,
    gap: 6,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  editLocRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editLocBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  editLocBtnActive: {
    borderColor: '#064e3b',
    backgroundColor: '#dcfce7',
  },
  editLocTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  editLocTxtActive: {
    color: '#064e3b',
    fontWeight: '700',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  editCancelTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  editSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  editSaveTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
