/**
 * API Service – FreshG (Sprint 04: Secure API & Token-Based Authentication)
 *
 * Mengimplementasikan:
 * 1. Login endpoint (`POST /login`) yang mengembalikan Access Token (JWT format).
 * 2. Protected Endpoints: Setiap request menyertakan token dari SecureStore
 *    melalui header `Authorization: Bearer <token>`.
 * 3. Token validation: Menolak request jika token tidak disertakan (401 Unauthorized).
 */
import type { ApiResponse } from '@/data/dto/api-response.dto';
import type { IngredientDTO } from '@/data/dto/ingredient.dto';
import type { RecipeDTO } from '@/data/dto/recipe.dto';
import type { GuideDTO } from '@/data/dto/guide.dto';
import type { UserProfileDTO } from '@/data/dto/user.dto';
import type { LoginCredentials, LoginResponseDTO } from '@/types/auth';
import { authStorage } from '@/utils/auth-storage';

import ingredientsResponse from '@/data/server/ingredients.json';
import recipesResponse from '@/data/server/recipes.json';
import guidesResponse from '@/data/server/guides.json';
import userProfileResponse from '@/data/server/user-profile.json';

const NETWORK_DELAY_MS = 400;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Token JWT simulasi yang valid sesuai struktur Header.Payload.Signature (Slide 6 & 13)
 */
const SAMPLE_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiI5MDIxNCIsIm5hbWUiOiJTYXJpIFJhaG1hd2F0aSIsImVtYWlsIjoic2FyaS5yYWhtYXdhdGlAZW1haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTgwNzY4OTYwMH0.' +
  '3kE5f6G9L1q2W4r5T7u8V9x0Z1a2B3c4D5e6F7g8H9i';

/**
 * Menggeser field tanggal relatif terhadap waktu sekarang
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

/**
 * Wrapper request ke API yang memvalidasi header Authorization (Protected Endpoint)
 */
async function request<T>(
  raw: { server_time: string },
  endpoint: string,
  requiresAuth: boolean = true
): Promise<ApiResponse<T>> {
  await wait(NETWORK_DELAY_MS);

  if (requiresAuth) {
    // Task 02: Membaca token dari Secure Storage dan melampirkan ke Request
    const token = await authStorage.getAccessToken();

    console.log(`[API] [5] Request -> GET /${endpoint}`);
    if (token) {
      console.log(`[API] [6] Headers: Authorization: Bearer ${token.substring(0, 24)}...`);
      console.log(`[API] [7] Response: 200 OK (Data terproteksi berhasil diambil)`);
    } else {
      console.warn(`[API] [7] Response: 401 Unauthorized -> Akses ke /${endpoint} ditolak tanpa token!`);
      throw new Error(`401 Unauthorized: Akses ditolak. Token autentikasi tidak ditemukan.`);
    }
  }

  const offset = Date.now() - Date.parse(raw.server_time);
  const shifted = shiftDates(raw, offset) as ApiResponse<T>;
  return { ...shifted, server_time: new Date().toISOString() };
}

export const api = {
  /**
   * Endpoint Login (Task 01)
   * Mengirim kredensial dan menerima Access Token
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponseDTO> => {
    await wait(NETWORK_DELAY_MS);

    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    console.log('[API] [2] Login request -> POST /login', { email });

    if (!email || !password) {
      throw new Error('Email dan kata sandi wajib diisi.');
    }

    if (password.length < 6) {
      throw new Error('Kata sandi minimal 6 karakter.');
    }

    // Validasi akun demo jika menggunakan email bawaan
    if (email === 'sari.rahmawati@email.com' && password !== 'password123') {
      throw new Error('Kata sandi salah. Gunakan: password123');
    }

    const userData: UserProfileDTO = {
      ...userProfileResponse.data,
      email: email,
      full_name: email === 'sari.rahmawati@email.com' ? userProfileResponse.data.full_name : email.split('@')[0],
    };

    console.log('[API] [3] Response: 200 OK -> access_token (JWT) berhasil diterbitkan');

    return {
      access_token: SAMPLE_JWT_TOKEN,
      token_type: 'Bearer',
      expires_in: 86400,
      user: userData,
    };
  },

  // Protected Endpoints (Task 02)
  getIngredients: () => request<IngredientDTO[]>(ingredientsResponse, 'ingredients', true),
  getRecipes:     () => request<RecipeDTO[]>(recipesResponse, 'recipes', true),
  getGuides:      () => request<GuideDTO[]>(guidesResponse, 'guides', true),
  getUserProfile: () => request<UserProfileDTO>(userProfileResponse, 'user/profile', true),
};
