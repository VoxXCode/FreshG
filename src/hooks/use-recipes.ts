import { api } from '@/data/services/api';
import { toRecipeList } from '@/data/mappers/recipe.mapper';
import { toGuideList } from '@/data/mappers/guide.mapper';
import { useAsyncData } from './use-async-data';

async function fetchRecipes() {
  const response = await api.getRecipes();
  return toRecipeList(response.data);
}

async function fetchGuides() {
  const response = await api.getGuides();
  return toGuideList(response.data);
}

export function useRecipes() {
  return useAsyncData(fetchRecipes);
}

export function useGuides() {
  return useAsyncData(fetchGuides);
}
