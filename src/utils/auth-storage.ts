import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'freshg_access_token';
const USER_KEY = 'freshg_user_data';

export const authStorage = {
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

