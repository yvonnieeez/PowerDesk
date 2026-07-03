import { Client, Events, GatewayIntentBits } from "discord.js";
import { config, logger } from "./config.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onMessageCreate } from "./events/messageCreate.js";
import { onReady } from "./events/ready.js";
import { startAlertListener } from "./ws/alertListener.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  onReady(c);
  startAlertListener(c);
});

client.on(Events.MessageCreate, (message) => {
  onMessageCreate(message, client);
});

client.on(Events.InteractionCreate, (interaction) => {
  onInteractionCreate(interaction, client);
});

client.login(config.DISCORD_TOKEN).catch((error) => {
  logger.error(error, "Failed to login to Discord");
  process.exit(1);
});
