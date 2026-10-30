/**
 * API Service – FreshG
 * (Sprint 04: Secure API & Sprint 05: Error Handling, Timeout, and Offline)
 *
 * Mengimplementasikan:
 * 1. Token-Based Authentication (JWT Bearer Authorization Header)
 * 2. HTTP Status Code validation (2xx Success, 4xx Client Error, 5xx Server Error)
 * 3. Timeout Handling (Pembatalan otomatis jika response melewati batas waktu)
 * 4. Offline Handling (Deteksi tidak ada internet sebelum/saat request)
 * 5. Simulation tools (Untuk mendemonstrasikan skenario 500, 404, Timeout, Offline)
 */
import type { ApiResponse } from '@/data/dto/api-response.dto';
import type { IngredientDTO } from '@/data/dto/ingredient.dto';
import type { RecipeDTO } from '@/data/dto/recipe.dto';
import type { GuideDTO } from '@/data/dto/guide.dto';
import type { UserProfileDTO } from '@/data/dto/user.dto';
import type { LoginCredentials, LoginResponseDTO } from '@/types/auth';
import { ApiError } from '@/types/api-error';
import { authStorage } from '@/utils/auth-storage';
import { getSimulatedOffline } from '@/hooks/use-network-status';

import ingredientsResponse from '@/data/server/ingredients.json';
import recipesResponse from '@/data/server/recipes.json';
import guidesResponse from '@/data/server/guides.json';
import userProfileResponse from '@/data/server/user-profile.json';

const NETWORK_DELAY_MS = 400;
const DEFAULT_TIMEOUT_MS = 10000; // 10 detik batas waktu tunggu (Slide 6)

// Konfigurasi simulasi untuk keperluan Demo Pengujian (Slide 9 & 12)
export type SimulatedErrorType = 'none' | '500' | '404' | 'timeout' | 'empty';
let activeSimulation: SimulatedErrorType = 'none';

export function setSimulatedError(type: SimulatedErrorType) {
  activeSimulation = type;
  console.log(`[API] Mode simulasi diubah menjadi: ${type}`);
}

export function getSimulatedError(): SimulatedErrorType {
  return activeSimulation;
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const SAMPLE_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiI5MDIxNCIsIm5hbWUiOiJTYXJpIFJhaG1hd2F0aSIsImVtYWlsIjoic2FyaS5yYWhtYXdhdGlAZW1haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTgwNzY4OTYwMH0.' +
  '3kE5f6G9L1q2W4r5T7u8V9x0Z1a2B3c4D5e6F7g8H9i';

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

/**
 * Wrapper request ke API dengan perlindungan Token, Timeout, dan Error Handling
 */
async function request<T>(
  raw: { server_time: string; data?: unknown },
  endpoint: string,
  requiresAuth: boolean = true,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ApiResponse<T>> {
  console.log(`[API] [Request] GET /${endpoint}`);

  // 1. Pengecekan Kondisi Offline (Sprint 05: Offline Handling)
  if (getSimulatedOffline()) {
    console.warn(`[API] [Offline] Perangkat offline, request dibatalkan.`);
    throw new ApiError(
      'OFFLINE',
      'Tidak ada koneksi internet.',
      undefined,
      'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.'
    );
  }

  // 2. Timeout Wrapper Promise (Sprint 05: Timeout Handling)
  const executeRequest = async (): Promise<ApiResponse<T>> => {
    // Simulasi Delay Network
    await wait(NETWORK_DELAY_MS);

    // Cek Simulasi Error untuk Demo
    if (activeSimulation === 'timeout') {
      // Tunggu melebihi timeout untuk memicu timeout error
      await wait(timeoutMs + 500);
    }

    if (activeSimulation === '500') {
      console.warn(`[API] [Error 500] Simulasi 500 Internal Server Error`);
      throw new ApiError(
        'SERVER_ERROR',
        'HTTP 500 Internal Server Error',
        500,
        'Terjadi kesalahan pada server (500 Internal Server Error). Silakan coba lagi.'
      );
    }

    if (activeSimulation === '404') {
      console.warn(`[API] [Error 404] Simulasi 404 Not Found`);
      throw new ApiError(
        'CLIENT_ERROR',
        'HTTP 404 Not Found',
        404,
        'Data yang dicari tidak ditemukan (404 Not Found).'
      );
    }

    if (activeSimulation === 'empty') {
      console.log(`[API] [Empty] Simulasi data kosong`);
      return {
        status: 'success',
        server_time: new Date().toISOString(),
        data: [] as unknown as T,
      };
    }

    // 3. Pengecekan Autentikasi (Sprint 04: Token Bearer)
    if (requiresAuth) {
      const token = await authStorage.getAccessToken();

      if (token) {
        console.log(`[API] [Headers] Authorization: Bearer ${token.substring(0, 20)}...`);
        console.log(`[API] [200 OK] Data berhasil dimuat untuk /${endpoint}`);
      } else {
        console.warn(`[API] [401 Unauthorized] Request ditolak karena token tidak ada`);
        throw new ApiError(
          'CLIENT_ERROR',
          'HTTP 401 Unauthorized',
          401,
          'Sesi Anda telah berakhir atau belum login (401 Unauthorized).'
        );
      }
    }

    const offset = Date.now() - Date.parse(raw.server_time);
    const shifted = shiftDates(raw, offset) as ApiResponse<T>;
    return { ...shifted, server_time: new Date().toISOString() };
  };

  // Balapan antara request normal dengan timer timeout
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      console.warn(`[API] [Timeout] Request /${endpoint} melebihi batas waktu ${timeoutMs}ms`);
      reject(
        new ApiError(
          'TIMEOUT',
          'Request timed out',
          408,
          'Waktu habis (timeout). Server terlalu lama merespons. Silakan coba lagi.'
        )
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([executeRequest(), timeoutPromise]);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export const api = {
  /**
   * Endpoint Login
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponseDTO> => {
    if (getSimulatedOffline()) {
      throw new ApiError(
        'OFFLINE',
        'Tidak ada koneksi internet.',
        undefined,
        'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.'
      );
    }

    await wait(NETWORK_DELAY_MS);

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    console.log('[API] [2] POST /login -> Validasi kredensial pengguna');

    if (!email || !password) {
      throw new ApiError('CLIENT_ERROR', 'Input tidak lengkap', 400, 'Email dan kata sandi wajib diisi.');
    }

    if (password.length < 6) {
      throw new ApiError('CLIENT_ERROR', 'Password terlalu pendek', 400, 'Kata sandi minimal 6 karakter.');
    }

    if (email === 'sari.rahmawati@email.com' && password !== 'password123') {
      throw new ApiError('CLIENT_ERROR', 'Kredensial salah', 401, 'Kata sandi salah. Gunakan: password123');
    }

    const userData: UserProfileDTO = {
      ...userProfileResponse.data,
      email: email,
      full_name: email === 'sari.rahmawati@email.com' ? userProfileResponse.data.full_name : email.split('@')[0],
    };

    console.log('[API] [3] 200 OK -> access_token (JWT) diterbitkan');

    return {
      access_token: SAMPLE_JWT_TOKEN,
      token_type: 'Bearer',
      expires_in: 86400,
      user: userData,
    };
  },

  // Protected Endpoints dengan Error Handling & Timeout
  getIngredients: () => request<IngredientDTO[]>(ingredientsResponse, 'ingredients', true),
  getRecipes:     () => request<RecipeDTO[]>(recipesResponse, 'recipes', true),
  getGuides:      () => request<GuideDTO[]>(guidesResponse, 'guides', true),
  getUserProfile: () => request<UserProfileDTO>(userProfileResponse, 'user/profile', true),

  // Kontrol simulasi untuk demo/evaluasi praktikum
  setSimulatedError,
  getSimulatedError,
};
