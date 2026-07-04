import { getDevicesByRoom } from "../api/devices.js";
import { BotError } from "../api/errors.js";
import { logger } from "../config.js";
import { getErrorMessage } from "../errors.js";
import { formatRoom } from "../formatters/roomFormatter.js";
import { humanize } from "../llm/humanize.js";
import type { CommandContext } from "./index.js";
import { registerCommand } from "./index.js";

const ALIAS_MAP: Record<string, string> = {
  drawing: "drawing-room",
  "drawing room": "drawing-room",
  work1: "work-room-1",
  "work room 1": "work-room-1",
  work2: "work-room-2",
  "work room 2": "work-room-2",
};

function resolveRoom(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  return ALIAS_MAP[normalized] ?? null;
}

async function handleRoom(ctx: CommandContext): Promise<void> {
  if (ctx.args.length === 0) {
    await ctx.reply(getErrorMessage("MISSING_ROOM_ARG"));
    return;
  }

  const input = ctx.args.join(" ");
  const roomId = resolveRoom(input);

  if (!roomId) {
    await ctx.reply(getErrorMessage("INVALID_ROOM"));
    return;
  }

  try {
    const devices = await getDevicesByRoom(roomId);
    const templateResponse = formatRoom(roomId, devices);

    let response = templateResponse;
    try {
      const humanized = await humanize("room", { room: roomId, devices });
      if (humanized) {
        response = humanized;
      }
    } catch {
      logger.warn("LLM humanization failed, using template formatter");
    }

    await ctx.reply(response);
  } catch (error) {
    if (error instanceof BotError) {
      if (error.code === "NOT_FOUND") {
        await ctx.reply(getErrorMessage("INVALID_ROOM"));
      } else {
        await ctx.reply(error.message);
      }
    } else {
      logger.error(error, "Unexpected error in !room");
      await ctx.reply(getErrorMessage("UNEXPECTED"));
    }
  }
}

registerCommand("room", handleRoom);
