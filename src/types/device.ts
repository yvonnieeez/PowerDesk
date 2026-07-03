import { z } from 'zod';

export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['fan', 'light']),
  status: z.enum(['on', 'off']),
  powerDraw: z.number(),
  room: z.string(),
  lastChanged: z.string(),
});

export type Device = z.infer<typeof DeviceSchema>;

export const DevicesArraySchema = z.array(DeviceSchema);
