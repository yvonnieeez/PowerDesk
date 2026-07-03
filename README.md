# Office Dashboard - "Lights, Fans, Discord"

A real-time office monitoring dashboard for the hackathon project "Lights, Fans, Discord".

## Running with Mock Backend

The dashboard includes a frontend mock simulation that runs automatically when no backend is available. Simply run:

```bash
npm run dev
```

The dashboard will display live simulated data in the Bolt preview.

## Running with Real Backend

To run with the real Express/WebSocket backend:

### Terminal 1 - Backend Server:
```bash
npm run dev:server
```

This starts:
- REST API at `http://localhost:3000`
- WebSocket server at `ws://localhost:3000`

### Terminal 2 - Frontend:
```bash
npm run dev
```

Or run both together:
```bash
npm run dev:all
```

## API Endpoints

- `GET /api/devices` - Get all devices
- `GET /api/devices/room/:room` - Get devices by room
- `GET /api/power/summary` - Get power summary

## WebSocket Messages

The WebSocket server broadcasts:

- `device_update` - When a device toggles (every 3 seconds)
- `power_update` - Power summary updates
- `alert` - Random alerts (every 30 seconds)

## Environment Variables

Copy `.env.example` to `.env`:

```
VITE_BACKEND_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- Zustand (state management)
- TanStack Query (data fetching)
- Framer Motion (animations)
- Recharts (charts)
- Express + WebSocket (backend)
