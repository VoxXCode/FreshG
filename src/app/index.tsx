import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
  Ionicons,
} from '@expo/vector-icons';

import {
  type Category,
  getDaysUntilExpiry,
} from '@/types/ingredient';
import { BottomTabInset } from '@/constants/theme';
import { useIngredients } from '@/hooks/use-ingredients';
import { ApiStateView } from '@/components/ui/api-state-view';
import { OfflineBanner } from '@/components/ui/offline-banner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  primary:          '#16a34a',
  primaryDark:      '#064e3b',
  primaryLight:     '#dcfce7',
  background:       '#f8fafc',
  surface:          '#ffffff',
  textPrimary:      '#0f172a',
  textSecondary:    '#64748b',
  textMuted:        '#94a3b8',
  border:           '#e2e8f0',
  borderLight:      '#f1f5f9',
  accentYellow:     '#eab308',
  accentRed:        '#ef4444',
  tagYellowBg:      '#fef9c3',
  tagYellowText:    '#854d0e',
  tagGreenBg:       '#f0fdf4',
  tagGreenText:     '#15803d',
  tagRedBg:         '#fee2e2',
  tagRedText:       '#991b1b',
};

interface RecipeTip {
  id: string;
  name: string;
  category: Category;
  rating: number;
  reviewsCount: number;
  cookTime: string;
  savingLabel: string;
  usedIngredients: string;
  tipMessage: string;
  imageUrl: string;
  matchBadge: string;
}

const DEFAULT_RECIPE_TIPS: RecipeTip[] = [
  {
    id: 'tip-1',
    name: 'Sup Bayam Jagung Telur',
    category: 'Sayuran',
    rating: 4.95,
    reviewsCount: 280,
    cookTime: '15 Mnt',
    savingLabel: 'Hemat Rp 45rb',
    usedIngredients: 'Bayam, Jagung, Telur',
    tipMessage: 'Sisa bayam hijau sebelum layu menjadi sup hangat bernutrisi tanpa sisa.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
    matchBadge: 'Sisa Kulkas',
  },
  {
    id: 'tip-2',
    name: 'Tumis Ayam Paprika Cepat',
    category: 'Daging & Olahan',
    rating: 4.90,
    reviewsCount: 154,
    cookTime: '20 Mnt',
    savingLabel: 'Hemat Rp 30rb',
    usedIngredients: 'Daging Ayam, Bawang',
    tipMessage: 'Gunakan stok dada ayam beku freezer sebelum batas 1 bulan, tetap juicy dan gurih.',
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80',
    matchBadge: 'Dari Freezer',
  },
  {
    id: 'tip-3',
    name: 'Smoothie Bayam Buah Segar',
    category: 'Buah-buahan',
    rating: 4.88,
    reviewsCount: 210,
    cookTime: '5 Mnt',
    savingLabel: 'Hemat Rp 25rb',
    usedIngredients: 'Sisa Bayam, Pisang/Apel',
    tipMessage: 'Solusi kilat blender sisa daun bayam dan buah manis alami tanpa gula tambahan.',
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80',
    matchBadge: 'Kilat 5 Mnt',
  },
  {
    id: 'tip-4',
    name: 'Omelet Sayur Kulkas Kilat',
    category: 'Susu & Telur',
    rating: 4.85,
    reviewsCount: 340,
    cookTime: '10 Mnt',
    savingLabel: 'Hemat Rp 20rb',
    usedIngredients: 'Telur, Wortel, Bawang',
    tipMessage: 'Cincang sayuran sisa di chiller kulkas lalu kocok bersama telur ayam.',
    imageUrl: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=500&q=80',
    matchBadge: 'Praktis',
  },
  {
    id: 'tip-5',
    name: 'Nasi Goreng Sayuran Chiller',
    category: 'Bumbu Dapur',
    rating: 4.92,
    reviewsCount: 512,
    cookTime: '15 Mnt',
    savingLabel: 'Hemat Rp 35rb',
    usedIngredients: 'Nasi Kemarin, Bumbu Dapur',
    tipMessage: 'Habiskan sisa nasi dan aneka bumbu dapur aromatik menjadi nasi goreng istimewa.',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80',
    matchBadge: 'Nol Sisa',
  },
  {
    id: 'tip-6',
    name: 'Salad Sayur Saus Wijen',
    category: 'Sayuran',
    rating: 4.80,
    reviewsCount: 180,
    cookTime: '8 Mnt',
    savingLabel: 'Hemat Rp 18rb',
    usedIngredients: 'Selada, Wortel, Tomat',
    tipMessage: 'Iris renyah sisa sayuran segar dengan dressing wijen sangrai untuk camilan sehat.',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
    matchBadge: 'Segar Alami',
  },
];

function getDeterministicMeta(id: string, name: string) {
  let hash = 0;
  const str = id + name;
  for (let idx = 0; idx < str.length; idx++) {
    hash = (hash * 31 + str.charCodeAt(idx)) & 0xffffffff;
  }
  const positive = Math.abs(hash);
  const reviewsCount = 100 + (positive % 400);
  const cookMin = 10 + (positive % 15);
  const savingRb = 20 + (positive % 35);
  return {
    reviewsCount,
    cookTime: `${cookMin} Mnt`,
    savingLabel: `Hemat Rp ${savingRb}rb`,
  };
}

interface CategoryItem {
  id: string;
  name: string;
  categoryFilter?: Category;
  bgColor: string;
  iconName: string;
  iconColor: string;
  iconType: 'material' | 'mc' | 'ionicons';
}

const CIRCULAR_CATEGORIES: CategoryItem[] = [
  {
    id: 'see_all',
    name: 'See All',
    bgColor: '#dcfce7',
    iconName: 'grid-view',
    iconColor: '#16a34a',
    iconType: 'material',
  },
  {
    id: 'dairy',
    name: 'Dairy',
    categoryFilter: 'Susu & Telur',
    bgColor: '#e0f2fe',
    iconName: 'cup-water',
    iconColor: '#0284c7',
    iconType: 'mc',
  },
  {
    id: 'meat',
    name: 'Meat',
    categoryFilter: 'Daging & Olahan',
    bgColor: '#ffe4e6',
    iconName: 'food-steak',
    iconColor: '#e11d48',
    iconType: 'mc',
  },
  {
    id: 'pantry',
    name: 'Pantry',
    categoryFilter: 'Bumbu Dapur',
    bgColor: '#fef3c7',
    iconName: 'shopping-bag',
    iconColor: '#d97706',
    iconType: 'material',
  },
  {
    id: 'veggies',
    name: 'Sayuran',
    categoryFilter: 'Sayuran',
    bgColor: '#d1fae5',
    iconName: 'sprout',
    iconColor: '#059669',
    iconType: 'mc',
  },
  {
    id: 'fruits',
    name: 'Buah',
    categoryFilter: 'Buah-buahan',
    bgColor: '#fce7f3',
    iconName: 'fruit-grapes',
    iconColor: '#db2777',
    iconType: 'mc',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { data, loading, isRetrying, error, refetch } = useIngredients();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('see_all');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const urgentCount = useMemo(() => {
    if (!data) return 0;
    return data.filter(i => i.status === 'active' && getDaysUntilExpiry(i.expiryDate) <= 2).length;
  }, [data]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const apiRecipeTips = useMemo<RecipeTip[]>(() => {
    if (!data) return [];
    return data
      .filter(i => i.status === 'active')
      .map(i => {
        const daysLeft = getDaysUntilExpiry(i.expiryDate);
        const meta = getDeterministicMeta(i.id, i.name);
        return {
          id: `ing-${i.id}`,
          name: `Kreasi ${i.name}`,
          category: i.category,
          rating: 4.9,
          reviewsCount: meta.reviewsCount,
          cookTime: meta.cookTime,
          savingLabel: meta.savingLabel,
          usedIngredients: `${i.name} (${i.storageLocation})`,
          tipMessage: `Bahan ${i.name} tersisa ${daysLeft <= 0 ? 'hari ini' : `${daysLeft} hari lagi`}. Masak segera agar tidak terbuang sia-sia.`,
          imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80',
          matchBadge: daysLeft <= 2 ? 'Segera Masak' : 'Stok Kulkas',
        };
      });
  }, [data]);

  const allTips = useMemo<RecipeTip[]>(() => {
    const combined = [...DEFAULT_RECIPE_TIPS, ...apiRecipeTips];
    const map = new Map<string, RecipeTip>();
    for (const t of combined) {
      map.set(t.name.toLowerCase(), t);
    }
    return Array.from(map.values());
  }, [apiRecipeTips]);

  const filteredTips = useMemo(() => {
    let list = allTips;
    if (selectedCategory !== 'see_all') {
      const catObj = CIRCULAR_CATEGORIES.find(c => c.id === selectedCategory);
      if (catObj?.categoryFilter) {
        list = list.filter(p => p.category === catObj.categoryFilter);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        p => p.name.toLowerCase().includes(q) || p.usedIngredients.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTips, selectedCategory, searchQuery]);

  const tipPairs = useMemo(() => {
    const pairs: RecipeTip[][] = [];
    for (let i = 0; i < filteredTips.length; i += 2) {
      pairs.push(filteredTips.slice(i, i + 2));
    }
    return pairs;
  }, [filteredTips]);

  const handleOpenRecipeTip = (tip: RecipeTip) => {
    Alert.alert(
      tip.name,
      `💡 Tips Pengolahan Bahan Sisa:\n${tip.tipMessage}\n\n🥗 Bahan yang Dimanfaatkan:\n${tip.usedIngredients}\n\n⏱ Estimasi Memasak: ${tip.cookTime}\n💰 Potensi Hemat: ${tip.savingLabel}`,
      [
        { text: 'Tutup', style: 'cancel' },
        {
          text: 'Buka Tips & Resep',
          onPress: () => router.push('/tips'),
        },
      ]
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <SafeAreaView edges={['top']} style={s.topSafeArea}>
        <TouchableOpacity
          style={s.locationBar}
          activeOpacity={0.7}
          onPress={() => router.push('/lokasi')}
          accessibilityLabel="Pilih Lokasi"
        >
          <View style={s.locationLeft}>
            <MaterialIcons name="location-on" size={17} color={C.primary} />
            <Text style={s.locationText} numberOfLines={1}>
              Add your location first
            </Text>
            <Feather name="chevron-right" size={15} color={C.textSecondary} />
          </View>
        </TouchableOpacity>

        <View style={s.searchRow}>
          <TouchableOpacity
            style={s.filterBtn}
            activeOpacity={0.8}
            onPress={() => setSelectedCategory('see_all')}
            accessibilityLabel="Filter Kategori"
          >
            <Feather name="sliders" size={17} color={C.primary} />
          </TouchableOpacity>

          <View style={s.searchContainer}>
            <Feather name="search" size={17} color={C.primary} style={s.searchIcon} />
            <TextInput
              style={s.searchInput}
              placeholder="Cari ide resep masakan..."
              placeholderTextColor={C.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={s.cartBtn}
            onPress={() => router.push('/notifikasi')}
            activeOpacity={0.8}
            accessibilityLabel="Pusat Notifikasi"
          >
            <Ionicons name="notifications-outline" size={26} color={C.primary} />
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{urgentCount > 0 ? urgentCount : 1}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <OfflineBanner onRetryAll={refetch} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: BottomTabInset + 44 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.bannerSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.bannerScroll}
            snapToInterval={SCREEN_WIDTH * 0.84 + 14}
            decelerationRate="fast"
          >
            <View style={s.bannerCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80' }}
                style={s.bannerRightImage}
                contentFit="cover"
              />
              <View style={s.bannerLeftBase} />
              <View style={s.bannerContent}>
                <Text style={s.bannerTitle}>
                  {'Fresh Deals,\nFresh Groceries!'}
                </Text>
                <Text style={s.bannerSubtitle} numberOfLines={2}>
                  Up to 50% off on your favorite essentials. Shop now and save big!
                </Text>
                <TouchableOpacity
                  style={s.bannerBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push('/todo')}
                >
                  <Text style={s.bannerBtnText}>GRAB THE DEALS</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[s.bannerCard, { backgroundColor: '#4c0519' }]}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80' }}
                style={s.bannerRightImage}
                contentFit="cover"
              />
              <View style={[s.bannerLeftBase, { backgroundColor: '#4c0519' }]} />
              <View style={s.bannerContent}>
                <Text style={s.bannerTitle}>
                  {'Sweet Deals\non Fruits!'}
                </Text>
                <Text style={s.bannerSubtitle} numberOfLines={2}>
                  Enjoy delicious vitamin-packed seasonal fruits. Fresh & crisp every day!
                </Text>
                <TouchableOpacity
                  style={s.bannerBtn}
                  activeOpacity={0.85}
                  onPress={() => setSelectedCategory('fruits')}
                >
                  <Text style={[s.bannerBtnText, { color: '#881337' }]}>EXPLORE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={s.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.categoriesScroll}
          >
            {CIRCULAR_CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={s.categoryItem}
                  activeOpacity={0.75}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <View
                    style={[
                      s.categoryCircle,
                      { backgroundColor: cat.bgColor },
                      isActive ? s.categoryCircleActive : cat.id === 'see_all' ? s.categoryCircleSeeAll : null,
                    ]}
                  >
                    {cat.iconType === 'material' ? (
                      <MaterialIcons
                        name={cat.iconName as any}
                        size={24}
                        color={cat.iconColor}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={cat.iconName as any}
                        size={24}
                        color={cat.iconColor}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      s.categoryLabel,
                      isActive && { color: C.primary, fontWeight: '700' },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={s.gridSection}>
          <View style={s.gridHeader}>
            <View>
              <Text style={s.gridTitle}>Top Picks for You</Text>
              <Text style={s.gridSubtitle}>Ide resep lezat dari sisa bahan kulkas</Text>
            </View>
            {selectedCategory !== 'see_all' && (
              <TouchableOpacity
                onPress={() => setSelectedCategory('see_all')}
                activeOpacity={0.7}
              >
                <Text style={s.resetFilterText}>Lihat Semua</Text>
              </TouchableOpacity>
            )}
          </View>

          <ApiStateView
            loading={loading}
            isRetrying={isRetrying}
            error={error}
            isEmpty={!loading && !error && filteredTips.length === 0}
            emptyTitle={searchQuery ? 'Resep Tidak Ditemukan' : 'Belum Ada Ide Resep'}
            emptyMessage={
              searchQuery
                ? 'Coba gunakan kata kunci bahan sisa yang lain.'
                : 'Tips olah bahan sisa kulkas akan ditampilkan di sini.'
            }
            onRetry={refetch}
          >
            <View style={s.gridContainer}>
              {tipPairs.map((pair, rowIndex) => (
                <View key={rowIndex} style={s.cardRow}>
                  {pair.map(tip => {
                    const isFav = !!favorites[tip.id];
                    return (
                      <TouchableOpacity
                        key={tip.id}
                        style={s.productCard}
                        activeOpacity={0.88}
                        onPress={() => handleOpenRecipeTip(tip)}
                      >
                        <View style={s.cardImageWrap}>
                          <Image
                            source={{ uri: tip.imageUrl }}
                            style={s.cardImage}
                            contentFit="cover"
                            transition={200}
                          />
                          <TouchableOpacity
                            style={s.favButton}
                            activeOpacity={0.8}
                            onPress={() => toggleFavorite(tip.id)}
                            accessibilityLabel="Favorit"
                          >
                            <Ionicons
                              name={isFav ? 'heart' : 'heart-outline'}
                              size={15}
                              color={isFav ? C.accentRed : '#64748b'}
                            />
                          </TouchableOpacity>
                        </View>

                        <View style={s.tagsRow}>
                          <View style={s.ratingBadge}>
                            <Ionicons name="star" size={10} color="#ca8a04" />
                            <Text style={s.ratingText}>
                              {tip.rating} ({tip.reviewsCount})
                            </Text>
                          </View>
                          <View style={s.timeBadge}>
                            <Ionicons name="time-outline" size={10} color={C.primary} />
                            <Text style={s.timeText}>{tip.cookTime}</Text>
                          </View>
                        </View>

                        <Text style={s.productName} numberOfLines={1}>
                          {tip.name}
                        </Text>

                        <View style={s.cardFooter}>
                          <Text style={s.savingText} numberOfLines={1}>
                            {tip.savingLabel}
                          </Text>
                          <View style={s.btnAction}>
                            <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={C.primary} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {pair.length === 1 && <View style={[s.productCard, { opacity: 0 }]} />}
                </View>
              ))}
            </View>
          </ApiStateView>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  topSafeArea: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
  },

  locationBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 2,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    borderRadius: 21,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.textPrimary,
    paddingVertical: 0,
  },
  cameraBtn: {
    padding: 4,
  },
  cartBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 1,
    right: 2,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  scroll: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    paddingTop: 14,
  },

  bannerSection: {
    marginBottom: 20,
  },
  bannerScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  bannerCard: {
    width: SCREEN_WIDTH > 420 ? 340 : SCREEN_WIDTH * 0.85,
    height: 155,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#064e3b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerRightImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '56%',
  },
  bannerLeftBase: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '52%',
    backgroundColor: '#064e3b',
  },
  bannerContent: {
    width: '68%',
    height: '100%',
    paddingLeft: 18,
    paddingVertical: 14,
    justifyContent: 'center',
    zIndex: 2,
  },
  bannerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#d1fae5',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
    maxWidth: '90%',
  },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  bannerBtnText: {
    color: '#064e3b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  categoriesSection: {
    marginBottom: 20,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 6,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryCircleSeeAll: {
    borderColor: '#16a34a',
    borderWidth: 1.8,
  },
  categoryCircleActive: {
    borderColor: C.primary,
    borderWidth: 2,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSecondary,
  },

  gridSection: {
    paddingHorizontal: 16,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  gridSubtitle: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 2,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  gridContainer: {
    width: '100%',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageWrap: {
    width: '100%',
    height: 118,
    borderRadius: 13,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f8fafc',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  favButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.tagYellowBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.tagYellowText,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.tagGreenBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '600',
    color: C.tagGreenText,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  savingText: {
    fontSize: 11,
    color: C.textPrimary,
    fontWeight: '800',
    flex: 1,
  },
  btnAction: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
