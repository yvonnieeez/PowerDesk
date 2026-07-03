import { useQuery } from '@tanstack/react-query';
import { usePowerStore } from '../store/powerStore';
import { getPowerSummary } from '../api/power';

export function usePowerSummary() {
  const setPowerSummary = usePowerStore((state) => state.setPowerSummary);
  const powerSummary = usePowerStore((state) => state.powerSummary);

  const query = useQuery({
    queryKey: ['powerSummary'],
    queryFn: async () => {
      const data = await getPowerSummary();
      setPowerSummary(data);
      return data;
    },
    staleTime: 5000,
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
  });

  return {
    powerSummary: powerSummary ?? query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
