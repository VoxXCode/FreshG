/**
 * Application Data – Resep
 * Model yang dipakai langsung oleh UI (camelCase, tipe sudah sesuai).
 */
import type { StorageLocation } from './ingredient';

export interface Recipe {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tagLabel: string;
  rating: number;
  reviewCount: number;
  cookTimeMinutes: number;
  sourceLocation: StorageLocation;
  ingredientsTotal: number;
  ingredientsAvailable: number;
  estimatedSaving: number; // Rupiah
  isFeatured: boolean;
}
