const assert = require('node:assert');
const { describe, it } = require('node:test');
const { validateRoom, validateTimestamp, validateLimit } = require('../src/middleware/validation');

describe('validateRoom', () => {
  it('should return null for valid room', () => {
    assert.strictEqual(validateRoom('drawing-room'), null);
  });

  it('should return error string for invalid room', () => {
    const result = validateRoom('basement');
    assert.ok(result.includes('does not exist'));
  });
});

describe('validateTimestamp', () => {
  it('should return null for valid ISO timestamp', () => {
    assert.strictEqual(validateTimestamp('2026-01-01T00:00:00.000Z'), null);
  });

  it('should return error string for invalid timestamp', () => {
    const result = validateTimestamp('not-a-date');
    assert.ok(result.includes('ISO timestamp'));
  });

  it('should reject empty string', () => {
    const result = validateTimestamp('');
    assert.ok(result.includes('ISO timestamp'));
  });
});

describe('validateLimit', () => {
  it('should return null for valid limit', () => {
    assert.strictEqual(validateLimit('10'), null);
  });

  it('should return error string for limit exceeding max', () => {
    const result = validateLimit('200');
    assert.ok(result.includes('between'));
  });

  it('should return error string for non-numeric limit', () => {
    const result = validateLimit('abc');
    assert.ok(result);
  });

  it('should return error string for limit below 1', () => {
    const result = validateLimit('0');
    assert.ok(result.includes('between'));
  });
});
