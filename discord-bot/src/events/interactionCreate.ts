import type { Client, Interaction } from "discord.js";
import { createSlashContext, getCommand } from "../commands/index.js";
import { logger } from "../config.js";

// Import command registrations
import "../commands/status.js";
import "../commands/room.js";
import "../commands/usage.js";

export function onInteractionCreate(
  interaction: Interaction,
  _client: Client,
): void {
  if (!interaction.isChatInputCommand()) return;

  const handler = getCommand(interaction.commandName);
  if (!handler) return;

  logger.info(
    {
      command: interaction.commandName,
      user: interaction.user.tag,
      guild: interaction.guild?.name,
    },
    "Slash command received",
  );

  const ctx = createSlashContext(interaction);

  // Handle options for /room command
  if (interaction.commandName === "room") {
    const name = interaction.options.getString("name");
    if (name) {
      ctx.args = [name];
    }
  }

  handler(ctx).catch((error) => {
    logger.error(error, "Unhandled error in slash command handler");
  });
}
