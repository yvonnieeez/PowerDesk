# Integration Contract

This document defines the consumable interface of the PowerDesk Backend for all consumers: the React Dashboard (Person 2) and the Discord Bot (Person 1b).

---

## Base URL

| Environment | URL |
|---|---|
| Local development | `http://localhost:5000` |
| WebSocket | `ws://localhost:8080` |

All ports are configurable via `.env` (see [Configuration](#configuration)).

---

## Response Envelope

Every REST response uses a standard envelope:

**Success:**
```json
{
  "success": true,
  "data": { /* payload varies by endpoint */ },
  "timestamp": "2026-07-03T12:00:00.000Z",
  "error": null
}
```

**Error:**
```json
{
  "success": false,
  "data": null,
  "timestamp": "2026-07-03T12:00:00.000Z",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

---

## REST Endpoints

### GET /api/status

Health check with live simulator metadata.

**Response `data` shape:**
```json
{
  "status": "healthy",
  "backend": {
    "uptime": 3600,
    "version": "1.0.0"
  },
  "simulator": {
    "running": true,
    "devicesTracked": 15,
    "lastUpdate": "2026-07-03T12:00:05.000Z"
  }
}
```

**Error codes:** None (no query params, no dependencies that fail independently).

---

### GET /api/devices

All 15 devices nested by room.

**Response `data` shape:**
```json
{
  "drawing-room": [ /* 5 device objects */ ],
  "work-room-1": [ /* 5 device objects */ ],
  "work-room-2": [ /* 5 device objects */ ]
}
```

Each device object:
```json
{
  "id": "drawing-room-fan-1",
  "type": "fan",
  "name": "Fan 1",
  "room": "drawing-room",
  "status": true,
  "powerDraw": 60,
  "lastChanged": "2026-07-03T11:45:00.000Z"
}
```

**Error codes:** `SIMULATOR_ERROR` (500).

---

### GET /api/devices/:room

Devices for a single room.

**Params:** `room` — one of `drawing-room`, `work-room-1`, `work-room-2`.

**Response `data` shape:**
```json
{
  "room": "drawing-room",
  "devices": [ /* 5 device objects */ ]
}
```

**Error codes:**

| Code | Status | When |
|---|---|---|
| `ROOM_NOT_FOUND` | 404 | Invalid room name |
| `SIMULATOR_ERROR` | 500 | Simulator unavailable |

---

### GET /api/power

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

`dailyEstimate.kWh` formula: `(totalPower / 1000) * officeHoursElapsed`, clamped to the office-hour window (default 9 AM–5 PM).

**Error codes:** `CALCULATOR_ERROR` (500).

---

### GET /api/power/summary

Bot-friendly power summary (leaner payload).

**Response `data` shape:**
```json
{
  "totalWatts": 240,
  "estimatedKwhToday": 1.6,
  "perRoom": {
    "drawing-room": 90,
    "work-room-1": 75,
    "work-room-2": 75
  }
}
```

**Error codes:** `CALCULATOR_ERROR` (500).

---

### GET /api/alerts

Queryable alert feed.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `since` | ISO-8601 timestamp | (none) | Only return alerts triggered at or after this time |
| `limit` | integer 1–100 | 20 | Maximum number of alerts (most recent) |

**Response `data` shape:**
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "type": "after-hours",
      "severity": "warning",
      "room": "drawing-room",
      "message": "Drawing Room has 2 fans and 1 light ON at 10:30 PM (after office hours)",
      "devices": [
        { "id": "drawing-room-fan-1", "name": "Fan 1" },
        { "id": "drawing-room-fan-2", "name": "Fan 2" },
        { "id": "drawing-room-light-1", "name": "Light 1" }
      ],
      "triggeredAt": "2026-07-03T22:30:00.000Z",
      "resolvedAt": null
    }
  ],
  "activeCount": 1,
  "resolvedCount": 0
}
```

An alert with `resolvedAt: null` is **active**; a non-null `resolvedAt` means the condition has cleared.

**Alert types:**

| Type | Severity | Condition |
|---|---|---|
| `after-hours` | `warning` | ≥1 device ON outside office hours (default 9 AM–5 PM) |
| `continuous-runtime` | `info` | Any device ON continuously for ≥2 hours |

**Error codes:**

| Code | Status | When |
|---|---|---|
| `INVALID_TIMESTAMP` | 400 | `since` param is not a valid ISO date |
| `ALERT_ENGINE_ERROR` | 500 | Alert engine unavailable |

---

## WebSocket Events

Connect to `ws://localhost:8080`. No handshake or auth required.

Messages are JSON with a `type` field for routing.

### device-update

Broadcast on every simulator tick that flips a device state. Frequency: ~every 30–60 seconds.

```json
{
  "type": "device-update",
  "timestamp": "2026-07-03T12:00:05.000Z",
  "device": {
    "id": "drawing-room-fan-1",
    "room": "drawing-room",
    "status": true,
    "powerDraw": 60,
    "lastChanged": "2026-07-03T12:00:05.000Z"
  }
}
```

### alert-triggered

Broadcast when a new alert is created (not on resolve). Can fire on any tick.

```json
{
  "type": "alert-triggered",
  "timestamp": "2026-07-03T22:30:00.000Z",
  "alert": {
    "id": "alert-001",
    "type": "after-hours",
    "severity": "warning",
    "room": "drawing-room",
    "message": "Drawing Room has 2 fans and 1 light ON at 10:30 PM (after office hours)",
    "devices": [
      { "id": "drawing-room-fan-1", "name": "Fan 1" },
      { "id": "drawing-room-fan-2", "name": "Fan 2" },
      { "id": "drawing-room-light-1", "name": "Light 1" }
    ],
    "triggeredAt": "2026-07-03T22:30:00.000Z"
  }
}
```

### power-update

Broadcast every 5 seconds on a fixed interval, independent of device changes.

```json
{
  "type": "power-update",
  "timestamp": "2026-07-03T12:00:05.000Z",
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

---

## Device Schema

Every device object in every response and WebSocket event has this exact shape:

| Field | Type | Example | Notes |
|---|---|---|---|
| `id` | string | `"drawing-room-fan-1"` | Unique, deterministic (`{room}-{type}-{index}`) |
| `type` | string | `"fan"` | `"fan"` or `"light"` |
| `name` | string | `"Fan 1"` | Display name |
| `room` | string | `"drawing-room"` | One of `drawing-room`, `work-room-1`, `work-room-2` |
| `status` | boolean | `true` | `true` = ON, `false` = OFF |
| `powerDraw` | number | `60` | Watts when ON (60 for fans, 15 for lights) |
| `lastChanged` | ISO string | `"2026-07-03T12:00:05.000Z"` | Last time `status` flipped |

**Room names and device counts:**

| Room | Fans | Lights | Total |
|---|---|---|---|
| `drawing-room` | 2 | 3 | 5 |
| `work-room-1` | 2 | 3 | 5 |
| `work-room-2` | 2 | 3 | 5 |

---

## Alert Schema

| Field | Type | Example | Notes |
|---|---|---|---|
| `id` | string | `"alert-001"` | Auto-incremented |
| `type` | string | `"after-hours"` | `"after-hours"` or `"continuous-runtime"` |
| `severity` | string | `"warning"` | `"warning"` or `"info"` |
| `room` | string | `"drawing-room"` | One of the 3 room IDs |
| `message` | string | `"Drawing Room has 2 fans and 1 light ON at 10:30 PM (after office hours)"` | Human-readable |
| `devices` | array | `[{ "id": "...", "name": "..." }]` | Devices involved |
| `triggeredAt` | ISO string | `"2026-07-03T22:30:00.000Z"` | When the alert was created |
| `resolvedAt` | ISO string or null | `null` | `null` = active, non-null = resolved |

---

## Configuration

All settings are read from environment variables at startup. Copy `.env.example` → `.env` to override defaults.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP server port |
| `WS_PORT` | `8080` | WebSocket server port |
| `HOST` | `localhost` | Bind address |
| `OFFICE_START_HOUR` | `9` | Office hours start (24h) |
| `OFFICE_END_HOUR` | `17` | Office hours end (24h) |
| `SIMULATOR_INTERVAL_MIN` | `30000` | Min tick interval (ms) |
| `SIMULATOR_INTERVAL_MAX` | `60000` | Max tick interval (ms) |
| `ENABLE_AFTER_HOURS_ALERTS` | `true` | Toggle after-hours alert detection |
| `ENABLE_RUNTIME_ALERTS` | `true` | Toggle continuous-runtime alert detection |
| `CONTINUOUS_RUNTIME_THRESHOLD_HOURS` | `2` | Hours before runtime alert triggers |

---

## What NOT to Assume

- **Do not assume specific power values.** `totalPower` and `byRoom` values depend on the random simulator state and will differ each time you query.
- **Do not assume a fixed number of active alerts.** The alert engine only fires when simulation conditions happen to trigger the thresholds.
- **Do not cache device state for more than a few seconds.** The simulator flips devices on every tick (30–60s). Treat the API and WebSocket as the source of truth, not a local cache.
- **Do not assume endpoints beyond this document.** Only the 6 REST endpoints and 3 WebSocket events listed here are part of the stable contract. No PATCH, POST, or DELETE endpoints exist.
- **Do not assume alert timing.** Alerts are checked on simulator ticks (every 30–60s), not in real time. An alert may take up to one full tick interval to appear after the triggering condition arises.
- **Do not depend on alert deduplication behavior.** Only one active alert per type per room is maintained. Resolved alerts remain in the `alerts` array with a non-null `resolvedAt` — they are not deleted.

---

## Quick Reference

### curl Examples

```bash
# Health check
curl http://localhost:5000/api/status

# All devices
curl http://localhost:5000/api/devices

# Single room
curl http://localhost:5000/api/devices/drawing-room

# Power consumption
curl http://localhost:5000/api/power

# Power summary (bot-friendly)
curl http://localhost:5000/api/power/summary

# All alerts
curl http://localhost:5000/api/alerts

# Alerts since a timestamp
curl "http://localhost:5000/api/alerts?since=2026-07-03T20:00:00.000Z"

# Last 5 alerts
curl "http://localhost:5000/api/alerts?limit=5"
```

### WebSocket Quick Test (Node.js)

```js
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log(`Received: ${msg.type}`, msg);
});
```

---

*This contract is frozen for the hackathon. If you need an endpoint or event that isn't listed here, ask the backend team before depending on it.*
