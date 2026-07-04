import type { Device } from "../types.js";

export function formatRoom(roomName: string, devices: Device[]): string {
  const displayName = formatRoomName(roomName);
  const fans = devices.filter((d) => d.type === "fan");
  const lights = devices.filter((d) => d.type === "light");

  const lines: string[] = [`📍 ${displayName}`];

  if (fans.length > 0) {
    const fanList = fans
      .map((f) => `${f.name} ${f.status.toUpperCase()} (${f.powerDraw}W)`)
      .join(", ");
    lines.push(`Fans: ${fanList}`);
  }

  if (lights.length > 0) {
    const lightList = lights
      .map((l) => `${l.name} ${l.status.toUpperCase()} (${l.powerDraw}W)`)
      .join(", ");
    lines.push(`Lights: ${lightList}`);
  }

  const total = devices
    .filter((d) => d.status === "on")
    .reduce((sum, d) => sum + d.powerDraw, 0);
  lines.push(`Room total: ${total}W`);

  return lines.join("\n");
}

function formatRoomName(roomId: string): string {
  const names: Record<string, string> = {
    "drawing-room": "Drawing Room",
    "work-room-1": "Work Room 1",
    "work-room-2": "Work Room 2",
  };
  return names[roomId] ?? roomId;
}
