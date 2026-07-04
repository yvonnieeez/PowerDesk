import { ERROR_MESSAGES, getErrorMessage } from "../src/errors";

describe("ERROR_MESSAGES", () => {
  it("contains BACKEND_UNREACHABLE", () => {
    expect(ERROR_MESSAGES.BACKEND_UNREACHABLE).toBe(
      "The office system is offline right now. Try again in a moment.",
    );
  });

  it("contains BACKEND_5XX", () => {
    expect(ERROR_MESSAGES.BACKEND_5XX).toBe(
      "Got an unexpected error from the office server. The team has been notified.",
    );
  });

  it("contains INVALID_ROOM", () => {
    expect(ERROR_MESSAGES.INVALID_ROOM).toBe(
      "I don't recognize that room name. Valid options: drawing, work1, work2.",
    );
  });

  it("contains MISSING_ROOM_ARG", () => {
    expect(ERROR_MESSAGES.MISSING_ROOM_ARG).toBe(
      "Usage: !room <drawing|work1|work2>",
    );
  });

  it("contains UNEXPECTED", () => {
    expect(ERROR_MESSAGES.UNEXPECTED).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("has at least 5 error codes", () => {
    expect(Object.keys(ERROR_MESSAGES).length).toBeGreaterThanOrEqual(5);
  });
});

describe("getErrorMessage", () => {
  it("returns correct message for BACKEND_UNREACHABLE", () => {
    expect(getErrorMessage("BACKEND_UNREACHABLE")).toBe(
      ERROR_MESSAGES.BACKEND_UNREACHABLE,
    );
  });

  it("returns correct message for BACKEND_5XX", () => {
    expect(getErrorMessage("BACKEND_5XX")).toBe(ERROR_MESSAGES.BACKEND_5XX);
  });

  it("returns correct message for INVALID_ROOM", () => {
    expect(getErrorMessage("INVALID_ROOM")).toBe(ERROR_MESSAGES.INVALID_ROOM);
  });

  it("returns correct message for MISSING_ROOM_ARG", () => {
    expect(getErrorMessage("MISSING_ROOM_ARG")).toBe(
      ERROR_MESSAGES.MISSING_ROOM_ARG,
    );
  });

  it("returns UNEXPECTED for unknown error code", () => {
    expect(getErrorMessage("UNKNOWN_CODE")).toBe(ERROR_MESSAGES.UNEXPECTED);
  });

  it("returns UNEXPECTED for empty string", () => {
    expect(getErrorMessage("")).toBe(ERROR_MESSAGES.UNEXPECTED);
  });
});
