import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';
import { useAppTheme } from '@/context/theme-context';

interface SkeletonBoxProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: SkeletonBoxProps) {
  const { colors: C, isDark } = useAppTheme();
  const [opacityAnim] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.box,
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? C.surfaceContainerHighest : '#cbd5e1',
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton untuk kartu bahan (HomeScreen & StokScreen)
 */
export function IngredientCardSkeleton() {
  const { colors: C, isDark } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: C.surfaceLowest,
          borderColor: isDark ? C.surfaceContainerHigh : '#f1f5f9',
        },
      ]}
    >
      <SkeletonBox width={46} height={46} borderRadius={12} />
      <View style={styles.cardContent}>
        <View style={styles.rowBetween}>
          <SkeletonBox width="55%" height={16} borderRadius={6} />
          <SkeletonBox width={64} height={20} borderRadius={10} />
        </View>
        <SkeletonBox width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        <View style={styles.tagRow}>
          <SkeletonBox width={70} height={18} borderRadius={6} />
          <SkeletonBox width={60} height={18} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton untuk kartu resep (TipsScreen)
 */
export function RecipeCardSkeleton() {
  const { colors: C, isDark } = useAppTheme();
  return (
    <View
      style={[
        styles.recipeCard,
        {
          backgroundColor: C.surfaceLowest,
          borderColor: isDark ? C.surfaceContainerHigh : '#f1f5f9',
        },
      ]}
    >
      <SkeletonBox width="100%" height={140} borderRadius={14} />
      <View style={{ padding: 12, gap: 8 }}>
        <SkeletonBox width="80%" height={18} borderRadius={6} />
        <SkeletonBox width="50%" height={14} borderRadius={4} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <SkeletonBox width={70} height={20} borderRadius={10} />
          <SkeletonBox width={60} height={20} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton daftar kartu bahan
 */
export function IngredientListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <IngredientCardSkeleton key={`skeleton-${i}`} />
      ))}
    </View>
  );
}

/**
 * Skeleton daftar resep
 */
export function RecipeListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={`recipe-skel-${i}`} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#cbd5e1',
  },
  list: {
    paddingVertical: 8,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardContent: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  recipeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 12,
  },
});
