import type { Client, TextChannel } from "discord.js";
import WebSocket from "ws";
import { config, logger } from "../config.js";
import { formatAlert } from "../formatters/alertFormatter.js";
import { alertPayloadSchema } from "../types.js";

let ws: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function startAlertListener(discordClient: Client): void {
  const channelId = config.ALERT_CHANNEL_ID;

  function connect(): void {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }

    logger.info("Connecting to backend WebSocket...");
    ws = new WebSocket(config.BACKEND_WS_URL);

    ws.on("open", () => {
      logger.info("WebSocket connected");
      reconnectDelay = 1000;
    });

    ws.on("message", (raw) => {
      try {
        const payload = JSON.parse(String(raw));
        if (payload.type !== "alert-triggered") return;

        const result = alertPayloadSchema.safeParse(payload);
        if (!result.success) {
          logger.warn("Invalid alert payload received");
          return;
        }

        const alert = result.data;
        const message = formatAlert(alert);
        logger.info({ room: alert.room, type: alert.type }, "Alert received");

        const channel = discordClient.channels.cache.get(channelId);
        if (channel?.isTextBased()) {
          (channel as TextChannel).send(message).catch((err) => {
            logger.error(err, "Failed to send alert to Discord channel");
          });
        } else {
          logger.warn(
            { channelId },
            "Alert channel not found or not text-based",
          );
        }
      } catch (error) {
        logger.error(error, "Failed to parse WebSocket message");
      }
    });

    ws.on("close", () => {
      logger.warn("WebSocket disconnected");
      ws = null;
      scheduleReconnect();
    });

    ws.on("error", (error) => {
      logger.error({ error }, "WebSocket error");
      ws = null;
      scheduleReconnect();
    });
  }

  function scheduleReconnect(): void {
    if (reconnectTimeout) return;

    logger.info({ delay: reconnectDelay }, "Scheduling WebSocket reconnect");

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      connect();
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
    }, reconnectDelay);
  }

  connect();
}
