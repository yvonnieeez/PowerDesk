import type { AlertPayload } from "../types.js";

export function formatAlert(alert: AlertPayload): string {
  const time = formatAlertTime(alert.triggeredAt);
  return [
    `⚠️ Alert — ${time}`,
    alert.message,
    "",
    `Room: ${formatRoomName(alert.room)}`,
  ].join("\n");
}

function formatAlertTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function formatRoomName(roomId: string): string {
  const names: Record<string, string> = {
    "drawing-room": "Drawing Room",
    "work-room-1": "Work Room 1",
    "work-room-2": "Work Room 2",
  };
  return names[roomId] ?? roomId;
}
