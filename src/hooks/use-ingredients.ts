import { api } from '@/data/services/api';
import { toIngredientList } from '@/data/mappers/ingredient.mapper';
import { useAsyncData } from './use-async-data';

async function fetchIngredients() {
  const response = await api.getIngredients();
  return toIngredientList(response.data);
}

export function useIngredients() {
  return useAsyncData(fetchIngredients);
}
