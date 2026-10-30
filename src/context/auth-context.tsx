/**
 * Auth Context & Provider – FreshG (Sprint 04: Session Management)
 *
 * Mengelola status autentikasi aplikasi:
 * - Membaca token dari SecureStore saat startup
 * - Login: request API -> dapatkan token -> simpan ke SecureStore -> update state
 * - Logout: hapus token dari SecureStore -> bersihkan state -> navigasi ke login
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authStorage } from '@/utils/auth-storage';
import { api } from '@/data/services/api';
import { toUserProfile } from '@/data/mappers/user.mapper';
import type { AuthContextValue, LoginCredentials } from '@/types/auth';
import type { UserProfile } from '@/types/user';
import type { UserProfileDTO } from '@/data/dto/user.dto';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rawUser, setRawUser] = useState<UserProfileDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inisialisasi: baca token dari Secure Storage secara asynchronous saat startup
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        console.log('[Auth] [1] Memeriksa sesi tersimpan di SecureStore...');
        const storedToken = await authStorage.getAccessToken();
        const storedUser = await authStorage.getStoredUser<UserProfileDTO>();

        if (!isMounted) return;

        if (storedToken && storedUser) {
          setToken(storedToken);
          setRawUser(storedUser);
          setUser(toUserProfile(storedUser));
          console.log('[Auth] [1] Sesi aktif ditemukan di SecureStore. Token:', storedToken.substring(0, 20) + '...');
        } else {
          console.log('[Auth] [1] Belum ada sesi login tersimpan di SecureStore.');
        }
      } catch (error) {
        console.warn('[Auth] Gagal membaca session dari SecureStore:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Login method (Task 01)
   */
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Auth] [2] Mengirim kredensial ke API Login...');
      const response = await api.login(credentials);

      const accessToken = response.access_token;
      const userDTO = response.user;

      console.log('[Auth] [3] Token diterima dari API. Menyimpan ke SecureStore...');
      await authStorage.setAccessToken(accessToken);
      await authStorage.setStoredUser(userDTO);
      console.log('[Auth] [4] Token berhasil disimpan di SecureStore.');

      // Update state aplikasi (Task 01: Authentication State)
      setToken(accessToken);
      setRawUser(userDTO);
      setUser(toUserProfile(userDTO));

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat login.';
      console.error('[Auth] Login gagal:', message);
      return { success: false, error: message };
    }
  };

  /**
   * Logout method (Task 03)
   */
  const logout = async (): Promise<void> => {
    try {
      console.log('[Auth] [8] Logout dipicu -> Menghapus access_token dari SecureStore...');
      await authStorage.clearSession();
      setToken(null);
      setRawUser(null);
      setUser(null);
      console.log('[Auth] [8] Token dihapus dari SecureStore. Sesi pengguna berakhir.');
    } catch (error) {
      console.error('[Auth] Gagal saat proses logout:', error);
    }
  };

  const value: AuthContextValue = {
    user,
    rawUser,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
