/**
 * DTO (Data Transfer Object) – Bahan Makanan
 *
 * Hanya berisi field dari server yang DIBUTUHKAN aplikasi.
 * Field seperti `user_id`, `barcode`, `created_at`, `updated_at`
 * sengaja tidak diambil.
 *
 * Penamaan tetap mengikuti server (snake_case) dan tipe data mentah
 * (tanggal masih berupa string ISO).
 */
export interface IngredientDTO {
  id: number;
  ingredient_name: string;
  category_name: string;
  storage_location: string;
  quantity_label: string | null;
  storage_note: string | null;
  added_at: string;
  expired_at: string;
  shelf_life_days: number;
  status: string;
}
