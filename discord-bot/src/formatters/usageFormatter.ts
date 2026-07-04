import type { PowerSummary } from "../types.js";

export function formatUsage(summary: PowerSummary): string {
  const lines: string[] = [
    "⚡ Power Usage",
    `Right now: ${summary.totalWatts}W across the whole office`,
    `Today's estimated usage: ${summary.estimatedKwhToday} kWh`,
  ];

  const roomBreakdown = Object.entries(summary.perRoom)
    .map(([room, watts]) => `${formatRoomName(room)} ${watts}W`)
    .join(" · ");

  if (roomBreakdown) {
    lines.push(`Breakdown: ${roomBreakdown}`);
  }

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
