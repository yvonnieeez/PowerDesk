const WebSocket = require('ws');
const config = require('./config');
const logger = require('./utils/logger');

function startWebSocketServer(simulator, alertEngine, powerCalculator, options = {}) {
  const port = options.port || config.wsPort;

  const wss = new WebSocket.Server({ port });

  logger.info(`WebSocket server listening on ws://${config.host}:${port}`);

  function broadcast(payload) {
    const data = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch (err) {
          logger.error('WebSocket send error:', err.message);
        }
      }
    }
  }

  simulator.on('deviceChanged', (device) => {
    broadcast({
      type: 'device-update',
      timestamp: new Date().toISOString(),
      device: {
        id: device.id,
        room: device.room,
        status: device.status,
        powerDraw: device.powerDraw,
        lastChanged: device.lastChanged,
      },
    });
  });

  alertEngine.on('alert', (alert) => {
    broadcast({
      type: 'alert-triggered',
      timestamp: new Date().toISOString(),
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        room: alert.room,
        message: alert.message,
        devices: alert.devices,
        triggeredAt: alert.triggeredAt,
      },
    });
  });

  const powerInterval = setInterval(() => {
    const byRoomData = powerCalculator.getPowerByRoom();
    const byRoom = {};
    for (const [room, data] of Object.entries(byRoomData)) {
      byRoom[room] = data.power;
    }
    broadcast({
      type: 'power-update',
      timestamp: new Date().toISOString(),
      data: {
        totalPower: powerCalculator.getTotalPower(),
        byRoom,
      },
    });
  }, 5000);

  wss.on('connection', (ws) => {
    logger.info('WebSocket client connected');

    ws.on('close', () => {
      logger.debug('WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      logger.error('WebSocket client error:', err.message);
    });
  });

  function close() {
    clearInterval(powerInterval);
    wss.close();
  }

  return { wss, close };
}

module.exports = { startWebSocketServer };
