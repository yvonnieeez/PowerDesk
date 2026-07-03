const { Router } = require('express');
const { wrapResponse, wrapError } = require('../utils/response');
const { validateRoom } = require('../middleware/validation');

const router = Router();

router.get('/', (req, res) => {
  const pc = req.app.locals.powerCalculator;
  if (!pc) {
    return res.status(500).json(wrapError('CALCULATOR_ERROR', 'Power calculator unavailable'));
  }

  res.json(
    wrapResponse({
      totalPower: pc.getTotalPower(),
      unit: 'Watts',
      byRoom: pc.getPowerByRoom(),
      breakdown: pc.getPowerBreakdown(),
      dailyEstimate: pc.getDailyEstimate(),
    })
  );
});

router.get('/summary', (req, res) => {
  const pc = req.app.locals.powerCalculator;
  if (!pc) {
    return res.status(500).json(wrapError('CALCULATOR_ERROR', 'Power calculator unavailable'));
  }

  const byRoom = pc.getPowerByRoom();
  const perRoom = {};
  for (const [room, data] of Object.entries(byRoom)) {
    perRoom[room] = data.power;
  }

  res.json(
    wrapResponse({
      totalWatts: pc.getTotalPower(),
      estimatedKwhToday: pc.getDailyEstimate().kWh,
      perRoom,
    })
  );
});

router.get('/:room', (req, res) => {
  const pc = req.app.locals.powerCalculator;
  if (!pc) {
    return res.status(500).json(wrapError('CALCULATOR_ERROR', 'Power calculator unavailable'));
  }

  const error = validateRoom(req.params.room);
  if (error) {
    return res.status(404).json(wrapError('ROOM_NOT_FOUND', error));
  }

  const result = pc.getPowerByRoom(req.params.room);
  res.json(wrapResponse(result));
});

module.exports = router;
