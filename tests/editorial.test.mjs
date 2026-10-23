import test from 'node:test';
import assert from 'node:assert/strict';
import { editorial } from '../src/data/editorial.ts';

test('research display copy keeps the owner-approved SSOT order and stable IDs', () => {
  // Owner decision 2026-10-08; this is a regression expectation, not a new source of truth.
  assert.deepEqual(editorial.research.map(({ id }) => id), [
    'ai-for-science',
    'industrial-ai-and-decision-making',
    'evidence-centered-ai',
    'continuous-time-modeling',
  ]);
  assert.equal(new Set(editorial.research.map(({ id }) => id)).size, 4);
});

test('research summaries remain one concise sentence per direction', () => {
  for (const { title, description } of editorial.research) {
    assert(title.length > 0);
    assert.equal((description.match(/[.!?]/g) ?? []).length, 1, title);
    assert(description.endsWith('.'), title);
    const words = description.split(/\s+/).length;
    assert(words >= 14 && words <= 16, `${title}: ${words} words`);
  }
});
