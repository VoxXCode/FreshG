/**
 * Alur: api (Server Data / DTO) → mapper → Application Data → UI
 */
import { api } from '@/data/services/api';
import { toIngredientList } from '@/data/mappers/ingredient.mapper';
import { useAsyncData, type AsyncDataOptions } from './use-async-data';

async function fetchIngredients() {
  const response = await api.getIngredients(); // ApiResponse<IngredientDTO[]>
  return toIngredientList(response.data);     // Ingredient[]
}

export function useIngredients(options?: AsyncDataOptions) {
  return useAsyncData(fetchIngredients, options);
}

