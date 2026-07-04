import type { ChatInputCommandInteraction, Message } from "discord.js";

export interface CommandContext {
  args: string[];
  reply: (content: string) => Promise<void>;
}

export type CommandHandler = (ctx: CommandContext) => Promise<void>;

const registry = new Map<string, CommandHandler>();

export function registerCommand(name: string, handler: CommandHandler): void {
  registry.set(name, handler);
}

export function getCommand(name: string): CommandHandler | undefined {
  return registry.get(name);
}

export function createPrefixContext(
  message: Message,
  args: string[],
): CommandContext {
  return {
    args,
    reply: async (content: string) => {
      await message.reply(content);
    },
  };
}

export function createSlashContext(
  interaction: ChatInputCommandInteraction,
): CommandContext {
  return {
    args: [],
    reply: async (content: string) => {
      await interaction.reply({ content, ephemeral: true });
    },
  };
}
