import { type PowerSummary, powerSummarySchema } from "../types.js";
import { apiClient } from "./client.js";
import { BotError } from "./errors.js";

export async function getPowerSummary(): Promise<PowerSummary> {
  const response = await apiClient.get("/api/power/summary");
  const result = powerSummarySchema.safeParse(response.data);
  if (!result.success) {
    throw new BotError(
      "Received malformed power summary from backend",
      "VALIDATION_ERROR",
    );
  }
  return result.data;
}
