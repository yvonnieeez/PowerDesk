const { Router } = require('express');
const { validateTimestamp, validateLimit } = require('../middleware/validation');
const { wrapResponse, wrapError } = require('../utils/response');

const router = Router();

router.get('/', (req, res) => {
  const alertEngine = req.app.locals.alertEngine;
  let alerts = alertEngine.getAlerts();

  if (req.query.since) {
    const error = validateTimestamp(req.query.since);
    if (error) {
      return res.status(400).json(wrapError('INVALID_TIMESTAMP', error));
    }
    const sinceMs = new Date(req.query.since).getTime();
    alerts = alerts.filter((a) => new Date(a.triggeredAt).getTime() >= sinceMs);
  }

  let limit = 20;
  if (req.query.limit !== undefined) {
    const limitError = validateLimit(req.query.limit);
    if (limitError) {
      return res.status(400).json(wrapError('INVALID_LIMIT', limitError));
    }
    limit = parseInt(req.query.limit, 10) || 20;
  }
  alerts = alerts.slice(-limit);

  const activeCount = alerts.filter((a) => !a.resolvedAt).length;
  const resolvedCount = alerts.filter((a) => a.resolvedAt).length;

  res.json(wrapResponse({ alerts, activeCount, resolvedCount }));
});

module.exports = router;
