/**
 * Secure Storage Utility – FreshG (Sprint 04: Secure Token Storage)
 *
 * Menggunakan `expo-secure-store` untuk menyimpan kredensial/token secara aman
 * terenkripsi pada perangkat iOS & Android (Keychain / Keystore).
 * Dilengkapi fallback untuk web agar kompatibel di semua platform.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'freshg_access_token';
const USER_KEY = 'freshg_user_data';

export const authStorage = {
  /**
   * Mengambil access token dari Secure Storage
   */
  async getAccessToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('[SecureStore] Gagal mengambil access token:', e);
      return null;
    }
  },

  /**
   * Menyimpan access token ke Secure Storage
   */
  async setAccessToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(TOKEN_KEY, token);
        }
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn('[SecureStore] Gagal menyimpan access token:', e);
    }
  },

  /**
   * Menghapus access token dari Secure Storage (saat Logout)
   */
  async removeAccessToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(TOKEN_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('[SecureStore] Gagal menghapus access token:', e);
    }
  },

  /**
   * Mengambil data profil user yang tersimpan
   */
  async getStoredUser<T = unknown>(): Promise<T | null> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          raw = window.localStorage.getItem(USER_KEY);
        }
      } else {
        raw = await SecureStore.getItemAsync(USER_KEY);
      }
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  /**
   * Menyimpan data profil user
   */
  async setStoredUser(user: unknown): Promise<void> {
    try {
      const raw = JSON.stringify(user);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(USER_KEY, raw);
        }
        return;
      }
      await SecureStore.setItemAsync(USER_KEY, raw);
    } catch (e) {
      console.warn('[SecureStore] Gagal menyimpan profil user:', e);
    }
  },

  /**
   * Membersihkan seluruh sesi (Token + Profil)
   */
  async clearSession(): Promise<void> {
    await this.removeAccessToken();
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(USER_KEY);
        }
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (e) {
      console.warn('[SecureStore] Gagal membersihkan profil user:', e);
    }
  },
};

