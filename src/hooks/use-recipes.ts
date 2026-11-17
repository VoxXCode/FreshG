import { useState, useCallback } from 'react';
import { api } from '@/data/services/api';
import { toRecipeList } from '@/data/mappers/recipe.mapper';
import { toGuideList } from '@/data/mappers/guide.mapper';
import { mealApi, type MealDetail } from '@/data/services/meal-api';
import { useAsyncData } from './use-async-data';
import type { Recipe } from '@/types/recipe';

/**
 * Mengambil data resep makanan secara asinkron dari REST API TheMealDB
 * Jika jaringan bermasalah / offline, otomatis fallback ke data mock lokal.
 */
async function fetchRecipes(query = 'chicken'): Promise<Recipe[]> {
  try {
    const onlineRecipes = await mealApi.searchRecipes(query);
    if (onlineRecipes.length > 0) {
      console.log(`[TheMealDB] Berhasil memuat ${onlineRecipes.length} resep online untuk query '${query}'`);
      return onlineRecipes;
    }
  } catch (err) {
    console.warn('[TheMealDB] Gagal memuat resep online, menggunakan mock lokal:', err);
  }

  const response = await api.getRecipes();
  return toRecipeList(response.data);
}

async function fetchGuides() {
  const response = await api.getGuides();
  return toGuideList(response.data);
}

export function useRecipes(initialQuery = 'chicken') {
  const fetcher = useCallback(() => fetchRecipes(initialQuery), [initialQuery]);
  return useAsyncData(fetcher);
}

export function useGuides() {
  return useAsyncData(fetchGuides);
}

/**
 * Hook untuk memuat detail resep lengkap dari TheMealDB (bahan & instruksi memasak)
 */
export function useRecipeDetail() {
  const [detail, setDetail] = useState<MealDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async (idMeal: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await mealApi.getRecipeDetail(idMeal);
      setDetail(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat instruksi resep.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearDetail = useCallback(() => {
    setDetail(null);
    setError(null);
  }, []);

  return { detail, loading, error, loadDetail, clearDetail };
}

/**
 * Implementasi Slide 11 PPT: Eksekusi Paralel (Concurrent)
 * Menggunakan Promise.allSettled ('Resilient Engine' / Toleran Error)
 * Mengambil Recipes dan Guides secara bersamaan tanpa saling memblokir.
 */
export async function fetchTipsDataParallel(query = 'chicken') {
  const [recipesResult, guidesResult] = await Promise.allSettled([
    fetchRecipes(query),
    fetchGuides(),
  ]);

  return {
    recipes: recipesResult.status === 'fulfilled' ? recipesResult.value : [],
    guides: guidesResult.status === 'fulfilled' ? guidesResult.value : [],
    recipesError: recipesResult.status === 'rejected' ? recipesResult.reason : null,
    guidesError: guidesResult.status === 'rejected' ? guidesResult.reason : null,
  };
}

