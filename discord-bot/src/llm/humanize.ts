import { config, logger } from "../config.js";
import type { HumanizeType } from "../types.js";

const SYSTEM_PROMPTS: Record<HumanizeType, string> = {
  status: `You are a friendly office assistant. Given device state data, write a 2-3 sentence summary in a casual, slightly warm tone. Mention rooms with unusual situations (all on, all off, partially on). Keep it under 100 words. Do not invent data — only describe what's in the provided data.`,
  room: `You are a friendly office assistant. Given device data for a single room, write a brief 1-2 sentence summary about the room's current state. Mention which devices are on/off and total power draw. Keep it casual and under 80 words.`,
  usage: `You are a friendly office assistant. Given power usage data, write a brief 2-3 sentence summary about current office power consumption. Mention the total watts and any notable room differences. Keep it casual and under 100 words.`,
  alert: `You are a friendly office assistant. Given an alert about devices left on, write a brief 1-2 sentence warning in a concerned but helpful tone. Mention the room and what's happening. Keep it under 60 words.`,
};

const MAX_OUTPUT_CHARS = 1800;
const FETCH_TIMEOUT_MS = 10000;

export async function humanize(
  type: HumanizeType,
  data: unknown,
): Promise<string | undefined> {
  if (!config.GROQ_API_KEY) {
    return undefined;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.GROQ_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPTS[type] },
            { role: "user", content: JSON.stringify(data) },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      logger.warn({ status: response.status, type }, "Groq API request failed");
      return undefined;
    }

    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      logger.warn({ type }, "Empty LLM response");
      return undefined;
    }

    logger.debug(
      {
        type,
        promptTokens: result.usage?.prompt_tokens,
        completionTokens: result.usage?.completion_tokens,
      },
      "LLM humanization successful",
    );
    return content.length > MAX_OUTPUT_CHARS ? content.slice(0, MAX_OUTPUT_CHARS) : content;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      logger.warn({ type }, "Groq API request timed out");
      return undefined;
    }
    logger.warn({ type, error }, "LLM humanization failed");
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
