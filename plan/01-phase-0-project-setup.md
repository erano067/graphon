# Phase 0: Project Setup

## Overview

Initialize the monorepo with all tooling, testing infrastructure, and demo app scaffold.

---

## Task 0.1: Monorepo Initialization

### Overview
Set up pnpm workspace monorepo with package structure.

### Dependencies
None (first task)

### Acceptance Criteria
- [ ] pnpm workspace configured
- [ ] All packages created with package.json
- [ ] TypeScript configured (shared tsconfig)
- [ ] ESLint + Prettier configured
- [ ] Can run `pnpm install` successfully

### Implementation Steps

1. Initialize root package.json:
```json
{
  "name": "graphon",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  }
}
```

2. Create pnpm-workspace.yaml:
```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

3. Create turbo.json for build orchestration:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

4. Create package directories:
```
packages/core/
packages/react/
packages/layouts/
apps/demo/
tests/visual/
tests/benchmarks/
```

5. Initialize each package with minimal package.json

### Files to Create

```
graphon/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .nvmrc                    # Node version
├── packages/
│   ├── core/
│   │   └── package.json
│   ├── react/
│   │   └── package.json
│   └── layouts/
│       └── package.json
└── apps/
    └── demo/
        └── package.json
```

### Tests Required
- Verify: `pnpm install` completes without error
- Verify: All packages are linked correctly

### Demo Addition
None (infrastructure only)

---

## Task 0.2: TypeScript Configuration

### Overview
Configure TypeScript with strict settings and path aliases.

### Dependencies
- Task 0.1

### Acceptance Criteria
- [ ] Shared base tsconfig
- [ ] Per-package tsconfig extending base
- [ ] Path aliases working (@graphon/core, etc.)
- [ ] `pnpm typecheck` passes

### Implementation Steps

1. Create root tsconfig.base.json:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

2. Create per-package tsconfig.json extending base

3. Configure project references for incremental builds

### Files to Create/Modify
- `tsconfig.base.json`
- `packages/core/tsconfig.json`
- `packages/react/tsconfig.json`
- `packages/layouts/tsconfig.json`
- `apps/demo/tsconfig.json`

### Tests Required
- `pnpm typecheck` passes
- IDE shows no errors

---

## Task 0.3: Build Tooling (tsup)

### Overview
Configure tsup for building packages with ESM and CJS outputs.

### Dependencies
- Task 0.2

### Acceptance Criteria
- [ ] `pnpm build` builds all packages
- [ ] ESM and CJS outputs generated
- [ ] Type declarations generated
- [ ] Source maps generated

### Implementation Steps

1. Add tsup to each package:
```bash
pnpm add -D tsup -w --filter @graphon/core
```

2. Create tsup.config.ts for each package:
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['graphology', 'pixi.js', 'react'],
});
```

3. Configure package.json exports:
```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### Files to Create/Modify
- `packages/core/tsup.config.ts`
- `packages/core/package.json` (add exports)
- `packages/react/tsup.config.ts`
- `packages/react/package.json`
- `packages/layouts/tsup.config.ts`
- `packages/layouts/package.json`

### Tests Required
- Build completes without error
- Output files exist in dist/
- Types are generated

---

## Task 0.4: Testing Infrastructure (Vitest)

### Overview
Set up Vitest for unit and integration testing.

### Dependencies
- Task 0.3

### Acceptance Criteria
- [ ] Vitest configured for all packages
- [ ] Test coverage reporting enabled
- [ ] `pnpm test` runs all tests
- [ ] `pnpm test:watch` for development

### Implementation Steps

1. Install Vitest:
```bash
pnpm add -D vitest @vitest/coverage-v8 -w
```

2. Create root vitest.config.ts:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/__tests__/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ['packages/**/__tests__/**/*.test.ts'],
  },
});
```

3. Create vitest.workspace.ts for package-specific configs:
```typescript
export default [
  'packages/core',
  'packages/react',
  'packages/layouts',
];
```

4. Add test scripts to root package.json:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

5. Create a sample test to verify setup:
```typescript
// packages/core/src/__tests__/setup.test.ts
describe('Test Setup', () => {
  it('should run tests', () => {
    expect(true).toBe(true);
  });
});
```

### Files to Create/Modify
- `vitest.config.ts`
- `vitest.workspace.ts`
- `packages/core/vitest.config.ts`
- `packages/core/src/__tests__/setup.test.ts`
- `package.json` (add test scripts)

### Tests Required
- Sample test passes
- Coverage report generates

---

## Task 0.5: Visual Regression Testing (Playwright)

### Overview
Set up Playwright for visual regression testing of rendered graphs.

### Dependencies
- Task 0.4

### Acceptance Criteria
- [ ] Playwright configured
- [ ] Screenshot comparison working
- [ ] `pnpm test:visual` runs visual tests
- [ ] Baseline screenshots can be updated

### Implementation Steps

1. Install Playwright:
```bash
pnpm add -D @playwright/test -w
```

2. Create playwright.config.ts:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm --filter demo dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
});
```

3. Create test structure:
```
tests/
└── visual/
    ├── basic-rendering.spec.ts
    ├── interactions.spec.ts
    └── __snapshots__/
```

4. Create sample visual test:
```typescript
// tests/visual/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('demo page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Graphon/);
});
```

### Files to Create
- `playwright.config.ts`
- `tests/visual/smoke.spec.ts`

### Tests Required
- Playwright installs browsers
- Sample test passes

---

## Task 0.6: Performance Benchmarking

### Overview
Set up performance benchmark infrastructure for measuring render performance at scale.

### Dependencies
- Task 0.4

### Acceptance Criteria
- [ ] Benchmark harness created
- [ ] Can measure FPS, render time, memory
- [ ] `pnpm test:bench` runs benchmarks
- [ ] Results stored/compared over time

### Implementation Steps

1. Create benchmark utilities:
```typescript
// tests/benchmarks/utils/harness.ts
export interface BenchmarkResult {
  name: string;
  nodeCount: number;
  edgeCount: number;
  metrics: {
    initialRenderMs: number;
    avgFrameMs: number;
    fps: number;
    memoryMB: number;
  };
}

export async function runBenchmark(
  name: string,
  setup: () => Promise<void>,
  teardown: () => Promise<void>
): Promise<BenchmarkResult> {
  // Implementation
}
```

2. Create benchmark test file:
```typescript
// tests/benchmarks/render.bench.ts
import { describe, bench } from 'vitest';
import { generateGraph } from './utils/generate';

describe('Render Performance', () => {
  bench('10k nodes', async () => {
    const graph = generateGraph(10_000, 20_000);
    // render and measure
  });

  bench('50k nodes', async () => {
    const graph = generateGraph(50_000, 100_000);
    // render and measure
  });

  bench('100k nodes', async () => {
    const graph = generateGraph(100_000, 200_000);
    // render and measure
  });
});
```

3. Add threshold checks:
```typescript
// tests/benchmarks/thresholds.ts
export const PERFORMANCE_THRESHOLDS = {
  '10k': { maxInitialRenderMs: 500, minFps: 60 },
  '50k': { maxInitialRenderMs: 2000, minFps: 30 },
  '100k': { maxInitialRenderMs: 5000, minFps: 20 },
};
```

### Files to Create
- `tests/benchmarks/utils/harness.ts`
- `tests/benchmarks/utils/generate.ts`
- `tests/benchmarks/render.bench.ts`
- `tests/benchmarks/thresholds.ts`

### Tests Required
- Benchmark runs without error
- Results output to console/file

---

## Task 0.7: Linting & Formatting

### Overview
Configure ESLint and Prettier for consistent code style.

### Dependencies
- Task 0.2

### Acceptance Criteria
- [ ] ESLint configured with TypeScript rules
- [ ] Prettier configured
- [ ] `pnpm lint` checks all files
- [ ] `pnpm format` fixes formatting
- [ ] Pre-commit hooks (optional)

### Implementation Steps

1. Install ESLint and plugins:
```bash
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier -w
```

2. Create eslint.config.js (flat config):
```javascript
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

3. Create .prettierrc:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Files to Create
- `eslint.config.js`
- `.prettierrc`
- `.prettierignore`

### Tests Required
- `pnpm lint` passes on empty project
- `pnpm format` runs without error

---

## Task 0.8: Demo App Scaffold (Vite + React)

### Overview
Create the demo app that will showcase each feature as it's built.

### Dependencies
- Task 0.7

### Acceptance Criteria
- [ ] Vite + React app created
- [ ] Demo runs at localhost:5173
- [ ] Basic routing for feature demos
- [ ] Placeholder for future demos

### Implementation Steps

1. Create Vite React app:
```bash
cd apps
pnpm create vite demo --template react-ts
```

2. Set up routing structure:
```typescript
// apps/demo/src/App.tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

const demos = [
  { path: '/', name: 'Home', component: Home },
  { path: '/basic-rendering', name: 'Basic Rendering', component: Placeholder },
  { path: '/node-styling', name: 'Node Styling', component: Placeholder },
  { path: '/edge-styling', name: 'Edge Styling', component: Placeholder },
  { path: '/interactions', name: 'Interactions', component: Placeholder },
  { path: '/layouts', name: 'Layouts', component: Placeholder },
  { path: '/clustering', name: 'Clustering & LOD', component: Placeholder },
  { path: '/animations', name: 'Animations', component: Placeholder },
  { path: '/advanced', name: 'Advanced Features', component: Placeholder },
  { path: '/benchmark', name: 'Performance', component: Placeholder },
];

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="sidebar">
          <h1>Graphon Demos</h1>
          {demos.map((demo) => (
            <Link key={demo.path} to={demo.path}>{demo.name}</Link>
          ))}
        </nav>
        <main className="content">
          <Routes>
            {demos.map((demo) => (
              <Route key={demo.path} path={demo.path} element={<demo.component />} />
            ))}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
```

3. Add workspace dependency to local packages:
```json
// apps/demo/package.json
{
  "dependencies": {
    "@graphon/core": "workspace:*",
    "@graphon/react": "workspace:*",
    "@graphon/layouts": "workspace:*"
  }
}
```

### Files to Create
- `apps/demo/` (full Vite app structure)
- `apps/demo/src/App.tsx`
- `apps/demo/src/demos/Home.tsx`
- `apps/demo/src/demos/Placeholder.tsx`
- `apps/demo/src/styles/` (basic styling)

### Tests Required
- `pnpm --filter demo dev` starts server
- All routes accessible

### Demo Addition
- Home page with project overview
- Sidebar navigation
- Placeholder for all future demos

---

## Task 0.9: CI Pipeline (GitHub Actions)

### Overview
Set up GitHub Actions for continuous integration.

### Dependencies
- Task 0.8 (all tooling ready)

### Acceptance Criteria
- [ ] CI runs on every PR
- [ ] Runs lint, typecheck, tests
- [ ] Runs visual regression tests
- [ ] Fails on test failure or coverage drop

### Implementation Steps

1. Create .github/workflows/ci.yml:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: npx playwright install --with-deps
      - run: pnpm test:visual
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test:bench
```

### Files to Create
- `.github/workflows/ci.yml`

### Tests Required
- Push to repo triggers CI
- All jobs pass on clean repo

---

## Phase 0 Checklist

After completing all tasks:

- [ ] `pnpm install` works
- [ ] `pnpm build` builds all packages
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` runs tests
- [ ] `pnpm test:visual` runs Playwright
- [ ] `pnpm test:bench` runs benchmarks
- [ ] `pnpm --filter demo dev` starts demo app
- [ ] CI pipeline runs on push

**Estimated time:** 1-2 days
