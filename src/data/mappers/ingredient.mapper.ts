/**
 * MAPPER – IngredientDTO → Ingredient
 *
 * Mapping data      : snake_case (server)  → camelCase (aplikasi)
 * Data transformation:
 *   - id number           → string
 *   - tanggal string ISO  → Date
 *   - null                → undefined
 *   - string bebas        → union type yang valid (dengan fallback)
 */
import type { IngredientDTO } from '@/data/dto/ingredient.dto';
import {
  CATEGORIES,
  STORAGE_LOCATIONS,
  type Category,
  type Ingredient,
  type IngredientStatus,
  type StorageLocation,
} from '@/types/ingredient';

const STATUSES: IngredientStatus[] = ['active', 'used', 'discarded'];

function toCategory(value: string): Category {
  return (CATEGORIES as string[]).includes(value) ? (value as Category) : 'Kering';
}

function toStorageLocation(value: string): StorageLocation {
  return (STORAGE_LOCATIONS as string[]).includes(value) ? (value as StorageLocation) : 'Lemari';
}

function toStatus(value: string): IngredientStatus {
  return (STATUSES as string[]).includes(value) ? (value as IngredientStatus) : 'active';
}

export function toIngredient(dto: IngredientDTO): Ingredient {
  return {
    id: String(dto.id),
    name: dto.ingredient_name,
    category: toCategory(dto.category_name),
    storageLocation: toStorageLocation(dto.storage_location),
    addedDate: new Date(dto.added_at),
    expiryDate: new Date(dto.expired_at),
    totalDays: dto.shelf_life_days,
    status: toStatus(dto.status),
    quantity: dto.quantity_label ?? undefined,
    note: dto.storage_note ?? undefined,
  };
}

export function toIngredientList(dtos: IngredientDTO[]): Ingredient[] {
  return dtos.map(toIngredient);
}
