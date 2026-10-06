/**
 * FreshG – Tips & Resep Pintar Screen
 * Faithful React Native translation of the HTML reference design.
 */
import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabInset } from '@/constants/theme';
import { useIngredients } from '@/hooks/use-ingredients';
import { useRecipes, useGuides } from '@/hooks/use-recipes';
import { formatRupiah } from '@/utils/format';
import type { Recipe } from '@/types/recipe';
import type { Guide, GuideTheme } from '@/types/guide';
import { getDaysUntilExpiry, type StorageLocation, type Ingredient } from '@/types/ingredient';

const { width } = Dimensions.get('window');
const cardWidth = Math.min(width * 0.84, 340);

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
};

// ─── Top App Bar ──────────────────────────────────────────────────────────────

function TopAppBar() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: C.surface + 'F2' }}>
      <View style={appBar.container}>
        <View style={appBar.left}>
          <View style={appBar.logoWrap}>
            <MaterialIcons name="eco" size={24} color={C.primary} />
          </View>
          <Text style={appBar.title}>FreshG</Text>
        </View>
        <View style={appBar.actions}>
          <TouchableOpacity style={appBar.actionBtn} activeOpacity={0.7}>
            <MaterialIcons name="bookmark" size={20} color={C.onSurfaceVariant} />
            <View style={appBar.badgeDotPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={appBar.actionBtn} activeOpacity={0.7}>
            <MaterialIcons name="notifications" size={20} color={C.onSurfaceVariant} />
            <View style={appBar.badgeDotError} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={appBar.bottomBorder} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={appBar.scrollTags}>
        <TouchableOpacity style={appBar.tagActive} activeOpacity={0.8}>
          <MaterialIcons name="restaurant-menu" size={14} color={C.onPrimary} />
          <Text style={appBar.tagTxtActive}>Rekomendasi Resep</Text>
        </TouchableOpacity>
        <TouchableOpacity style={appBar.tag} activeOpacity={0.8}>
          <MaterialIcons name="kitchen" size={14} color={C.onSurfaceVariant} />
          <Text style={appBar.tagTxt}>Cara Simpan Bahan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={appBar.tag} activeOpacity={0.8}>
          <MaterialIcons name="inventory" size={14} color={C.onSurfaceVariant} />
          <Text style={appBar.tagTxt}>Trik Food Prep</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const appBar = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoWrap: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: C.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1,
  },
  title: { fontSize: 20, fontWeight: '800', color: C.primary, letterSpacing: -0.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeDotPrimary: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: C.primaryContainer },
  badgeDotError: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: C.error },
  bottomBorder: { height: 1, backgroundColor: C.surfaceContainer + '80' },
  scrollTags: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tagActive: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryContainer, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tagTxtActive: { fontSize: 13, fontWeight: '700', color: C.onPrimary },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surfaceLowest, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: C.outlineVariant + '80' },
  tagTxt: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type MIName = React.ComponentProps<typeof MaterialIcons>['name'];

const SOURCE_BADGE: Record<StorageLocation, { bg: string; color: string; icon: MIName; label: string }> = {
  'Freezer':    { bg: '#EEF2FF', color: '#4338CA', icon: 'ac-unit',  label: 'Bahan dari Freezer' },
  'Kulkas':     { bg: '#E0F2FE', color: '#0369A1', icon: 'kitchen',  label: 'Sisa Kulkas' },
  'Suhu Ruang': { bg: '#FEF3C7', color: '#B45309', icon: 'wb-sunny', label: 'Stok Pantry' },
  'Lemari':     { bg: '#F3F4F6', color: '#4B5563', icon: 'inventory', label: 'Stok Lemari' },
};

const GUIDE_THEME: Record<GuideTheme, { iconBg: string; iconColor: string; tagBg: string; tagColor: string }> = {
  blue:  { iconBg: '#eff6ff', iconColor: '#2563eb', tagBg: '#dbeafe', tagColor: '#1e40af' },
  amber: { iconBg: '#fffbeb', iconColor: '#b45309', tagBg: '#fef3c7', tagColor: '#78350f' },
};

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const badge = SOURCE_BADGE[recipe.sourceLocation];
  const allAvailable = recipe.ingredientsAvailable >= recipe.ingredientsTotal;
  return (
    <View style={s.recipeCard}>
      <View style={s.recipeImageWrap}>
        <Image source={{ uri: recipe.imageUrl }} style={s.recipeImage} contentFit="cover" />
        <View style={[s.recipeBadge, { backgroundColor: badge.bg }]}>
          <MaterialIcons name={badge.icon} size={12} color={badge.color} />
          <Text style={[s.recipeBadgeTxt, { color: badge.color }]}>{badge.label}</Text>
        </View>
        <TouchableOpacity style={s.recipeBookmarkBtn}>
          <MaterialIcons name="bookmark" size={18} color={C.onSurface} />
        </TouchableOpacity>
      </View>
      <View style={s.recipeInfo}>
        <View style={s.recipeMetaRow}>
          <View style={s.recipeMetaTag}><Text style={s.recipeMetaTagTxt}>{recipe.tagLabel}</Text></View>
          <View style={s.recipeRating}>
            <MaterialIcons name="star" size={14} color="#f59e0b" />
            <Text style={s.recipeRatingTxt}>{recipe.rating}</Text>
          </View>
        </View>
        <Text style={s.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
        <Text style={s.recipeDesc} numberOfLines={2}>{recipe.description}</Text>
        <View style={s.recipeFooterRow}>
          <View style={s.recipeFooterItem}>
            <MaterialIcons name="check-circle" size={14} color={C.primary} />
            <Text style={[s.recipeFooterTxt, { color: C.primary, fontWeight: '700' }]}>
              {allAvailable ? 'Semua Bahan Ada' : `${recipe.ingredientsAvailable}/${recipe.ingredientsTotal} Bahan Tersedia`}
            </Text>
          </View>
          <View style={s.recipeFooterItem}>
            <MaterialIcons name="schedule" size={14} color={C.onSurfaceVariant} />
            <Text style={s.recipeFooterTxt}>{recipe.cookTimeMinutes} mnt</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={s.recipeActionBtn} activeOpacity={0.8}>
        <Text style={s.recipeActionBtnTxt}>Mulai Memasak</Text>
        <MaterialIcons name="arrow-forward" size={16} color={C.primary} />
      </TouchableOpacity>
    </View>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const theme = GUIDE_THEME[guide.theme];
  return (
    <View style={s.guideCard}>
      <View style={s.guideTop}>
        <View style={s.guideIconRow}>
          <View style={[s.guideIconWrap, { backgroundColor: theme.iconBg }]}>
            <MaterialIcons name={guide.icon as MIName} size={24} color={theme.iconColor} />
          </View>
          <View>
            <View style={s.guideTagRow}>
              <View style={[s.guideTag, { backgroundColor: theme.tagBg }]}><Text style={[s.guideTagTxt, { color: theme.tagColor }]}>{guide.tag}</Text></View>
              <Text style={s.guideTime}>Baca {guide.readTimeMinutes} menit</Text>
            </View>
          </View>
        </View>
        <Text style={s.guideTitle}>{guide.title}</Text>
        <Text style={s.guideDesc}>{guide.description}</Text>

        <View style={s.guideGoldenRule}>
          <MaterialIcons name={guide.tipIcon as MIName} size={20} color={C.primary} style={{ marginTop: 2 }} />
          <Text style={s.guideGoldenTxt}><Text style={{ fontWeight: 'bold' }}>{guide.tipLabel}:</Text> {guide.tipText}</Text>
        </View>
      </View>
      <View style={s.guideBottom}>
        <View style={s.guideVerified}>
          <MaterialIcons name="verified" size={14} color={C.primary} />
          <Text style={s.guideVerifiedTxt}>Ditinjau {guide.reviewedBy}</Text>
        </View>
        <TouchableOpacity style={s.guideActionBtn}>
          <Text style={s.guideActionBtnTxt}>Baca Panduan</Text>
          <MaterialIcons name="arrow-forward" size={14} color={C.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TipsScreen() {
  const { data: ingredients } = useIngredients();
  const { data: recipes, loading: recipesLoading } = useRecipes();
  const { data: guides, loading: guidesLoading } = useGuides();

  // Bahan kritis (≤ 2 hari) – dipakai untuk kartu rekomendasi utama
  const critical = useMemo(() => (ingredients ?? [])
    .filter((i: Ingredient) => i.status === 'active' && getDaysUntilExpiry(i.expiryDate) <= 2)
    .sort((a: Ingredient, b: Ingredient) => a.expiryDate.getTime() - b.expiryDate.getTime()), [ingredients]);
  const highlight = critical.slice(0, 2);

  const featured = recipes?.find((r: Recipe) => r.isFeatured);
  const others = (recipes ?? []).filter((r: Recipe) => !r.isFeatured);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
      <TopAppBar />

      <ScrollView
        contentContainerStyle={[s.scrollContent, { paddingBottom: BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={s.titleSection}>
          <View style={s.pulseRow}>
            <View style={s.pulseDot} />
            <Text style={s.pulseTxt}>SMART COOKING & ZERO WASTE HUB</Text>
          </View>
          <Text style={s.pageTitle}>Tips & Inspirasi Masak</Text>
          <Text style={s.pageSub}>Olah bahan sebelum kedaluwarsa & cegah food waste dengan panduan teruji.</Text>
        </View>

        {/* Hero Card */}
        {featured && (
          <View style={[s.heroCard, { backgroundColor: C.primary }]}>
            {/* Decorative Glows */}
            <View style={s.glow1} />
            <View style={s.glow2} />

            <View style={s.heroTop}>
              <View style={s.heroBadge}>
                <MaterialIcons name="alarm" size={14} color="#85f8c4" />
                <Text style={s.heroBadgeTxt}>Rekomendasi Pintar • {critical.length} Bahan Kritis</Text>
              </View>
              {highlight.length > 0 ? (
                <>
                  <Text style={s.heroTitle}>
                    Gunakan {highlight.map((i: Ingredient) => i.name).join(' & ')} yang ada di kulkasmu!
                  </Text>
                  <Text style={s.heroSub}>
                    {highlight.map((i: Ingredient, idx: number) => (
                      <Text key={i.id}>
                        {idx > 0 && ' dan '}
                        {i.name} tersisa{' '}
                        <Text style={{ fontWeight: 'bold' }}>{Math.max(0, getDaysUntilExpiry(i.expiryDate))} hari lagi</Text>
                      </Text>
                    ))}
                    . {featured.description}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.heroTitle}>{featured.title}</Text>
                  <Text style={s.heroSub}>{featured.description}</Text>
                </>
              )}
            </View>

            <View style={s.heroRecipePill}>
              <View style={s.recipePillIconWrap}>
                <MaterialIcons name="soup-kitchen" size={24} color="#85f8c4" />
              </View>
              <View style={s.recipePillText}>
                <Text style={s.recipePillTitle} numberOfLines={1}>{featured.title}</Text>
                <View style={s.recipePillMeta}>
                  <MaterialIcons name="timer" size={12} color={C.surfaceContainerHigh} />
                  <Text style={s.recipePillMetaTxt}>{featured.cookTimeMinutes} Menit</Text>
                  <Text style={s.recipePillMetaTxt}> • </Text>
                  <MaterialIcons name="eco" size={12} color={C.surfaceContainerHigh} />
                  <Text style={s.recipePillMetaTxt}>Hemat {formatRupiah(featured.estimatedSaving)}</Text>
                </View>
              </View>
            </View>

            <View style={s.heroBtnRow}>
              <TouchableOpacity style={s.heroBtnPrimary} activeOpacity={0.8}>
                <Text style={s.heroBtnPrimaryTxt}>Lihat Resep & Cara Masak</Text>
                <MaterialIcons name="arrow-forward" size={18} color={C.onPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.heroBtnSecondary} activeOpacity={0.8}>
                <Text style={s.heroBtnSecondaryTxt}>Ganti Pilihan Bahan</Text>
              </TouchableOpacity>
            </View>

            <View style={s.heroImageWrap}>
              <Image
                source={{ uri: featured.imageUrl }}
                style={s.heroImage}
                contentFit="cover"
              />
              {highlight.length > 0 && (
                <View style={s.heroImageOverlay1}>
                  <View style={s.heroOverlayDot} />
                  <Text style={s.heroOverlayTxt}>Kritis Kedaluwarsa</Text>
                </View>
              )}
              <View style={s.heroImageOverlay2}>
                <MaterialIcons name="star" size={14} color={C.tertiaryContainer} />
                <Text style={s.heroOverlayTxtDark}>{featured.rating}</Text>
                <Text style={s.heroOverlayTxtLight}>({featured.reviewCount})</Text>
              </View>
            </View>
          </View>
        )}

        {/* Horizontal Carousel */}
        <View style={s.sectionHeader}>
          <View style={s.sectionHeaderLeft}>
            <Text style={s.sectionTitle}>Resep Hemat & Praktis Berdasarkan Stok</Text>
            <Text style={s.sectionSub}>Dipersonalisasi sesuai persediaan di Chiller & Freezer Anda</Text>
          </View>
        </View>

        {recipesLoading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: 24 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={cardWidth + 16} snapToAlignment="start" decelerationRate="fast" contentContainerStyle={s.carouselContent}>
            {others.map((recipe: Recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </ScrollView>
        )}

        {/* Panduan Edukasi */}
        <View style={[s.sectionHeader, { marginTop: 8 }]}>
          <View style={s.sectionHeaderLeft}>
            <Text style={s.sectionTitle}>Panduan Edukasi & Storage Tips</Text>
            <Text style={s.sectionSub}>Ketahui teknik penataan bahan agar tahan hingga 3x lebih lama</Text>
          </View>
        </View>

        <View style={s.guideCardList}>
          {guidesLoading ? (
            <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: 24 }} />
          ) : (
            (guides ?? []).map((guide: Guide) => <GuideCard key={guide.id} guide={guide} />)
          )}
        </View>

        {/* Final Reminder */}
        <View style={s.reminderCard}>
          <View style={s.reminderLeft}>
            <View style={s.reminderIconWrap}>
              <MaterialIcons name="calendar-month" size={24} color={C.onSecondaryContainer} />
            </View>
            <View style={s.reminderTextWrap}>
              <Text style={s.reminderTitle}>Jadwal Food Prep Mingguan Otomatis</Text>
              <Text style={s.reminderSub}>Dapatkan pengingat pembersihan kulkas dan tips menu belanja berikutnya setiap hari Sabtu.</Text>
            </View>
          </View>
          <TouchableOpacity style={s.reminderBtn} activeOpacity={0.8}>
            <Text style={s.reminderBtnTxt}>Aktifkan Pengingat</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },

  // Title
  titleSection: { gap: 4 },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primaryContainer }, // Using static instead of pulse animation for simplicity
  pulseTxt: { fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 0.5 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: C.onSurface, letterSpacing: -0.2 },
  pageSub: { fontSize: 14, color: C.onSurfaceVariant, lineHeight: 22 },

  // Hero Card
  heroCard: { borderRadius: 16, padding: 16, paddingBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  glow1: { position: 'absolute', right: -64, top: -64, width: 288, height: 288, borderRadius: 144, backgroundColor: C.primaryContainer + '40' },
  glow2: { position: 'absolute', left: 100, bottom: -48, width: 256, height: 256, borderRadius: 128, backgroundColor: C.secondaryContainer + '26' },
  
  heroTop: { gap: 8 },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, backgroundColor: C.secondaryContainer + '33', borderWidth: 1, borderColor: C.secondaryContainer + '4D' },
  heroBadgeTxt: { fontSize: 11, fontWeight: '600', color: '#85f8c4' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: C.onPrimary, lineHeight: 30 },
  heroSub: { fontSize: 14, color: C.surfaceContainerHigh + 'E6', lineHeight: 22 },

  heroRecipePill: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.onSurface + '40', borderWidth: 1, borderColor: C.onPrimary + '26', borderRadius: 12, padding: 12, marginTop: 16 },
  recipePillIconWrap: { width: 40, height: 40, borderRadius: 8, backgroundColor: C.surfaceLowest + '26', alignItems: 'center', justifyContent: 'center' },
  recipePillText: { flex: 1, gap: 2 },
  recipePillTitle: { fontSize: 16, fontWeight: '700', color: C.onPrimary },
  recipePillMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipePillMetaTxt: { fontSize: 11, fontWeight: '600', color: C.surfaceContainerHigh },

  heroBtnRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 16 },
  heroBtnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryContainer, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  heroBtnPrimaryTxt: { fontSize: 14, fontWeight: '700', color: C.onPrimary },
  heroBtnSecondary: { backgroundColor: C.onPrimary + '26', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  heroBtnSecondaryTxt: { fontSize: 14, fontWeight: '700', color: C.onPrimary },

  heroImageWrap: { marginTop: 20, width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#ffffff33' },
  heroImage: { width: '100%', height: '100%' },
  heroImageOverlay1: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.errorContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  heroOverlayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.error },
  heroOverlayTxt: { fontSize: 11, fontWeight: '700', color: C.onErrorContainer },
  heroImageOverlay2: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceLowest + 'E6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  heroOverlayTxtDark: { fontSize: 11, fontWeight: '800', color: C.onSurface },
  heroOverlayTxtLight: { fontSize: 10, fontWeight: '500', color: C.outline },

  // Sections
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  sectionHeaderLeft: { flex: 1, paddingRight: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: C.onSurface, letterSpacing: -0.2 },
  sectionSub: { fontSize: 14, color: C.onSurfaceVariant, marginTop: 4 },

  carouselContent: { gap: 16, paddingBottom: 8 },
  
  recipeCard: { width: cardWidth, backgroundColor: C.surfaceLowest, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '66', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  recipeImageWrap: { width: '100%', aspectRatio: 16/9, backgroundColor: C.surfaceContainer, borderTopLeftRadius: 15, borderTopRightRadius: 15, overflow: 'hidden' },
  recipeImage: { width: '100%', height: '100%' },
  recipeBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  recipeBadgeTxt: { fontSize: 11, fontWeight: '700' },
  recipeBookmarkBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceLowest + 'D9', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  
  recipeInfo: { padding: 16 },
  recipeMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  recipeMetaTag: { backgroundColor: C.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  recipeMetaTagTxt: { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant },
  recipeRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeRatingTxt: { fontSize: 11, fontWeight: '700', color: C.onSurface },
  
  recipeTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface, lineHeight: 22 },
  recipeDesc: { fontSize: 14, color: C.onSurfaceVariant, marginTop: 4, lineHeight: 20 },
  
  recipeFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.surfaceContainer },
  recipeFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeFooterTxt: { fontSize: 11, fontWeight: '600', color: C.onSurfaceVariant },
  
  recipeActionBtn: { marginHorizontal: 16, marginBottom: 16, backgroundColor: C.surfaceContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  recipeActionBtnTxt: { fontSize: 14, fontWeight: '700', color: C.primary },

  // Guide List
  guideCardList: { gap: 16 },
  guideCard: { backgroundColor: C.surfaceLowest, borderRadius: 16, borderWidth: 1, borderColor: C.outlineVariant + '66', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, padding: 20 },
  guideTop: {},
  guideIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  guideIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  guideTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guideTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  guideTagTxt: { fontSize: 11, fontWeight: '700' },
  guideTime: { fontSize: 11, color: C.onSurfaceVariant },
  
  guideTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface, lineHeight: 22 },
  guideDesc: { fontSize: 14, color: C.onSurfaceVariant, marginTop: 8, lineHeight: 22 },
  
  guideGoldenRule: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.surfaceContainerLow, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.outlineVariant + '4D', marginTop: 14 },
  guideGoldenTxt: { flex: 1, fontSize: 11, color: C.onSurface, lineHeight: 18 },

  guideBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.surfaceContainer },
  guideVerified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  guideVerifiedTxt: { fontSize: 11, fontWeight: '500', color: C.onSurfaceVariant },
  guideActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  guideActionBtnTxt: { fontSize: 14, fontWeight: '700', color: C.primary },

  // Reminder
  reminderCard: { flexDirection: 'column', backgroundColor: C.surfaceContainerLow, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.outlineVariant + '4D', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, gap: 16 },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  reminderIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.secondaryContainer, alignItems: 'center', justifyContent: 'center' },
  reminderTextWrap: { flex: 1 },
  reminderTitle: { fontSize: 16, fontWeight: '700', color: C.onSurface },
  reminderSub: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 4, lineHeight: 20 },
  reminderBtn: { backgroundColor: C.surfaceLowest, borderWidth: 1, borderColor: C.outlineVariant, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  reminderBtnTxt: { fontSize: 14, fontWeight: '700', color: C.primary },
});
