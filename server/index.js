import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// In-memory device state
const ROOMS = ['drawing-room', 'work-room-1', 'work-room-2'];

function createDevices() {
  const devices = [];
  const now = new Date().toISOString();

  ROOMS.forEach((room) => {
    // 2 Fans per room (60W each)
    devices.push({
      id: `${room}-fan-1`,
      name: 'Fan 1',
      type: 'fan',
      status: Math.random() > 0.5 ? 'on' : 'off',
      powerDraw: 60,
      room,
      lastChanged: now,
    });
    devices.push({
      id: `${room}-fan-2`,
      name: 'Fan 2',
      type: 'fan',
      status: Math.random() > 0.5 ? 'on' : 'off',
      powerDraw: 60,
      room,
      lastChanged: now,
    });

    // 3 Lights per room (15W each)
    for (let i = 1; i <= 3; i++) {
      devices.push({
        id: `${room}-light-${i}`,
        name: `Light ${i}`,
        type: 'light',
        status: Math.random() > 0.5 ? 'on' : 'off',
        powerDraw: 15,
        room,
        lastChanged: now,
      });
    }
  });

  return devices;
}

let devices = createDevices();
let alertId = 0;

// Helper functions
function calculateTotalWatts() {
  return devices
    .filter((d) => d.status === 'on')
    .reduce((sum, d) => sum + d.powerDraw, 0);
}

function calculatePerRoomWatts() {
  const perRoom = {};
  ROOMS.forEach((room) => {
    perRoom[room] = devices
      .filter((d) => d.room === room && d.status === 'on')
      .reduce((sum, d) => sum + d.powerDraw, 0);
  });
  return perRoom;
}

function getPowerSummary() {
  return {
    totalWatts: calculateTotalWatts(),
    estimatedKwhToday: calculateTotalWatts() * 0.08,
    perRoom: calculatePerRoomWatts(),
  };
}

function toggleRandomDevice() {
  const randomIndex = Math.floor(Math.random() * devices.length);
  const device = devices[randomIndex];
  device.status = device.status === 'on' ? 'off' : 'on';
  device.lastChanged = new Date().toISOString();
  return device;
}

function generateRandomAlert() {
  const types = ['after-hours', 'extended-on', 'high-power'];
  const type = types[Math.floor(Math.random() * types.length)];
  const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];

  const messages = {
    'after-hours': `Device still running after hours in ${room.replace(/-/g, ' ')}`,
    'extended-on': `Device running for extended period in ${room.replace(/-/g, ' ')}`,
    'high-power': `High power consumption detected in ${room.replace(/-/g, ' ')}`,
  };

  return {
    id: `alert-${++alertId}`,
    type,
    room,
    message: messages[type],
    triggeredAt: new Date().toISOString(),
  };
}

// REST API Endpoints
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

app.get('/api/devices/room/:room', (req, res) => {
  const roomDevices = devices.filter((d) => d.room === req.params.room);
  res.json(roomDevices);
});

app.get('/api/power/summary', (req, res) => {
  res.json(getPowerSummary());
});

// Create HTTP server and WebSocket server
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);

  // Send initial power summary
  ws.send(JSON.stringify({
    type: 'power_update',
    payload: getPowerSummary(),
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});

function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

// Simulation loops
// Device toggle every 3 seconds
setInterval(() => {
  const numToggles = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < numToggles; i++) {
    const device = toggleRandomDevice();
    broadcast({
      type: 'device_update',
      payload: device,
    });
  }
  broadcast({
    type: 'power_update',
    payload: getPowerSummary(),
  });
}, 3000);

// Alert generation every 30 seconds
setInterval(() => {
  const alert = generateRandomAlert();
  broadcast({
    type: 'alert',
    payload: alert,
  });
}, 30000);

server.listen(PORT, () => {
  console.log(`Mock backend server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
