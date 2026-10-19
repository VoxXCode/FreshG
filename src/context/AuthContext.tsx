/**
 * AuthContext.tsx
 * Contoh implementasi AuthContext menggunakan users.json sebagai seed data.
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import seedUsers from "../data/users.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  password: string;
  pin: string;
  createdAt: string;
}

interface AuthContextValue {
  currentUser: Omit<User, "password" | "pin"> | null;
  users: User[];
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (newUser: Omit<User, "id" | "createdAt">) => Promise<boolean>;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  /** Muat seed data dari JSON; pada produksi ganti dengan AsyncStorage / API */
  const [users, setUsers] = useState<User[]>(seedUsers as User[]);
  const [currentUser, setCurrentUser] = useState<Omit<User, "password" | "pin"> | null>(null);

  /**
   * login()
   * Cocokkan identifier (email ATAU username) + password.
   * Return true jika berhasil, false jika gagal.
   */
  const login = async (identifier: string, password: string): Promise<boolean> => {
    const trimmedId = identifier.trim().toLowerCase();
    const found = users.find(
      (u) =>
        (u.email === trimmedId || u.username === trimmedId) &&
        u.password === password
    );

    if (!found) return false;

    // Simpan sesi tanpa credential sensitif
    const { password: _pwd, pin: _pin, ...safeUser } = found;
    setCurrentUser(safeUser);
    return true;
  };

  /**
   * register()
   * Tambah user baru ke state; validasi duplikasi email & username.
   */
  const register = async (
    newUser: Omit<User, "id" | "createdAt">
  ): Promise<boolean> => {
    const emailExists = users.some((u) => u.email === newUser.email.toLowerCase());
    const usernameExists = users.some((u) => u.username === newUser.username.toLowerCase());

    if (emailExists || usernameExists) return false;

    const created: User = {
      ...newUser,
      email: newUser.email.toLowerCase(),
      username: newUser.username.toLowerCase(),
      id: `u${String(users.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, created]);
    return true;
  };

  const logout = () => setCurrentUser(null);

  return (
    <AuthContext.Provider value={{ currentUser, users, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

