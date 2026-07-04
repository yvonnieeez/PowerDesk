import { getAllDevices } from "../api/devices.js";
import { BotError } from "../api/errors.js";
import { logger } from "../config.js";
import { getErrorMessage } from "../errors.js";
import { formatStatus } from "../formatters/statusFormatter.js";
import { humanize } from "../llm/humanize.js";
import type { CommandContext } from "./index.js";
import { registerCommand } from "./index.js";

async function handleStatus(ctx: CommandContext): Promise<void> {
  try {
    const devices = await getAllDevices();
    const templateResponse = formatStatus(devices);

    let response = templateResponse;
    try {
      const humanized = await humanize("status", devices);
      if (humanized) {
        response = humanized;
      }
    } catch {
      logger.warn("LLM humanization failed, using template formatter");
    }

    await ctx.reply(response);
  } catch (error) {
    if (error instanceof BotError) {
      await ctx.reply(error.message);
    } else {
      logger.error(error, "Unexpected error in !status");
      await ctx.reply(getErrorMessage("UNEXPECTED"));
    }
  }
}

registerCommand("status", handleStatus);
