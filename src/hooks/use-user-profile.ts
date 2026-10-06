import { api } from '@/data/services/api';
import { toUserProfile } from '@/data/mappers/user.mapper';
import { useAsyncData } from './use-async-data';

async function fetchUserProfile() {
  const response = await api.getUserProfile();
  return toUserProfile(response.data);
}

export function useUserProfile() {
  return useAsyncData(fetchUserProfile);
}
