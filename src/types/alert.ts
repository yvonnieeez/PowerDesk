import { z } from 'zod';

export const AlertSchema = z.object({
  id: z.string(),
  type: z.enum(['after-hours', 'extended-on', 'high-power']),
  room: z.string(),
  message: z.string(),
  triggeredAt: z.string(),
});

export type Alert = z.infer<typeof AlertSchema>;
