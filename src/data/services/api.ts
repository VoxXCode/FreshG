/**
 * Mock API – mensimulasikan request HTTP ke server.
 *
 * Mengembalikan data MENTAH dari server (bertipe DTO), belum di-mapping.
 * Jika nanti memakai API sungguhan, cukup ganti isi `request()` dengan
 * `fetch(url).then(r => r.json())` — layer lain tidak perlu berubah.
 */
import type { ApiResponse } from '@/data/dto/api-response.dto';
import type { IngredientDTO } from '@/data/dto/ingredient.dto';
import type { RecipeDTO } from '@/data/dto/recipe.dto';
import type { GuideDTO } from '@/data/dto/guide.dto';
import type { UserProfileDTO } from '@/data/dto/user.dto';

import ingredientsResponse from '@/data/server/ingredients.json';
import recipesResponse from '@/data/server/recipes.json';
import guidesResponse from '@/data/server/guides.json';
import userProfileResponse from '@/data/server/user-profile.json';

const NETWORK_DELAY_MS = 400;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Data contoh memakai tanggal tetap (lihat `server_time`). Agar demo selalu
 * relevan, semua field tanggal (`*_at`) digeser relatif terhadap waktu
 * sekarang — seolah-olah server baru saja mengirim data tersebut.
 */
function shiftDates(value: unknown, offsetMs: number): unknown {
  if (Array.isArray(value)) return value.map(v => shiftDates(v, offsetMs));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[key] =
        key.endsWith('_at') && typeof v === 'string'
          ? new Date(Date.parse(v) + offsetMs).toISOString()
          : shiftDates(v, offsetMs);
    }
    return out;
  }
  return value;
}

async function request<T>(raw: { server_time: string }): Promise<ApiResponse<T>> {
  await wait(NETWORK_DELAY_MS);
  const offset = Date.now() - Date.parse(raw.server_time);
  const shifted = shiftDates(raw, offset) as ApiResponse<T>;
  return { ...shifted, server_time: new Date().toISOString() };
}

export const api = {
  getIngredients: () => request<IngredientDTO[]>(ingredientsResponse),
  getRecipes:     () => request<RecipeDTO[]>(recipesResponse),
  getGuides:      () => request<GuideDTO[]>(guidesResponse),
  getUserProfile: () => request<UserProfileDTO>(userProfileResponse),
};
