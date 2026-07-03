import { z } from 'zod';

export const PowerSummarySchema = z.object({
  totalWatts: z.number(),
  estimatedKwhToday: z.number(),
  perRoom: z.record(z.string(), z.number()),
});

export type PowerSummary = z.infer<typeof PowerSummarySchema>;

export const PowerReadingSchema = z.object({
  time: z.string(),
  watts: z.number(),
});

export type PowerReading = z.infer<typeof PowerReadingSchema>;
