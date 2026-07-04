# SPEC.md — Lights, Fans, Discord: The Boss's Big Idea
**Techathon Nationals × IUT Robotics Society**  
**Version:** 2.0 (Canonical)  
**Status:** Single Source of Truth  
**Last updated:** July 2026

> **⚠️ Device Count Fix (read first)**  
> The problem statement contains an error: it says "18 devices." The correct count is **15 devices total** — 3 rooms × 5 devices per room (2 fans + 3 lights). Every test, assertion, log message, and hardcoded count in the codebase must use **15**, not 18.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Office Setup (Fixed)](#2-office-setup-fixed)
3. [Device Data Model](#3-device-data-model)
4. [Architecture](#4-architecture)
5. [Backend Specification](#5-backend-specification)
6. [Dashboard Specification](#6-dashboard-specification)
7. [Discord Bot Specification](#7-discord-bot-specification)
8. [Shared Integration Contract](#8-shared-integration-contract)
9. [Alert Rules](#9-alert-rules)
10. [Power Calculation Rules](#10-power-calculation-rules)
11. [Deployment](#11-deployment)
12. [Deliverables Checklist](#12-deliverables-checklist)
13. [Evaluation Criteria](#13-evaluation-criteria)
14. [Git Strategy](#14-git-strategy)

---

## 1. System Overview

The boss wants to monitor every light and fan in a small office via a live web dashboard and a Discord bot, both backed by a single simulated data source. No real hardware exists — all device state is simulated.

**Information flow (authoritative):**

```
[Device Simulator]
      │
      ▼
[Backend API — single source of truth]
      │                    │
      ▼                    ▼
[React Dashboard]    [Discord Bot]
      │                    │
      ▼                    ▼
[Boss's browser]    [Boss's Discord]
```

**Core constraints:**
- One backend serves both clients. No separate state stores.
- Dashboard updates must be live (no manual page refresh).
- Bot responses must reflect the same state visible on the dashboard at the same instant.
- All device data is simulated; no real hardware is needed.
- LLM-generated conversational responses for the bot are strongly encouraged.

---

## 2. Office Setup (Fixed)

These values are fixed for everyone. Do not change them.

| Room | Room ID | Fans | Lights | Devices |
|---|---|---|---|---|
| Drawing Room | `drawing-room` | 2 | 3 | 5 |
| Work Room 1 | `work-room-1` | 2 | 3 | 5 |
| Work Room 2 | `work-room-2` | 2 | 3 | 5 |
| **Total** | — | **6** | **9** | **15** |

**Device naming convention:**

| Device | ID pattern | Name label |
|---|---|---|
| Fan 1 in Drawing Room | `drawing-room-fan-1` | `Fan 1` |
| Fan 2 in Drawing Room | `drawing-room-fan-2` | `Fan 2` |
| Light 1 in Drawing Room | `drawing-room-light-1` | `Light 1` |
| Light 2 in Drawing Room | `drawing-room-light-2` | `Light 2` |
| Light 3 in Drawing Room | `drawing-room-light-3` | `Light 3` |
| *(same pattern for `work-room-1` and `work-room-2`)* | | |

All 15 device IDs follow the pattern: `{room-id}-{type}-{index}`.

---

## 3. Device Data Model

This is the canonical shape of a single device. Every component (backend, dashboard, bot) must agree on this shape.

```ts
interface Device {
  id: string;           // e.g. "drawing-room-fan-1"
  name: string;         // e.g. "Fan 1"
  type: "fan" | "light";
  room: string;         // kebab-case room ID: "drawing-room" | "work-room-1" | "work-room-2"
  status: boolean;      // true = ON, false = OFF
  powerDraw: number;    // Watts. Fan: 60W (on) / 0W (off). Light: 15W (on) / 0W (off).
  lastChanged: string;  // ISO 8601 UTC timestamp: "2025-01-15T14:30:00Z"
}
```

**Power draw values (fixed):**

| Device type | Status ON | Status OFF |
|---|---|---|
| Fan | 60 W | 0 W |
| Light | 15 W | 0 W |

**Maximum possible total office load:** (6 fans × 60W) + (9 lights × 15W) = 360W + 135W = **495W**

---

## 4. Architecture

### 4.1 Repository Structure

```
powerdesk/
├── src/                        # Backend (CommonJS) + Dashboard (TypeScript/ESM)
│   ├── index.js                # Express + WebSocket entry point
│   ├── simulator.js            # Device state simulation engine
│   ├── powerCalculator.js      # Power consumption calculations
│   ├── alertEngine.js          # Alert detection (after-hours, continuous runtime)
│   ├── websocket.js            # WebSocket broadcasting
│   ├── config.js               # Environment configuration
│   ├── routes/                 # REST API routes
│   ├── middleware/              # Express middleware
│   ├── components/             # React UI components
│   ├── store/                  # Zustand state management
│   ├── types/                  # TypeScript types + Zod schemas
│   └── utils/                  # Shared utilities
├── discord-bot/                # Discord bot (TypeScript, ESM)
│   └── src/
│       ├── index.ts            # Bot entry point
│       ├── commands/           # Slash + prefix command handlers
│       ├── formatters/         # Response formatting
│       ├── api/                # Backend API client
│       ├── ws/                 # WebSocket alert listener
│       └── llm/                # Groq LLM humanization
├── test/                       # Backend tests (57 tests)
├── docs/                       # Diagrams and specs
└── context/                    # Design specifications
```

### 4.2 Ports

| Service | Protocol | Port |
|---|---|---|
| Backend REST API | HTTP | `5000` |
| Backend WebSocket | WS | `5000` (shared with Express) |
| Discord Bot | HTTP | `PORT` env var (health check only) |

> WebSocket is served on the same port as Express via `ws` library upgrade on the HTTP server. This is required for Render deployment (single exposed port).

### 4.3 Layered Architecture

```
┌─────────────────────────────────────────┐
│   Clients: Dashboard, Discord Bot       │
└──────────────┬──────────────────────────┘
               │  HTTP + WebSocket
┌──────────────▼──────────────────────────┐
│   Express Router (REST endpoints)       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Business Logic                        │
│   alertEngine.js · powerCalculator.js  │
│   timings.js (office hours)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Data Layer                            │
│   simulator.js (in-memory state, 15 devices) │
└─────────────────────────────────────────┘
```

### 4.4 Mixed Module Systems

| Component | Module System | Runtime |
|-----------|--------------|---------|
| Backend (`src/*.js`) | CommonJS (`require`/`module.exports`) | Node.js |
| Dashboard (`src/*.tsx`) | ESM (import/export) | Vite bundle |
| Discord Bot (`discord-bot/src/*.ts`) | ESM (import/export) | tsx |

---

## 5. Backend Specification

**Language:** Node.js (JavaScript, CommonJS)  
**Framework:** Express 5  
**Runtime:** Node.js 18+

### 5.1 Technology Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ |
| HTTP Framework | Express 5.2.1 |
| Real-time | `ws` library (WebSocket upgrade on same HTTP server) |
| Validation | Zod |
| Logging | Custom logger (console-based) |
| Config | `dotenv` |

### 5.2 Folder Structure

```
src/
├── index.js              # Entry — Express + WS setup, starts simulator
├── config.js             # Env var loading, constants
├── simulator.js          # Device state store + simulation engine
├── powerCalculator.js    # Power aggregation functions
├── alertEngine.js        # Alert detection + broadcast
├── websocket.js          # WebSocket server (attaches to Express HTTP server)
├── routes/
│   ├── status.js         # GET /api/status
│   ├── devices.js        # GET /api/devices, GET /api/devices/:room
│   ├── power.js          # GET /api/power, GET /api/power/summary
│   └── alerts.js         # GET /api/alerts
├── middleware/
│   ├── errorHandler.js   # Global error handler
│   ├── validation.js     # Request validation helpers
│   └── requestLogger.js  # 4xx/5xx logging
└── utils/
    ├── logger.js         # Console logging wrapper
    ├── response.js       # Standard envelope helpers
    ├── constants.js      # Rooms, power wattages
    └── timings.js        # After-hours & runtime helpers
test/                     # 10 test files, 57 tests
```

### 5.3 Device Simulator (`simulator.js`)

**Initialization:** Creates all 15 devices in memory on startup. Each device gets a random initial `status` and `lastChanged` within the past 2 hours.

**Simulation loop:** Every 30–60 seconds (random interval), the simulator flips 1-2 devices. On flip:
- Update `status`
- Update `lastChanged` to `new Date().toISOString()`
- Emit `deviceChanged` event (triggers alert check + WebSocket broadcast)

**Exported API (used by routes):**
```js
simulator.getAllDevices()          // → { "drawing-room": Device[], "work-room-1": Device[], "work-room-2": Device[] }
simulator.getDevicesByRoom(roomId) // → Device[] | null
simulator.getDevice(id)            // → Device | null
```

### 5.4 REST Endpoints

All responses use this envelope:
```json
{
  "success": true,
  "data": { },
  "timestamp": "2025-01-15T14:30:00Z",
  "error": null
}
```

---

#### `GET /api/status`

Health check endpoint. Returns `200 OK` if backend is up.

```json
{ "success": true, "data": { "status": "healthy", "backend": { "uptime": 3600, "version": "1.0.0" }, "simulator": { "running": true, "devicesTracked": 15, "lastUpdate": "..." } }, "timestamp": "..." }
```

---

#### `GET /api/devices`

Returns all 15 devices grouped by room.

**Response `data` shape:**
```json
{
  "drawing-room": [
    { "id": "drawing-room-fan-1", "name": "Fan 1", "type": "fan", "room": "drawing-room", "status": true, "powerDraw": 60, "lastChanged": "2025-01-15T14:25:30Z" },
    { "id": "drawing-room-fan-2", "name": "Fan 2", "type": "fan", "room": "drawing-room", "status": false, "powerDraw": 0, "lastChanged": "2025-01-15T13:10:00Z" },
    { "id": "drawing-room-light-1", "name": "Light 1", "type": "light", "room": "drawing-room", "status": true, "powerDraw": 15, "lastChanged": "2025-01-15T14:00:00Z" },
    { "id": "drawing-room-light-2", "name": "Light 2", "type": "light", "room": "drawing-room", "status": true, "powerDraw": 15, "lastChanged": "2025-01-15T12:30:00Z" },
    { "id": "drawing-room-light-3", "name": "Light 3", "type": "light", "room": "drawing-room", "status": false, "powerDraw": 0, "lastChanged": "2025-01-15T11:00:00Z" }
  ],
  "work-room-1": [ /* 5 devices */ ],
  "work-room-2": [ /* 5 devices */ ]
}
```

**Errors:** 500 if simulator is unavailable.

---

#### `GET /api/devices/:room`

Returns the 5 devices for a specific room.

**Path param:** `room` — must be one of `drawing-room`, `work-room-1`, `work-room-2`.

**Response `data` shape:**
```json
{
  "room": "work-room-1",
  "devices": [ /* 5 Device objects */ ]
}
```

**Error (404):**
```json
{ "success": false, "data": null, "timestamp": "...", "error": { "code": "ROOM_NOT_FOUND", "message": "Room 'xyz' not found. Valid: drawing-room, work-room-1, work-room-2" } }
```

---

#### `GET /api/power`

Full power consumption payload.

**Response `data` shape:**
```json
{
  "totalPower": 240,
  "unit": "Watts",
  "byRoom": {
    "drawing-room": { "power": 90, "activeDevices": 3 },
    "work-room-1": { "power": 75, "activeDevices": 2 },
    "work-room-2": { "power": 75, "activeDevices": 2 }
  },
  "breakdown": {
    "fans": { "count": 2, "power": 120 },
    "lights": { "count": 5, "power": 75 }
  },
  "dailyEstimate": {
    "kWh": 1.6,
    "period": "9 AM - 5 PM (8 hours)"
  }
}
```

---

#### `GET /api/power/summary`

Returns current power draw — total and per-room — plus today's estimated kWh. Bot-friendly lean payload.

**Response `data` shape:**
```json
{
  "totalWatts": 225,
  "estimatedKwhToday": 1.8,
  "perRoom": {
    "drawing-room": 75,
    "work-room-1": 0,
    "work-room-2": 150
  }
}
```

**How `estimatedKwhToday` is calculated:** `(totalPower / 1000) * officeHoursElapsed`, clamped to the office-hour window (default 9 AM–5 PM).

---

#### `GET /api/alerts`

Returns the current list of active alerts plus any triggered in the past.

**Query params:**
- `?since=ISO-8601` — only alerts after this timestamp
- `?limit=N` — cap results (default 20)

**Response `data` shape:**
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "type": "after-hours",
      "severity": "warning",
      "room": "work-room-2",
      "message": "Work Room 2 still has 2 fans and 3 lights ON at 10:30 PM (after office hours)",
      "devices": [
        { "id": "work-room-2-fan-1", "name": "Fan 1" },
        { "id": "work-room-2-fan-2", "name": "Fan 2" }
      ],
      "triggeredAt": "2025-01-15T22:30:00Z",
      "resolvedAt": null
    }
  ],
  "activeCount": 1,
  "resolvedCount": 0
}
```

**Alert types:**

| Type | Severity | Condition |
|---|---|---|
| `after-hours` | `warning` | ≥1 device ON outside office hours |
| `continuous-runtime` | `info` | Any device ON continuously for ≥2 hours |

---

### 5.5 WebSocket Events

WebSocket is served on the **same port as Express** (port 5000). No separate port.

The server **broadcasts** the following events to all connected clients:

**Event: `device-update`**
```json
{
  "type": "device-update",
  "timestamp": "2026-07-04T10:00:00.000Z",
  "device": {
    "id": "work-room-2-fan-1",
    "room": "work-room-2",
    "status": true,
    "powerDraw": 60,
    "lastChanged": "2026-07-04T10:00:00.000Z"
  }
}
```

**Event: `alert-triggered`**
```json
{
  "type": "alert-triggered",
  "timestamp": "2026-07-04T22:30:00.000Z",
  "alert": {
    "id": "alert-001",
    "type": "after-hours",
    "severity": "warning",
    "room": "work-room-2",
    "message": "Work Room 2 has 2 fans and 3 lights ON at 10:30 PM (after office hours)",
    "devices": [{ "id": "work-room-2-fan-1", "name": "Fan 1" }],
    "triggeredAt": "2026-07-04T22:30:00.000Z"
  }
}
```

**Event: `power-update`**
```json
{
  "type": "power-update",
  "timestamp": "2026-07-04T10:00:00.000Z",
  "data": {
    "totalPower": 240,
    "byRoom": {
      "drawing-room": { "power": 90, "activeDevices": 3 },
      "work-room-1": { "power": 75, "activeDevices": 2 },
      "work-room-2": { "power": 75, "activeDevices": 2 }
    }
  }
}
```

> `power-update` broadcasts every 5 seconds on a fixed interval, independent of device changes.

### 5.6 Environment Variables

```env
# .env.example
PORT=5000
HOST=localhost
OFFICE_START_HOUR=9
OFFICE_END_HOUR=17
SIMULATOR_INTERVAL_MIN=30000
SIMULATOR_INTERVAL_MAX=60000
ENABLE_AFTER_HOURS_ALERTS=true
ENABLE_RUNTIME_ALERTS=true
CONTINUOUS_RUNTIME_THRESHOLD_HOURS=2
DEMO_ALERTS=true
```

### 5.7 Acceptance Criteria

- [x] `GET /api/devices` returns all **15 devices** in the nested room structure.
- [x] `GET /api/devices/:room` returns exactly **5 devices** for a valid room.
- [x] Invalid room ID returns 404 with `ROOM_NOT_FOUND` error code.
- [x] `GET /api/power/summary` returns correct watt totals (sum of `powerDraw` of all ON devices).
- [x] `GET /api/alerts` returns valid alert array with `activeCount` and `resolvedCount`.
- [x] `GET /api/status` returns 200 with healthy status and simulator metadata.
- [x] Simulator toggles device states every 30–60 seconds.
- [x] WebSocket broadcasts `device-update` on every state change.
- [x] WebSocket broadcasts `alert-triggered` when an alert condition is triggered.
- [x] WebSocket broadcasts `power-update` every 5 seconds.
- [x] CORS is enabled for cross-origin consumers.
- [x] No unhandled promise rejections.

---

## 6. Dashboard Specification

**Language:** TypeScript  
**Framework:** React 19 + Vite  
**Module system:** ESM

### 6.1 Technology Stack

| Library | Purpose |
|---|---|
| `react` 19 + `vite` | Core framework |
| `zustand` | Global state (devices, alerts) |
| `recharts` | Power consumption chart |
| `framer-motion` | Fan spin animation, light glow, panel transitions |
| `lucide-react` | Icon set |
| `tailwindcss` v4 | Utility styling |
| `axios` | HTTP client |
| `zod` | Runtime API response validation |
| `dayjs` | Timestamp formatting |
| `typescript` | Static typing |

### 6.2 Folder Structure

```
src/
├── main.tsx
├── App.tsx
├── env.ts                    # Zod-validated environment variables
├── types/
│   ├── device.ts             # Device type + Zod schema + isDeviceOn() helper
│   └── alert.ts              # Alert type + Zod schema
├── api/
│   ├── client.ts             # Axios instance (baseURL from env)
│   ├── devices.ts            # getDevices(), getDevicesByRoom()
│   └── power.ts              # getPowerSummary()
├── ws/
│   └── useOfficeSocket.ts    # WS hook — connects, parses events, pushes to store
├── store/
│   ├── deviceStore.ts        # Zustand — devices[], setDevices(), updateDevice()
│   ├── alertStore.ts         # Zustand — alerts[], addAlert(), dismissAlert()
│   └── powerStore.ts         # Zustand — power data, addPowerReading()
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   └── TopBar.tsx        # Office name + connection status dot
│   ├── room/
│   │   ├── RoomGrid.tsx      # Maps 3 rooms → RoomCard
│   │   └── RoomCard.tsx      # Room name, device list, room power total
│   ├── device/
│   │   ├── DeviceCard.tsx    # Fan or Light — name, status badge, wattage
│   │   ├── FanIcon.tsx       # Animated SVG fan (spins when ON)
│   │   └── LightIcon.tsx     # Glowing bulb SVG (glows when ON)
│   ├── power/
│   │   ├── PowerMeter.tsx    # Total watts display
│   │   ├── RoomPowerBar.tsx  # Per-room horizontal bar
│   │   └── PowerChart.tsx    # Recharts line chart
│   ├── alerts/
│   │   ├── AlertPanel.tsx    # Scrollable alert list
│   │   └── AlertItem.tsx     # Icon + message + timestamp
│   └── floorplan/
│       ├── FloorPlan.tsx     # SVG-based office map
│       ├── FanMarker.tsx     # Spinning fan on floor plan
│       ├── LightMarker.tsx   # Glowing dot on floor plan
│       └── RoomOverlay.tsx   # Room boundary + click handler
├── hooks/
│   └── useAlerts.ts          # Reads alert store, newest first
├── constants/
│   └── rooms.ts              # Room definitions
└── utils/
    ├── deviceHelpers.ts      # groupByRoom(), countOn(), totalWatts() — uses isDeviceOn()
    └── formatters.ts         # formatWatts(), formatTime(), formatRoomName()
```

### 6.3 Required Features (Minimum — graded)

#### Live Device Status Panel
- Displays all **15 devices** organized by room (3 room cards, 5 devices each).
- Each device shows: name, type icon, ON/OFF status badge, wattage when ON.
- Updates in real time via WebSocket — no page refresh required.
- Uses `isDeviceOn()` helper to handle both boolean and string status formats.

#### Live Power Consumption Meter
- Shows current total watts across entire office.
- Shows per-room power breakdown (3 bars or values).
- Updates alongside device panel.

#### Active Alerts Panel
- Shows timestamped alerts for anomalous conditions (see §9).
- Auto-updates when new alerts arrive via WebSocket.
- Each alert shows: type icon, human-readable message, `triggeredAt` formatted as local time.

### 6.4 Bonus Features (graded under UX quality)

- **Animated floor plan** with top-view office layout: fans spin when ON, lights glow when ON.
- Fan rotation: CSS animation, spins when ON, pauses when OFF.
- Light glow: CSS box-shadow / drop-shadow when ON, dim when OFF.
- Room overlays pulse amber when that room has an active alert.

### 6.5 State Management

```ts
// deviceStore.ts
{
  devices: Device[];         // flat array of all 15 devices
  lastUpdated: string | null;
  setDevices: (arr: Device[]) => void;
  updateDevice: (id: string, patch: Partial<Device>) => void;
}

// alertStore.ts
{
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
}
```

**Data flow:**
1. Mount: fetch `GET /api/devices` → `setDevices()`
2. `useOfficeSocket` connects to `ws://backend`
3. `device-update` event → `updateDevice(id, patch)` (no re-fetch)
4. `alert-triggered` event → `addAlert(alert)`
5. `power-update` event → local power state

### 6.6 Environment Variables

```env
# .env.example
VITE_BACKEND_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

### 6.7 Acceptance Criteria

- [x] Dashboard loads and shows all **15 devices** without blank state.
- [x] Device state change on backend → dashboard updates within 2 seconds, no refresh.
- [x] Total watts matches `/api/power/summary`.
- [x] Fan icons visibly spin when ON.
- [x] Light icons visibly glow when ON.
- [x] Connection status dot in TopBar reflects WS state.
- [x] No console errors during normal operation.
- [x] TypeScript compiles with zero errors.

---

## 7. Discord Bot Specification

**Language:** TypeScript  
**Module system:** ESM (`"type": "module"` in package.json)  
**Runtime:** tsx (TypeScript execute)

### 7.1 Technology Stack

| Package | Purpose |
|---|---|
| `discord.js` v14 | Discord API client |
| `@discordjs/rest` | Slash command registration |
| `axios` | HTTP client for backend |
| `ws` | WebSocket for alert subscription |
| `dotenv` | Env vars |
| `zod` | Validate env + backend responses |
| `typescript` | Static typing |
| `tsx` | TypeScript runner (in dependencies, not devDependencies) |
| `pino` + `pino-pretty` | Structured logging |
| Groq API (optional) | LLM humanization of responses |

### 7.2 Folder Structure

```
discord-bot/
├── src/
│   ├── index.ts              # Entry point + health check server
│   ├── config.ts             # Zod-validated env vars
│   ├── types.ts              # Device, Alert, PowerSummary types + Zod schemas
│   ├── commands/
│   │   ├── index.ts          # Command registry
│   │   ├── status.ts         # !status / /status
│   │   ├── room.ts           # !room <name> / /room
│   │   └── usage.ts          # !usage / /usage
│   ├── events/
│   │   ├── ready.ts
│   │   ├── interactionCreate.ts
│   │   └── messageCreate.ts
│   ├── api/
│   │   ├── client.ts         # Axios base (baseURL from BACKEND_BASE_URL)
│   │   ├── devices.ts        # getAllDevices(), getDevicesByRoom()
│   │   ├── power.ts          # getPowerSummary()
│   │   └── errors.ts         # BotError class
│   ├── ws/
│   │   └── alertListener.ts  # WS connection + alert forwarding
│   ├── formatters/
│   │   ├── statusFormatter.ts
│   │   ├── roomFormatter.ts
│   │   ├── usageFormatter.ts
│   │   └── alertFormatter.ts
│   └── llm/
│       └── humanize.ts       # Groq LLM wrapper
├── scripts/
│   └── registerCommands.ts   # One-time slash command registration
├── tests/                    # 6 test files, 55 tests
├── .env.example
├── package.json
├── tsconfig.json
└── biome.json
```

### 7.3 Health Check Server

The bot runs a minimal HTTP server on `PORT` (set by Render) for health checks:

```ts
import http from "node:http";
const healthServer = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok" }));
});
healthServer.listen(parseInt(process.env.PORT || "3000", 10));
```

This is required for Render deployment — the platform needs to detect an open port.

### 7.4 Required Commands

Support both prefix (`!`) and slash (`/`) syntax. Both paths call identical handlers.

---

#### `!status` / `/status`

**Backend call:** `GET /api/devices`

**Behavior:** Summarize the on/off state of all **15 devices** across all 3 rooms.

**Template fallback (if no LLM):**
```
🏢 Office Status
Drawing Room: Fan 1 ON, Fan 2 OFF, Light 1 ON, Light 2 ON, Light 3 OFF
Work Room 1: all devices OFF
Work Room 2: Fan 1 ON, Fan 2 ON, Light 1 ON, Light 2 ON, Light 3 ON
```

**LLM prompt (if enabled):**
> You are a friendly office assistant. Given this device state: [JSON]. Write a 2–3 sentence summary in a warm, casual tone. Mention rooms with notable situations (all on, all off, any after-hours). Keep under 100 words.

---

#### `!room <name>` / `/room name:<name>`

**Backend call:** `GET /api/devices/:room`

**Room name aliases:**

| User input | Room ID sent to backend |
|---|---|
| `drawing`, `drawing room`, `dr` | `drawing-room` |
| `work1`, `work room 1`, `wr1` | `work-room-1` |
| `work2`, `work room 2`, `wr2` | `work-room-2` |

**Template fallback:**
```
📍 Work Room 2
Fans: Fan 1 ON (60W), Fan 2 ON (60W)
Lights: Light 1 ON (15W), Light 2 ON (15W), Light 3 ON (15W)
Room total: 150W
```

**Invalid room:**
```
Hmm, I don't recognize that room. Try: drawing, work1, or work2.
```

---

#### `!usage` / `/usage`

**Backend call:** `GET /api/power/summary`

**Template fallback:**
```
⚡ Power Usage
Right now: 225W across the whole office
Today's estimated usage: 1.8 kWh
Breakdown: Drawing Room 75W · Work Room 1 0W · Work Room 2 150W
```

---

### 7.5 Proactive Alert Subscription

The bot maintains a persistent WebSocket connection to `BACKEND_WS_URL`.

On `alert-triggered` event:
1. Parse the alert payload
2. Validate with Zod (`alertPayloadSchema`)
3. Format with `alertFormatter.ts`
4. Post to `ALERT_CHANNEL_ID`

**Alert message example:**
```
⚠️ Alert — 10:03 PM
Work Room 2 still has 2 fans and 3 lights ON. Office hours ended at 5 PM. Did someone forget to leave?
```

WebSocket reconnects automatically on disconnect (exponential backoff, max 30s delay).

### 7.6 LLM Humanization (Optional but encouraged)

Function signature:
```ts
export async function humanize(
  type: "status" | "room" | "usage" | "alert",
  data: unknown
): Promise<string | undefined>
```

- Uses Groq API (`https://api.groq.com/openai/v1/chat/completions`)
- Model: `llama-3.3-70b-versatile` (configurable via `GROQ_MODEL`)
- Max 150 output tokens per call
- On LLM failure → silently fall back to template formatter
- Disabled entirely when `GROQ_API_KEY` is blank

### 7.7 Environment Variables

```env
# .env.example
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
ALERT_CHANNEL_ID=
COMMAND_PREFIX=!

BACKEND_BASE_URL=http://localhost:5000
BACKEND_WS_URL=ws://localhost:5000

GROQ_API_KEY=          # Optional — leave blank to disable humanization
GROQ_MODEL=llama-3.3-70b-versatile
```

`config.ts` must validate all required vars with Zod at startup. Missing vars = process exit with readable error.

### 7.8 Error Handling

| Scenario | Bot response |
|---|---|
| Backend unreachable | "The office system is offline right now. Try again in a moment." |
| Backend 5xx | "Got an unexpected error from the office server." |
| Invalid room name | "I don't recognize that room. Try: drawing, work1, or work2." |
| LLM failure | Silent fallback to template |
| WS disconnect | Silent reconnect, no user message |
| Missing command argument | Usage hint in reply |

Slash command errors should be `ephemeral: true`.

### 7.9 Acceptance Criteria

- [x] `!status` returns accurate on/off state for all **15 devices**, matching dashboard.
- [x] `!room work2` returns only Work Room 2 devices (5 devices).
- [x] `!usage` reports total watts and estimated kWh from backend — not hardcoded.
- [x] Alert triggers → bot posts to `ALERT_CHANNEL_ID` within 5 seconds.
- [x] Invalid room name → helpful error, no crash.
- [x] Bot recovers from backend downtime.
- [x] No tokens or credentials in source code.
- [x] Health check server responds on PORT for Render deployment.
- [x] `tsx` is in `dependencies` (not `devDependencies`) for Render compatibility.

---

## 8. Shared Integration Contract

This section is the authoritative contract. Backend implements this; dashboard and bot consume it. Any deviation from this contract is a bug.

### 8.1 REST API

| Method | Path | Consumer | Purpose |
|---|---|---|---|
| GET | `/api/status` | All | Health check with simulator metadata |
| GET | `/api/devices` | Dashboard, Bot | All 15 devices grouped by room |
| GET | `/api/devices/:room` | Dashboard, Bot | 5 devices for a specific room |
| GET | `/api/power` | Dashboard | Full power payload with breakdown |
| GET | `/api/power/summary` | Dashboard, Bot | Bot-friendly power summary |
| GET | `/api/alerts` | Dashboard | Queryable alert feed |

### 8.2 WebSocket Events

| Event name | Broadcast when | Consumer |
|---|---|---|
| `device-update` | Simulator flips a device (every 30-60s) | Dashboard, Bot (optional) |
| `alert-triggered` | Alert condition triggered | Dashboard, Bot |
| `power-update` | Fixed 5-second interval | Dashboard |

### 8.3 Canonical Type Definitions

```ts
interface Device {
  id: string;
  name: string;
  type: "fan" | "light";
  room: "drawing-room" | "work-room-1" | "work-room-2";
  status: boolean;       // true = ON
  powerDraw: number;     // Watts (0 if OFF)
  lastChanged: string;   // ISO 8601 UTC
}

interface PowerSummary {
  totalWatts: number;
  estimatedKwhToday: number;
  perRoom: Record<string, number>;  // room-id → watts
}

interface Alert {
  id: string;
  type: "after-hours" | "continuous-runtime";
  severity: "warning" | "info";
  room: string;
  message: string;
  devices: Array<{ id: string; name: string }>;
  triggeredAt: string;   // ISO 8601 UTC
  resolvedAt: string | null;
}
```

---

## 9. Alert Rules

The backend alert engine runs on every simulator tick and whenever a device toggles.

### Alert Type 1: After-Hours Devices

**Condition:** Current time is outside office hours (before 09:00 or after 17:00) AND at least one device in a room is ON.

**Triggered per room** (one alert per room, not per device).

**Message template:** `"{Room} has {N} device(s) ON at {time} (after office hours)"`

**Re-trigger:** Only once per room per out-of-hours session. Do not flood alerts.

### Alert Type 2: Continuous Runtime

**Condition:** Any device in a room has been continuously ON for more than 2 hours.

**Triggered per room.**

**Message template:** `"{Room}: All devices have been running for over 2 hours continuously."`

### Alert Deduplication

Only one active alert per type per room is maintained. Resolved alerts remain in the `alerts` array with a non-null `resolvedAt`.

---

## 10. Power Calculation Rules

All power math is done in the backend. Consumers never recalculate power from raw device data.

```
device.powerDraw = device.status ? (device.type === "fan" ? 60 : 15) : 0

roomWatts(room) = sum(device.powerDraw for each device in room)

totalWatts = sum(roomWatts for all rooms)

estimatedKwhToday = (totalPower / 1000) * officeHoursElapsed
  where officeHoursElapsed is clamped to the office-hour window
```

**Maximum theoretical load:** 6 fans × 60W + 9 lights × 15W = **495W**

---

## 11. Deployment

### Live URLs

| Component | Platform | URL |
|-----------|----------|-----|
| Dashboard | Vercel | [power-desk.vercel.app](https://power-desk.vercel.app/) |
| Backend API | Render | [powerdesk-api.onrender.com](https://powerdesk-api.onrender.com/) |
| Discord Bot | Render | [powerdesk-bot.onrender.com](https://powerdesk-bot.onrender.com/) |
| Keep-alive | UptimeRobot | Pings both Render services every 5 minutes |

### Deployment Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Vercel     │────▶│   Render         │◀────│  UptimeRobot │
│  (Dashboard) │     │  (Backend + Bot) │     │  (5min ping) │
└──────────────┘     └──────────────────┘     └──────────────┘
                            │
                     ┌──────▼──────┐
                     │   Discord   │
                     │   Gateway   │
                     └─────────────┘
```

### Key Deployment Details

- **Backend:** WebSocket shares port 5000 with Express (single port for Render)
- **Bot:** Runs health check server on `PORT` env var for Render port detection
- **Dashboard:** `VITE_BACKEND_URL` and `VITE_WS_URL` baked in at build time
- **Bot deps:** `tsx` must be in `dependencies` (not `devDependencies`) for Render

---

## 12. Deliverables Checklist

### Required (graded)

- [x] **Public Git repository** with clean commit history
- [x] **README.md** at root — explains how to run backend, dashboard, and bot from scratch
- [x] **`docs/system-diagram.svg`** — high-level flow: simulator → backend → dashboard + bot → user
- [x] **`docs/architecture-diagram.svg`** — detailed architecture
- [x] **`docs/office-floorplan.svg`** — office floor plan with device positions
- [x] **Working backend** — all endpoints respond, simulator running, WS broadcasting
- [x] **Working dashboard** — all 15 devices visible, real-time updates, power meter, alert panel
- [x] **Working Discord bot** — all 3 commands functional with live backend data
- [x] **`.env.example`** for each component
- [x] **README sections** for each component (setup + how to run)
- [x] **Deployed** on Vercel + Render with UptimeRobot keep-alive

### Bonus (extra points)

- [x] Animated floor plan (fans spin, lights glow)
- [x] Bot proactively posts alerts to Discord channel via WebSocket
- [x] LLM-humanized bot responses (Groq)
- [x] TypeScript strict mode with zero errors
- [x] 112 tests passing (57 backend + 55 bot)

### Video Demo

- Max 3 minutes
- Show: dashboard live, bot commands in action, explain data flow
- Keep it concise and clear

---

## 13. Evaluation Criteria

| Criterion | Weight |
|---|---|
| Working web dashboard with real-time data | 20% |
| Working Discord bot reflecting real simulated data | 10% |
| Dashboard visuals and UX quality | 10% |
| Clear, correct system diagram | 15% |
| Sensible circuit schematic | 15% |
| Quality of demo & dummy data simulation | 15% |
| Well-structured and documented codebase + commits | 15% |

**Total: 100%**

---

## 14. Git Strategy

### Commit Convention

```
feat(backend): add alert engine for after-hours detection
feat(dashboard): implement fan spin animation
feat(bot): add !room command with alias mapping
fix(backend): correct device count to 15 in simulator init
fix(dashboard): prevent re-render of DeviceCard when unrelated device changes
docs(root): update README with setup instructions
test(backend): add unit tests for power calculator
chore: clean up redundant files and fix deployment blockers
```

---

## Appendix A: Quick Reference — Device IDs

All 15 canonical device IDs:

```
drawing-room-fan-1        work-room-1-fan-1        work-room-2-fan-1
drawing-room-fan-2        work-room-1-fan-2        work-room-2-fan-2
drawing-room-light-1      work-room-1-light-1      work-room-2-light-1
drawing-room-light-2      work-room-1-light-2      work-room-2-light-2
drawing-room-light-3      work-room-1-light-3      work-room-2-light-3
```

## Appendix B: Common Mistakes to Avoid

| Mistake | Correct behaviour |
|---|---|
| Using `18` as device count | Always use **15** |
| Bot fabricating or hardcoding data | All data must come from a live backend HTTP call |
| Dashboard calculating power from raw devices | Power comes from `/api/power/summary` or `/api/power` |
| Re-fetching all devices on every WS message | Use `updateDevice(id, patch)` for single-device updates |
| Polling more than once per 5 seconds on power | Once per 5 seconds is fine; less is better |
| Comparing `device.status === 'on'` (string) | Use `isDeviceOn(device.status)` helper — backend sends boolean |
| Running `tsx` from devDependencies on Render | Move `tsx` to `dependencies` |

## Appendix C: Sample Power Scenarios

| State | Drawing Room | Work Room 1 | Work Room 2 | Total |
|---|---|---|---|---|
| All OFF | 0W | 0W | 0W | 0W |
| All fans ON, all lights OFF | 120W | 120W | 120W | 360W |
| All ON | 165W | 165W | 165W | 495W |
| Typical mixed | 75W | 0W | 150W | 225W |
