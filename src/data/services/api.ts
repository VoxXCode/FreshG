/**
 * Mock API – mensimulasikan request HTTP ke server dengan dukungan:
 * - Penanganan ApiError & Status Code
 * - Deteksi Offline & Simulasi Offline
 * - Simulasi Server Error (500)
 * - Latensi & Request Timeout
 */
import { Platform } from 'react-native';
import type { ApiResponse } from '@/data/dto/api-response.dto';
import type { IngredientDTO } from '@/data/dto/ingredient.dto';
import type { RecipeDTO } from '@/data/dto/recipe.dto';
import type { GuideDTO } from '@/data/dto/guide.dto';
import type { UserProfileDTO } from '@/data/dto/user.dto';

import { ApiError } from '@/types/api-error';
import { networkSimulator } from '@/data/services/network-simulator';

import ingredientsResponse from '@/data/server/ingredients.json';
import recipesResponse from '@/data/server/recipes.json';
import guidesResponse from '@/data/server/guides.json';
import userProfileResponse from '@/data/server/user-profile.json';

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

interface RawServerPayload {
  status?: 'success' | 'error';
  server_time: string;
  error?: { code: string; message: string; details?: unknown };
}

async function request<T>(raw: RawServerPayload, timeoutMs = 8000): Promise<ApiResponse<T>> {
  // 1. Cek mode offline (simulasi pengembang atau browser offline)
  if (networkSimulator.isSimulatedOffline) {
    await wait(200);
    throw ApiError.offline('Simulasi Mode Offline aktif');
  }

  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
    throw ApiError.offline('Koneksi internet browser terputus');
  }

  // 2. Cek simulasi server error 500
  if (networkSimulator.isSimulatedServerError) {
    await wait(networkSimulator.simulatedDelayMs);
    throw ApiError.server(500, 'Simulasi Server Error 500: Terjadi kegagalan komunikasi basis data.');
  }

  // 3. Eksekusi dengan dukungan timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(ApiError.timeout(timeoutMs));
    }, timeoutMs);
  });

  const fetchPromise = (async (): Promise<ApiResponse<T>> => {
    await wait(networkSimulator.simulatedDelayMs);

    // Cek jika server payload mengindikasikan status error
    if (raw.status === 'error') {
      throw new ApiError(raw.error?.message ?? 'Permintaan ditolak oleh server', {
        code: 'SERVER_ERROR',
        statusCode: 400,
        technicalMessage: raw.error?.code ?? 'SERVER_RETURNED_ERROR_STATUS',
      });
    }

    const offset = Date.now() - Date.parse(raw.server_time);
    const shifted = shiftDates(raw, offset) as ApiResponse<T>;
    return { ...shifted, server_time: new Date().toISOString() };
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

export const api = {
  getIngredients: () => request<IngredientDTO[]>(ingredientsResponse as RawServerPayload),
  getRecipes:     () => request<RecipeDTO[]>(recipesResponse as RawServerPayload),
  getGuides:      () => request<GuideDTO[]>(guidesResponse as RawServerPayload),
  getUserProfile: () => request<UserProfileDTO>(userProfileResponse as RawServerPayload),

  // Utilitas pengujian dan simulasi
  simulator: networkSimulator,
};

