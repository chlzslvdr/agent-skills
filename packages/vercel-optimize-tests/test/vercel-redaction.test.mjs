import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redactSensitiveText } from '../../../skills/vercel-optimize/lib/vercel.mjs';

test('redactSensitiveText: removes auth tokens from CLI-visible text', () => {
  const raw = [
    'VERCEL_TOKEN=vercel_secret_1234567890abcdef vercel metrics',
    'vercel metrics --token vercel_secret_abcdef1234567890',
    'Authorization: Bearer abcdefghijklmnopqrstuvwxyz.1234567890',
    '{"token":"secret-json-token-abcdef123456"}',
  ].join('\n');

  const redacted = redactSensitiveText(raw);

  assert.doesNotMatch(redacted, /vercel_secret|abcdefghijklmnopqrstuvwxyz|secret-json-token/);
  assert.match(redacted, /VERCEL_TOKEN=\[REDACTED\]/);
  assert.match(redacted, /--token \[REDACTED\]/);
  assert.match(redacted, /Authorization: \[REDACTED\]/);
  assert.match(redacted, /"token":"\[REDACTED\]"/);
});
