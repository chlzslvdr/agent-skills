import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const exec = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', '..', '..', 'skills', 'vercel-optimize', 'scripts', 'scan-codebase.mjs');

test('scan-codebase: enumerates Next and SvelteKit layouts as route context', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'vercel-optimize-scan-'));
  try {
    await writeFile(join(scratch, 'package.json'), JSON.stringify({
      dependencies: {
        next: '15.4.10',
        '@sveltejs/kit': '2.0.0',
      },
    }));

    await mkdir(join(scratch, 'app', '(marketing)', 'products', '[id]'), { recursive: true });
    await writeFile(join(scratch, 'app', 'layout.tsx'), 'export default function Layout({ children }) { return children; }\n');
    await writeFile(join(scratch, 'app', '(marketing)', 'products', 'layout.tsx'), 'export default function Layout({ children }) { return children; }\n');
    await writeFile(join(scratch, 'app', '(marketing)', 'products', '[id]', 'page.tsx'), 'export default function Page() { return null; }\n');

    await mkdir(join(scratch, 'src', 'routes', 'dashboard'), { recursive: true });
    await writeFile(join(scratch, 'src', 'routes', '+layout.svelte'), '<slot />\n');
    await writeFile(join(scratch, 'src', 'routes', 'dashboard', '+layout.server.ts'), 'export const load = () => ({});\n');
    await writeFile(join(scratch, 'src', 'routes', 'dashboard', '+page.svelte'), '<h1>Dashboard</h1>\n');

    const { stdout } = await exec('node', [SCRIPT, scratch], { maxBuffer: 8 * 1024 * 1024 });
    const out = JSON.parse(stdout);
    assertRoute(out.routes, { routePath: '/', file: 'app/layout.tsx', type: 'layout' });
    assertRoute(out.routes, { routePath: '/products', file: 'app/(marketing)/products/layout.tsx', type: 'layout' });
    assertRoute(out.routes, { routePath: '/products/[id]', file: 'app/(marketing)/products/[id]/page.tsx', type: 'page' });
    assertRoute(out.routes, { routePath: '/', file: 'src/routes/+layout.svelte', type: 'layout' });
    assertRoute(out.routes, { routePath: '/dashboard', file: 'src/routes/dashboard/+layout.server.ts', type: 'layout' });
    assertRoute(out.routes, { routePath: '/dashboard', file: 'src/routes/dashboard/+page.svelte', type: 'page' });
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});

test('scan-codebase: caps workspace imports at 12 per route', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 'vercel-optimize-scan-'));
  try {
    await writeFile(join(scratch, 'pnpm-workspace.yaml'), "packages:\n  - 'apps/*'\n  - 'packages/*'\n");
    await mkdir(join(scratch, 'apps', 'web', 'app'), { recursive: true });
    await mkdir(join(scratch, 'packages', 'shared', 'src'), { recursive: true });
    await writeFile(join(scratch, 'apps', 'web', 'package.json'), JSON.stringify({
      name: 'web',
      dependencies: { next: '15.4.10', '@acme/shared': 'workspace:*' },
    }));
    const exports = {};
    const imports = [];
    for (let i = 0; i < 16; i++) {
      exports[`./item-${i}`] = `./src/item-${i}.ts`;
      imports.push(`import '@acme/shared/item-${i}';`);
      await writeFile(join(scratch, 'packages', 'shared', 'src', `item-${i}.ts`), `export const item${i} = true;\n`);
    }
    await writeFile(join(scratch, 'packages', 'shared', 'package.json'), JSON.stringify({
      name: '@acme/shared',
      exports,
    }));
    await writeFile(join(scratch, 'apps', 'web', 'app', 'page.tsx'), `${imports.join('\n')}\nexport default function Page() { return null; }\n`);

    const { stdout } = await exec('node', [SCRIPT, join(scratch, 'apps', 'web')], { maxBuffer: 8 * 1024 * 1024 });
    const out = JSON.parse(stdout);
    const page = out.routes.find((r) => r.routePath === '/' && r.type === 'page');
    assert.equal(page.workspaceImports.length, 12);
    assert.ok(page.workspaceImports[0].endsWith('packages/shared/src/item-0.ts'));
    assert.ok(page.workspaceImports.at(-1).endsWith('packages/shared/src/item-11.ts'));
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});

function assertRoute(routes, expected) {
  assert.ok(
    routes.some((r) =>
      r.routePath === expected.routePath &&
      r.file === expected.file &&
      r.type === expected.type
    ),
    `missing route ${JSON.stringify(expected)}`,
  );
}
