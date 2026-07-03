const { Router } = require('express');
const { wrapResponse, wrapError } = require('../utils/response');
const { validateRoom } = require('../middleware/validation');

const router = Router();

router.get('/', (req, res) => {
  const sim = req.app.locals.simulator;
  if (!sim) {
    return res.status(500).json(wrapError('SIMULATOR_ERROR', 'Device state unavailable'));
  }
  res.json(wrapResponse(sim.getAllDevices()));
});

router.get('/:room', (req, res) => {
  const sim = req.app.locals.simulator;
  if (!sim) {
    return res.status(500).json(wrapError('SIMULATOR_ERROR', 'Device state unavailable'));
  }

  const { room } = req.params;
  const validationError = validateRoom(room);
  if (validationError) {
    return res.status(404).json(wrapError('ROOM_NOT_FOUND', validationError));
  }

  res.json(wrapResponse({ room, devices: sim.getDevicesByRoom(room) }));
});

module.exports = router;
