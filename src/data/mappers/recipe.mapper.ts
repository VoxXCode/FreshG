/**
 * MAPPER – RecipeDTO → Recipe
 */
import type { RecipeDTO } from '@/data/dto/recipe.dto';
import type { Recipe } from '@/types/recipe';
import { STORAGE_LOCATIONS, type StorageLocation } from '@/types/ingredient';

function toStorageLocation(value: string): StorageLocation {
  return (STORAGE_LOCATIONS as string[]).includes(value) ? (value as StorageLocation) : 'Kulkas';
}

export function toRecipe(dto: RecipeDTO): Recipe {
  return {
    id: String(dto.id),
    title: dto.title,
    description: dto.description,
    imageUrl: dto.image_url,
    tagLabel: dto.difficulty_label,
    rating: dto.rating,
    reviewCount: dto.review_count,
    cookTimeMinutes: dto.cook_time_minutes,
    sourceLocation: toStorageLocation(dto.source_location),
    ingredientsTotal: dto.ingredients_total,
    // pastikan tidak melebihi total
    ingredientsAvailable: Math.min(dto.ingredients_available, dto.ingredients_total),
    estimatedSaving: dto.estimated_saving_idr,
    isFeatured: dto.is_featured,
  };
}

export function toRecipeList(dtos: RecipeDTO[]): Recipe[] {
  return dtos.map(toRecipe);
}
