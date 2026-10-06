/**
 * DTO – Resep
 *
 * Field server yang tidak dipakai (`slug`, `author_id`, `calories`,
 * `created_at`, `updated_at`) tidak dimasukkan.
 */
export interface RecipeDTO {
  id: number;
  title: string;
  description: string;
  image_url: string;
  difficulty_label: string;
  rating: number;
  review_count: number;
  cook_time_minutes: number;
  source_location: string;
  ingredients_total: number;
  ingredients_available: number;
  estimated_saving_idr: number;
  is_featured: boolean;
}
