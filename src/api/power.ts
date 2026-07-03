import { apiClient } from './client';
import type { PowerSummary } from '../types/power';
import { PowerSummarySchema } from '../types/power';

export async function getPowerSummary(): Promise<PowerSummary> {
  const response = await apiClient.get('/api/power/summary');
  return PowerSummarySchema.parse(response.data);
}
