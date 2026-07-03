import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "../src/config.js";

const commands = [
  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Shows the current status of all office devices"),
  new SlashCommandBuilder()
    .setName("room")
    .setDescription("Shows device status for a specific room")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Room name (drawing, work1, work2)")
        .setRequired(true)
        .addChoices(
          { name: "Drawing Room", value: "drawing" },
          { name: "Work Room 1", value: "work1" },
          { name: "Work Room 2", value: "work2" },
        ),
    ),
  new SlashCommandBuilder()
    .setName("usage")
    .setDescription("Shows current power usage across the office"),
];

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

async function registerCommands(): Promise<void> {
  try {
    console.log("Registering slash commands...");

    const data = await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      { body: commands.map((cmd) => cmd.toJSON()) },
    );

    console.log(
      `Successfully registered ${(data as unknown[]).length} commands.`,
    );
  } catch (error) {
    console.error("Failed to register commands:", error);
    process.exit(1);
  }
}

registerCommands();
