import { z } from "zod";

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

describe("config validation", () => {
  const validEnv = {
    DISCORD_TOKEN: "test-token",
    CLIENT_ID: "test-client",
    GUILD_ID: "test-guild",
    ALERT_CHANNEL_ID: "test-channel",
    BACKEND_BASE_URL: "http://localhost:3000",
    BACKEND_WS_URL: "ws://localhost:3000",
  };

  it("accepts valid environment variables", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it("rejects missing DISCORD_TOKEN", () => {
    const { DISCORD_TOKEN, ...envWithoutToken } = validEnv;
    const result = envSchema.safeParse(envWithoutToken);
    expect(result.success).toBe(false);
  });

  it("rejects missing CLIENT_ID", () => {
    const { CLIENT_ID, ...envWithoutClientId } = validEnv;
    const result = envSchema.safeParse(envWithoutClientId);
    expect(result.success).toBe(false);
  });

  it("rejects missing GUILD_ID", () => {
    const { GUILD_ID, ...envWithoutGuildId } = validEnv;
    const result = envSchema.safeParse(envWithoutGuildId);
    expect(result.success).toBe(false);
  });

  it("rejects missing ALERT_CHANNEL_ID", () => {
    const { ALERT_CHANNEL_ID, ...envWithoutAlertChannel } = validEnv;
    const result = envSchema.safeParse(envWithoutAlertChannel);
    expect(result.success).toBe(false);
  });

  it("rejects missing BACKEND_BASE_URL", () => {
    const { BACKEND_BASE_URL, ...envWithoutBackendUrl } = validEnv;
    const result = envSchema.safeParse(envWithoutBackendUrl);
    expect(result.success).toBe(false);
  });

  it("rejects missing BACKEND_WS_URL", () => {
    const { BACKEND_WS_URL, ...envWithoutWsUrl } = validEnv;
    const result = envSchema.safeParse(envWithoutWsUrl);
    expect(result.success).toBe(false);
  });

  it("rejects invalid BACKEND_BASE_URL", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      BACKEND_BASE_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("uses default values for optional fields", () => {
    const result = envSchema.safeParse(validEnv);
    if (result.success) {
      expect(result.data.COMMAND_PREFIX).toBe("!");
      expect(result.data.GROQ_MODEL).toBe("llama-3.3-70b-versatile");
      expect(result.data.GROQ_API_KEY).toBeUndefined();
    }
  });

  it("accepts optional GROQ_API_KEY", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      GROQ_API_KEY: "gsk-test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.GROQ_API_KEY).toBe("gsk-test");
    }
  });

  it("collects multiple errors for missing required fields", () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.format();
      const errorKeys = Object.keys(errors).filter((k) => k !== "_errors");
      expect(errorKeys.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("rejects empty string for required fields", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      DISCORD_TOKEN: "",
    });
    expect(result.success).toBe(false);
  });
});
