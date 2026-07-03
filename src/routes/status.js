const { Router } = require('express');
const { wrapResponse } = require('../utils/response');

const router = Router();

router.get('/', (req, res) => {
  const startTime = req.app.locals.startTime || Date.now();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const sim = req.app.locals.simulator;

  res.json(
    wrapResponse({
      status: 'healthy',
      backend: {
        uptime,
        version: '1.0.0',
      },
      simulator: {
        running: sim ? sim.running : false,
        devicesTracked: sim ? Object.values(sim.getAllDevices()).flat().length : 0,
        lastUpdate: sim ? sim.getLastUpdateTime() : null,
      },
    })
  );
});

module.exports = router;
