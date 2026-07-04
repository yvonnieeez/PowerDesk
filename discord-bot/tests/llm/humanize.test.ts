describe("humanize", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetModules();
  });

  async function loadHumanize(apiKey?: string) {
    jest.resetModules();
    jest.doMock("../../src/config.js", () => ({
      config: {
        GROQ_API_KEY: apiKey,
        GROQ_MODEL: "llama-3.3-70b-versatile",
      },
      logger: {
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
      },
    }));
    const mod = await import("../../src/llm/humanize");
    return mod.humanize;
  }

  it("returns undefined when API key is missing", async () => {
    const humanize = await loadHumanize(undefined);
    const result = await humanize("status", { devices: [] });
    expect(result).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns humanized text on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: "Everything looks good in the office!" } },
        ],
      }),
    });

    const humanize = await loadHumanize("sk-test-key");
    const result = await humanize("status", { devices: [] });
    expect(result).toBe("Everything looks good in the office!");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test-key",
        }),
      }),
    );
  });

  it("returns undefined on fetch failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const humanize = await loadHumanize("sk-test-key");
    const result = await humanize("status", { devices: [] });
    expect(result).toBeUndefined();
  });

  it("returns undefined on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
    });

    const humanize = await loadHumanize("sk-test-key");
    const result = await humanize("status", { devices: [] });
    expect(result).toBeUndefined();
  });

  it("returns undefined on empty choices", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    });

    const humanize = await loadHumanize("sk-test-key");
    const result = await humanize("status", { devices: [] });
    expect(result).toBeUndefined();
  });

  it("sends correct system prompt for each type", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    });

    const humanize = await loadHumanize("sk-test-key");

    await humanize("status", {});
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("friendly office assistant"),
      }),
    );

    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    });

    await humanize("usage", {});
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining("power consumption"),
      }),
    );
  });
});
