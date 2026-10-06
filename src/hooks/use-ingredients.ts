/**
 * Alur: api (Server Data / DTO) → mapper → Application Data → UI
 */
import { api } from '@/data/services/api';
import { toIngredientList } from '@/data/mappers/ingredient.mapper';
import { useAsyncData } from './use-async-data';

async function fetchIngredients() {
  const response = await api.getIngredients(); // ApiResponse<IngredientDTO[]>
  return toIngredientList(response.data);     // Ingredient[]
}

export function useIngredients() {
  return useAsyncData(fetchIngredients);
}
