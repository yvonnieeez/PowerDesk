import { config as loadEnv } from "dotenv";
import pino from "pino";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
  CLIENT_ID: z.string().min(1, "CLIENT_ID is required"),
  GUILD_ID: z.string().min(1, "GUILD_ID is required"),
  ALERT_CHANNEL_ID: z.string().min(1, "ALERT_CHANNEL_ID is required"),
  BACKEND_BASE_URL: z.string().url("BACKEND_BASE_URL must be a valid URL"),
  BACKEND_WS_URL: z.string().min(1, "BACKEND_WS_URL is required"),
  COMMAND_PREFIX: z.string().default("!"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.format();
    console.error("\n❌ Environment configuration errors:\n");
    for (const [key, value] of Object.entries(errors)) {
      if (key === "_errors") continue;
      if (typeof value === "object" && value !== null && "_errors" in value) {
        const errs = (value as { _errors: string[] })._errors;
        if (errs.length > 0) {
          console.error(`  ${key}: ${errs.join(", ")}`);
        }
      }
    }
    console.error("\nCopy .env.example to .env and fill in the values.\n");
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
