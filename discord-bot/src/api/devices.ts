import { type Device, deviceSchema } from "../types.js";
import { apiClient } from "./client.js";
import { BotError } from "./errors.js";

export async function getAllDevices(): Promise<Device[]> {
  const response = await apiClient.get("/api/devices");
  const result = deviceSchema.array().safeParse(response.data);
  if (!result.success) {
    throw new BotError(
      "Received malformed device data from backend",
      "VALIDATION_ERROR",
    );
  }
  return result.data;
}

export async function getDevicesByRoom(room: string): Promise<Device[]> {
  const response = await apiClient.get(
    `/api/devices/${encodeURIComponent(room)}`,
  );
  const result = deviceSchema.array().safeParse(response.data);
  if (!result.success) {
    throw new BotError(
      "Received malformed device data from backend",
      "VALIDATION_ERROR",
    );
  }
  return result.data;
}
