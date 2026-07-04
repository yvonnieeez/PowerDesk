import pino from "pino";

describe("logger configuration", () => {
  it("creates a logger with default info level", () => {
    const logger = pino({ level: "info" });
    expect(logger.level).toBe("info");
  });

  it("creates a logger with custom level", () => {
    const logger = pino({ level: "debug" });
    expect(logger.level).toBe("debug");
  });

  it("has all required log methods", () => {
    const logger = pino({ level: "trace" });
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.trace).toBe("function");
  });

  it("respects LOG_LEVEL env var", () => {
    const originalLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = "warn";
    const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
    expect(logger.level).toBe("warn");
    if (originalLevel !== undefined) {
      process.env.LOG_LEVEL = originalLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  it("defaults to info when LOG_LEVEL is not set", () => {
    const originalLevel = process.env.LOG_LEVEL;
    delete process.env.LOG_LEVEL;
    const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
    expect(logger.level).toBe("info");
    if (originalLevel !== undefined) {
      process.env.LOG_LEVEL = originalLevel;
    }
  });

  it("can log structured objects", () => {
    const logger = pino({ level: "info" });
    const logFn = jest.spyOn(logger, "info");
    logger.info(
      { command: "status", user: "test#1234", guild: "Test Server" },
      "Prefix command received",
    );
    expect(logFn).toHaveBeenCalledWith(
      { command: "status", user: "test#1234", guild: "Test Server" },
      "Prefix command received",
    );
    logFn.mockRestore();
  });

  it("can log error objects", () => {
    const logger = pino({ level: "info" });
    const logFn = jest.spyOn(logger, "error");
    const error = new Error("test error");
    logger.error(error, "Something failed");
    expect(logFn).toHaveBeenCalledWith(error, "Something failed");
    logFn.mockRestore();
  });
});
