// Voice-drift guards: prose must use canonical product names, not engineering shorthand.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildBrief } from '../../../skills/vercel-optimize/lib/investigation-brief.mjs';
import { renderReport } from '../../../skills/vercel-optimize/lib/render-report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..', 'skills', 'vercel-optimize');

// "Observability Plus" shorthand must not appear in prose. Code identifiers
// like OPLUS_REQUIRED / no_oplus_probe are fine — word-boundary regex skips them.
const FORBIDDEN_RE = /\b(OPlus|Oplus|O-Plus)\b/;

async function readAllMarkdown(dir) {
  const out = [];
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.md')) continue;
    const path = join(entry.parentPath ?? entry.path ?? dir, entry.name);
    if (/node_modules|\/test\//.test(path)) continue;
    // voice.md documents the term to ban it.
    if (path.endsWith('/references/voice.md')) continue;
    out.push(path);
  }
  return out;
}

test('voice drift: no markdown file uses "OPlus" / "Oplus" / "O-Plus" shorthand', async () => {
  const files = await readAllMarkdown(ROOT);
  assert.ok(files.length > 0, 'sanity check — found markdown files');
  for (const path of files) {
    const content = await readFile(path, 'utf-8');
    const match = content.match(FORBIDDEN_RE);
    assert.ok(!match, `${path.replace(ROOT, '.')} contains "${match?.[0]}" — use "Observability Plus" instead`);
  }
});

test('voice drift: generated brief does not contain "OPlus" shorthand', () => {
  const md = buildBrief({
    candidate: {
      kind: 'slow_route',
      route: '/x',
      scope: 'route',
      o11ySignal: 'inv=10000,p95=800ms',
      question: 'Why is /x slow?',
      evidence: { deepDive: {} },
    },
    candidateIndex: 0,
    candidateGroup: 'toLaunch',
    files: ['src/x.ts'],
    signals: {
      stack: { framework: 'next', frameworkVersion: '15.0.0', hasAppRouter: true },
      codebase: { stack: {}, routes: [] },
    },
    citations: { urls: [], ruleSkillRefs: [] },
    playbookId: null,
    playbookBody: null,
    frameworkPlaybookId: null,
    frameworkPlaybookBody: null,
    generatedAt: null,
  });
  assert.ok(!FORBIDDEN_RE.test(md), 'investigation brief leaks "OPlus" shorthand into sub-agent prompt');
});

test('voice drift: rendered report does not contain "OPlus" shorthand', () => {
  const md = renderReport({
    recommendations: [],
    gated: [],
    abstentions: [],
    signals: {
      stack: { framework: 'next', frameworkVersion: '15.0.0' },
      plan: { plan: 'pro', reason: '...' },
      observabilityPlus: false,
      observabilityPlusBlocker: 'payment_required',
      observabilityPlusBlockerDetail: 'Observability Plus is recognized on the team but not paid.',
    },
    opts: { projectName: 'test', generatedAt: null },
  });
  assert.ok(!FORBIDDEN_RE.test(md), 'rendered report leaks "OPlus" shorthand');
});
