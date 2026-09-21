import test from 'node:test';
import assert from 'node:assert/strict';

import { formatRelativeTime, safeDate } from './utils.ts';

test('safeDate rejects invalid strings', () => {
  assert.equal(safeDate('not-a-date'), null);
});

test('formatRelativeTime returns seconds for recent timestamps', () => {
  const now = Date.now();
  assert.match(formatRelativeTime(new Date(now - 3_000)), /3 seconds ago/i);
  assert.match(formatRelativeTime(new Date(now - 60_000)), /1 minute ago/i);
});

test('formatRelativeTime returns day and month ranges correctly', () => {
  const now = Date.now();
  assert.match(formatRelativeTime(new Date(now - 2 * 24 * 60 * 60 * 1000)), /2 days ago/i);
  assert.match(formatRelativeTime(new Date(now - 3 * 7 * 24 * 60 * 60 * 1000)), /3 weeks ago/i);
  assert.match(formatRelativeTime(new Date(now - 8 * 30 * 24 * 60 * 60 * 1000)), /8 months ago/i);
  assert.match(formatRelativeTime(new Date(now - 5 * 365 * 24 * 60 * 60 * 1000)), /5 years ago/i);
});

test('formatRelativeTime returns a neutral fallback for missing dates', () => {
  assert.equal(formatRelativeTime(''), 'No date');
});
