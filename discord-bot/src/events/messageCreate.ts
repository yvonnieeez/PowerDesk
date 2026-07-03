import type { Client, Message } from "discord.js";
import { createPrefixContext, getCommand } from "../commands/index.js";
import { config, logger } from "../config.js";

// Import command registrations
import "../commands/status.js";
import "../commands/room.js";
import "../commands/usage.js";

export function onMessageCreate(message: Message, _client: Client): void {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(config.COMMAND_PREFIX)) return;

  const args = message.content
    .slice(config.COMMAND_PREFIX.length)
    .trim()
    .split(/\s+/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  const handler = getCommand(commandName);
  if (!handler) return;

  logger.info(
    {
      command: commandName,
      user: message.author.tag,
      guild: message.guild.name,
    },
    "Prefix command received",
  );

  const ctx = createPrefixContext(message, args);
  handler(ctx).catch((error) => {
    logger.error(error, "Unhandled error in command handler");
  });
}
