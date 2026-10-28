import { api } from '@/data/services/api';
import { toRecipeList } from '@/data/mappers/recipe.mapper';
import { toGuideList } from '@/data/mappers/guide.mapper';
import { useAsyncData, type AsyncDataOptions } from './use-async-data';

async function fetchRecipes() {
  const response = await api.getRecipes();
  return toRecipeList(response.data);
}

async function fetchGuides() {
  const response = await api.getGuides();
  return toGuideList(response.data);
}

export function useRecipes(options?: AsyncDataOptions) {
  return useAsyncData(fetchRecipes, options);
}

export function useGuides(options?: AsyncDataOptions) {
  return useAsyncData(fetchGuides, options);
}

