import type { Client } from "discord.js";
import { logger } from "../config.js";

export function onReady(client: Client): void {
  logger.info(`Bot ready! Logged in as ${client.user?.tag ?? "unknown"}`);
}
