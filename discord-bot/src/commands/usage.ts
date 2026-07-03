import { BotError } from "../api/errors.js";
import { getPowerSummary } from "../api/power.js";
import { logger } from "../config.js";
import { getErrorMessage } from "../errors.js";
import { formatUsage } from "../formatters/usageFormatter.js";
import { humanize } from "../llm/humanize.js";
import type { CommandContext } from "./index.js";
import { registerCommand } from "./index.js";

async function handleUsage(ctx: CommandContext): Promise<void> {
  try {
    const summary = await getPowerSummary();
    const templateResponse = formatUsage(summary);

    let response = templateResponse;
    try {
      const humanized = await humanize("usage", summary);
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
      logger.error(error, "Unexpected error in !usage");
      await ctx.reply(getErrorMessage("UNEXPECTED"));
    }
  }
}

registerCommand("usage", handleUsage);
