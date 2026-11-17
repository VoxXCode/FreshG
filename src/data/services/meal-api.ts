/**
 * TheMealDB Online API Service – FreshG
 * Mengambil data resep makanan nyata dari REST API publik TheMealDB
 * Host: https://www.themealdb.com/api/json/v1/1/
 *
 * 100% Gratis & tanpa API Key (endpoint publik '1')
 * Sesuai prinsip Asynchronous API Request React Native (Week 9 PPT Slide 8 & 10)
 */

import type { Recipe } from '@/types/recipe';
import type { StorageLocation } from '@/types/ingredient';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const TIMEOUT_MS = 10000;

export interface MealDetail {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags?: string | null;
  strYoutube?: string | null;
  ingredients: { name: string; measure: string }[];
}

export function toRecipeFromMeal(meal: Record<string, any>): Recipe {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const val = meal[`strIngredient${i}`];
    if (typeof val === 'string' && val.trim()) {
      ingredients.push(val.trim());
    }
  }

  const idNum = parseInt(meal.idMeal, 10) || 100;
  const rating = 4.7 + ((idNum % 25) / 100);
  const cookTime = 15 + ((idNum % 5) * 5);
  const totalIng = ingredients.length || 5;
  const availableIng = Math.max(1, Math.min(totalIng, Math.round(totalIng * 0.75)));

  const cleanDesc = (meal.strInstructions || '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  const shortDesc = cleanDesc.length > 120 ? cleanDesc.slice(0, 117) + '...' : cleanDesc;

  let location: StorageLocation = 'Kulkas';
  const cat = (meal.strCategory || '').toLowerCase();
  if (cat.includes('meat') || cat.includes('beef') || cat.includes('chicken') || cat.includes('seafood')) {
    location = 'Freezer';
  } else if (cat.includes('pasta') || cat.includes('dessert') || cat.includes('miscellaneous')) {
    location = 'Suhu Ruang';
  }

  return {
    id: String(meal.idMeal),
    title: meal.strMeal || 'Menu Pilihan FreshG',
    description: shortDesc || `Resep masakan ${meal.strCategory || 'Sehat'} khas ${meal.strArea || 'Nusantara'} yang lezat.`,
    imageUrl: meal.strMealThumb || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
    tagLabel: `${meal.strCategory || 'Sehat'} • ${meal.strArea || 'Lezat'}`,
    rating: Number(rating.toFixed(1)),
    reviewCount: 85 + (idNum % 250),
    cookTimeMinutes: cookTime,
    sourceLocation: location,
    ingredientsTotal: totalIng,
    ingredientsAvailable: availableIng,
    estimatedSaving: 25000 + ((idNum % 4) * 10000),
    isFeatured: idNum % 3 === 0,
  };
}

export function extractMealDetail(meal: Record<string, any>): MealDetail {
  const ingredients: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (typeof name === 'string' && name.trim()) {
      ingredients.push({
        name: name.trim(),
        measure: typeof measure === 'string' ? measure.trim() : '',
      });
    }
  }

  return {
    idMeal: String(meal.idMeal),
    strMeal: meal.strMeal || '',
    strCategory: meal.strCategory || '',
    strArea: meal.strArea || '',
    strInstructions: meal.strInstructions || '',
    strMealThumb: meal.strMealThumb || '',
    strTags: meal.strTags,
    strYoutube: meal.strYoutube,
    ingredients,
  };
}

async function fetchWithTimeout(url: string, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: signal ?? controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export const mealApi = {
  /**
   * Mengambil daftar resep online berdasarkan pencarian nama atau bahan
   * Default query 'soup' atau 'chicken' untuk menu segar bernutrisi
   */
  searchRecipes: async (query: string = 'soup', signal?: AbortSignal): Promise<Recipe[]> => {
    const cleanQuery = query.trim() || 'soup';
    console.log(`[TheMealDB] [GET] search.php?s=${cleanQuery}`);

    const res = await fetchWithTimeout(`${BASE_URL}/search.php?s=${encodeURIComponent(cleanQuery)}`, signal);
    if (!res.ok) {
      throw new Error(`TheMealDB mengembalikan HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.meals || !Array.isArray(data.meals)) {
      return [];
    }

    return data.meals.map(toRecipeFromMeal);
  },

  /**
   * Mengambil detail resep lengkap (termasuk takaran bahan dan langkah memasak)
   */
  getRecipeDetail: async (idMeal: string, signal?: AbortSignal): Promise<MealDetail | null> => {
    console.log(`[TheMealDB] [GET] lookup.php?i=${idMeal}`);

    const res = await fetchWithTimeout(`${BASE_URL}/lookup.php?i=${idMeal}`, signal);
    if (!res.ok) {
      throw new Error(`Gagal memuat detail resep (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (!data.meals || data.meals.length === 0) {
      return null;
    }

    return extractMealDetail(data.meals[0]);
  },
};

