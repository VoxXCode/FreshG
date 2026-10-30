/**
 * Types & DTO – Autentikasi & Manajemen Sesi (Week 5: Sprint 04)
 */
import type { UserProfileDTO } from '@/data/dto/user.dto';
import type { UserProfile } from '@/types/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: UserProfileDTO;
}

export interface AuthContextValue {
  user: UserProfile | null;
  rawUser: UserProfileDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

