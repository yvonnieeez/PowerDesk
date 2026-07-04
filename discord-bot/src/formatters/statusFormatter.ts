import type { Device } from "../types.js";

export function formatStatus(devices: Device[]): string {
  const rooms = new Map<string, Device[]>();
  for (const device of devices) {
    const list = rooms.get(device.room) ?? [];
    list.push(device);
    rooms.set(device.room, list);
  }

  const lines: string[] = ["🏢 Office Status"];

  for (const [room, roomDevices] of rooms) {
    const allOn = roomDevices.every((d) => d.status === "on");
    const allOff = roomDevices.every((d) => d.status === "off");

    const roomName = formatRoomName(room);

    if (allOff) {
      lines.push(`${roomName}: all devices OFF`);
    } else if (allOn) {
      lines.push(`${roomName}: all devices ON`);
    } else {
      const deviceList = roomDevices
        .map((d) => `${d.name} ${d.status.toUpperCase()}`)
        .join(", ");
      lines.push(`${roomName}: ${deviceList}`);
    }
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
