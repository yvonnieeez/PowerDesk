import { formatAlert } from "../src/formatters/alertFormatter";
import { formatRoom } from "../src/formatters/roomFormatter";
import { formatStatus } from "../src/formatters/statusFormatter";
import { formatUsage } from "../src/formatters/usageFormatter";
import type { AlertPayload, Device, PowerSummary } from "../src/types";

const mockDevices: Device[] = [
  {
    id: "drawing-room-fan-1",
    name: "Fan 1",
    type: "fan",
    room: "drawing-room",
    status: "on",
    powerDraw: 60,
    lastChanged: "2025-01-15T14:30:00Z",
  },
  {
    id: "drawing-room-fan-2",
    name: "Fan 2",
    type: "fan",
    room: "drawing-room",
    status: "off",
    powerDraw: 60,
    lastChanged: "2025-01-15T14:30:00Z",
  },
  {
    id: "drawing-room-light-1",
    name: "Light 1",
    type: "light",
    room: "drawing-room",
    status: "on",
    powerDraw: 15,
    lastChanged: "2025-01-15T14:30:00Z",
  },
  {
    id: "work-room-1-fan-1",
    name: "Fan 1",
    type: "fan",
    room: "work-room-1",
    status: "off",
    powerDraw: 60,
    lastChanged: "2025-01-15T14:30:00Z",
  },
  {
    id: "work-room-1-light-1",
    name: "Light 1",
    type: "light",
    room: "work-room-1",
    status: "off",
    powerDraw: 15,
    lastChanged: "2025-01-15T14:30:00Z",
  },
  {
    id: "work-room-2-fan-1",
    name: "Fan 1",
    type: "fan",
    room: "work-room-2",
    status: "on",
    powerDraw: 60,
    lastChanged: "2025-01-15T14:30:00Z",
  },
  {
    id: "work-room-2-light-1",
    name: "Light 1",
    type: "light",
    room: "work-room-2",
    status: "on",
    powerDraw: 15,
    lastChanged: "2025-01-15T14:30:00Z",
  },
];

const mockSummary: PowerSummary = {
  totalWatts: 150,
  estimatedKwhToday: 4.2,
  perRoom: {
    "drawing-room": 75,
    "work-room-1": 0,
    "work-room-2": 75,
  },
};

const mockAlert: AlertPayload = {
  type: "after-hours",
  room: "work-room-2",
  message: "Devices left on after office hours",
  triggeredAt: "2025-01-15T22:03:00Z",
};

describe("statusFormatter", () => {
  it("formats mixed status rooms", () => {
    const result = formatStatus(mockDevices);
    expect(result).toContain("🏢 Office Status");
    expect(result).toContain("Drawing Room");
    expect(result).toContain("Fan 1 ON");
    expect(result).toContain("Fan 2 OFF");
  });

  it("formats all-off room with shorthand", () => {
    const allOffDevices: Device[] = [
      {
        id: "w1-f1",
        name: "Fan 1",
        type: "fan",
        room: "work-room-1",
        status: "off",
        powerDraw: 60,
        lastChanged: "",
      },
      {
        id: "w1-l1",
        name: "Light 1",
        type: "light",
        room: "work-room-1",
        status: "off",
        powerDraw: 15,
        lastChanged: "",
      },
    ];
    const result = formatStatus(allOffDevices);
    expect(result).toContain("all devices OFF");
  });

  it("formats all-on room with shorthand", () => {
    const allOnDevices: Device[] = [
      {
        id: "w2-f1",
        name: "Fan 1",
        type: "fan",
        room: "work-room-2",
        status: "on",
        powerDraw: 60,
        lastChanged: "",
      },
      {
        id: "w2-l1",
        name: "Light 1",
        type: "light",
        room: "work-room-2",
        status: "on",
        powerDraw: 15,
        lastChanged: "",
      },
    ];
    const result = formatStatus(allOnDevices);
    expect(result).toContain("all devices ON");
  });

  it("handles empty device list", () => {
    const result = formatStatus([]);
    expect(result).toContain("🏢 Office Status");
  });
});

describe("roomFormatter", () => {
  it("formats room with fans and lights", () => {
    const roomDevices = mockDevices.filter((d) => d.room === "work-room-2");
    const result = formatRoom("work-room-2", roomDevices);
    expect(result).toContain("📍 Work Room 2");
    expect(result).toContain("Fans:");
    expect(result).toContain("Lights:");
    expect(result).toContain("60W");
    expect(result).toContain("15W");
    expect(result).toContain("Room total:");
  });

  it("formats room with zero power", () => {
    const result = formatRoom("work-room-1", []);
    expect(result).toContain("Room total: 0W");
  });
});

describe("usageFormatter", () => {
  it("formats power summary", () => {
    const result = formatUsage(mockSummary);
    expect(result).toContain("⚡ Power Usage");
    expect(result).toContain("150W");
    expect(result).toContain("4.2 kWh");
    expect(result).toContain("Drawing Room 75W");
    expect(result).toContain("Work Room 1 0W");
    expect(result).toContain("Work Room 2 75W");
  });

  it("handles zero watts", () => {
    const zeroSummary: PowerSummary = {
      totalWatts: 0,
      estimatedKwhToday: 0,
      perRoom: {},
    };
    const result = formatUsage(zeroSummary);
    expect(result).toContain("0W");
  });
});

describe("alertFormatter", () => {
  it("formats alert with time", () => {
    const result = formatAlert(mockAlert);
    expect(result).toContain("⚠️ Alert");
    expect(result).toContain("Devices left on after office hours");
    expect(result).toContain("Work Room 2");
  });
});
