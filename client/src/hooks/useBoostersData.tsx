import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Booster {
  id: string;
  boosterId: string; // This is the unique identifier used in the backend constants
  name: string;
  price: number;
  powerIncrease: number;
}

const fetchBoostersData = async (): Promise<Booster[]> => {
  const { data } = await api.get(`/api/boosters`);
  return data;
};

export const useBoostersData = () => {
  return useQuery<Booster[], Error>({
    queryKey: ['boosters'],
    queryFn: fetchBoostersData,
  });
};