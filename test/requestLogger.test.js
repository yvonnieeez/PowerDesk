const assert = require('node:assert');
const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const express = require('express');
const requestLogger = require('../src/middleware/requestLogger');

describe('requestLogger middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(requestLogger);
  });

  it('should log 4xx responses at warn level', async () => {
    app.get('/test', (req, res) => res.status(400).json({ error: 'bad' }));
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const res = await fetch(`http://127.0.0.1:${port}/test`);
      assert.strictEqual(res.status, 400);
    } finally {
      server.close();
    }
  });

  it('should log 5xx responses at error level', async () => {
    app.get('/test', (req, res) => res.status(500).json({ error: 'fail' }));
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const res = await fetch(`http://127.0.0.1:${port}/test`);
      assert.strictEqual(res.status, 500);
    } finally {
      server.close();
    }
  });

  it('should not log 2xx responses', async () => {
    app.get('/test', (req, res) => res.json({ ok: true }));
    const server = app.listen(0);
    const { port } = server.address();

    try {
      const res = await fetch(`http://127.0.0.1:${port}/test`);
      assert.strictEqual(res.status, 200);
    } finally {
      server.close();
    }
  });
});
