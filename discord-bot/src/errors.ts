export const ERROR_MESSAGES: Record<string, string> = {
  BACKEND_UNREACHABLE:
    "The office system is offline right now. Try again in a moment.",
  BACKEND_5XX:
    "Got an unexpected error from the office server. The team has been notified.",
  INVALID_ROOM:
    "I don't recognize that room name. Valid options: drawing, work1, work2.",
  MISSING_ROOM_ARG: "Usage: !room <drawing|work1|work2>",
  UNEXPECTED: "Something went wrong. Please try again.",
};

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNEXPECTED;
}
