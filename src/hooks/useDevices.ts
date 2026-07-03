import { useQuery } from '@tanstack/react-query';
import { useDeviceStore } from '../store/deviceStore';
import { getDevices } from '../api/devices';

export function useDevices() {
  const setDevices = useDeviceStore((state) => state.setDevices);
  const devices = useDeviceStore((state) => state.devices);

  const query = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const data = await getDevices();
      setDevices(data);
      return data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  return {
    devices: devices.length > 0 ? devices : (query.data ?? []),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
