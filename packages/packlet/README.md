<div align="center">

# 📦️ packlet

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![license](https://img.shields.io/github/license/kazvizian/packlet-js)<br />
[![Turborepo](https://img.shields.io/badge/-Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build)
[![Changesets Butterfly](https://img.shields.io/badge/Changesets-🦋-white)](./CHANGELOG.md)
[![Biome Linter & Formatted](https://img.shields.io/badge/Biome-60a5fa?style=flat&logo=biome&logoColor=white)](https://biomejs.dev/)

[![gzip size](http://img.badgesize.io/https://unpkg.com/packlet@latest/dist/index.mjs?compression=gzip)](https://unpkg.com/packlet@latest/dist/index.mjs)

</div>

> The main public package for the Packlet toolkit. Installs a single CLI (`packlet`) and a small programmatic API for deterministic packaging and artifact generation.

Packlet focuses on:

- Deterministic packing and artifact generation (manifest, tarballs)
- Simple, local-first workflows that also fit CI
- A stable `artifacts.json` contract shared with CI/publishing tools

If you’re looking for orchestration and publishing (tokens, CI, releases), see the companion project “sailet”.

## Installation

```sh
# with bun
bun add -D packlet

# or with npm
npm i -D packlet

# or globally
bun add -g packlet
# npm i -g packlet
```

## Quick Start

```sh
# build your package (ESM by default; add CJS with --cjs)
packlet build

# prepare a GPR variant and write a JSON manifest
packlet gpr --root . --json

# list artifacts (human)
packlet list-artifacts --artifacts .artifacts

# list artifacts (JSON)
packlet list-artifacts --artifacts .artifacts --json

# validate dist contents
packlet validate --root . --json
```

## CLI Commands

- `packlet build` – Build ESM (default) and emit types; add `--cjs` to also emit CommonJS
- `packlet gpr` – Prepare a GitHub Packages (GPR) scoped build and tarballs
  Flags: `--root`, `--gpr-dir`, `--artifacts`, `--dist`, `--scope`, `--registry`, `--name` (scoped or unscoped),
  `--include-readme`, `--no-include-readme`, `--include-license`, `--no-include-license`,
  `--json`, `--manifest <file>`

- `packlet validate` – Verify common dist entries (`index.js`, `index.mjs`, `index.d.ts`)

- `packlet list-artifacts` – List `.tgz` files under an artifacts directory

> Note: The `@packlet/gpr` package also exposes a light `prepare` subcommand for CI.

## Programmatic API

Install as a dev dependency and import what you need:

```ts
import {
  // Core helpers
  listArtifacts,
  writeArtifactsManifest,
  validateDist,
  deriveScopedName,
  // GPR helper
  awakenGpr
} from "packlet"

const result = validateDist({ distDir: "dist" })
const artifacts = listArtifacts(".artifacts")
const manifest = writeArtifactsManifest(".artifacts", {
  packageName: "my-lib",
  scopedName: "@acme/my-lib",
  version: "1.2.3"
})
const gpr = awakenGpr({ rootDir: process.cwd() })
```

### Types

```ts
import type {
  ArtifactEntry,
  ArtifactsManifestV1,
  ValidateDistOptions,
  ValidateDistResult,
  DeriveNameInput
} from "packlet"
```

## Artifacts Manifest

Running `packlet gpr` writes `<root>/.artifacts/artifacts.json`:

```json
{
  "schemaVersion": 1,
  "packageName": "<base-name>",
  "scopedName": "@<scope>/<base-name>",
  "version": "<semver>",
  "artifacts": [
    { "file": "<name>-<version>.tgz", "size": 12345, "sha512": "..." }
  ]
}
```

## Name derivation (GPR)

Priority for computing the GPR package name:

1. Explicit overrides

- `packlet.gprName` in `package.json` (scoped or unscoped), or
- `--name` flag / `GPR_NAME` env (scoped or unscoped)

2. Monorepo default: use the package name

- In monorepos (`packages/*`), use `package.json.name` (scope stripped) as the base.

3. Single-package repos: repo or package name

- Use repo name from `repository.url` if present, otherwise `package.json.name` (scope stripped).

Unscoped bases are combined with scope (default `kazvizian`) → `@<scope>/<base>`.

### package.json config

```jsonc
{
  "packlet": {
    "gpr": true,
    // optional; unscoped becomes @<scope>/<name>, scoped is used verbatim
    "gprName": "packlet-core"
  }
}
```

## Monorepo Notes

This package lives in a monorepo alongside:

- `@packlet/core` – utilities: manifest, validation, name derivation, copy helpers
- `@packlet/gpr` – preparing GPR-scoped variants and tarballs
- `@packlet/cli` – CLI implementation (consumed here)

### Build Wrapper

The build is performed by the shared wrapper `@packlet/build`:

- Generates minified ESM output by default (`dist/index.mjs`). CJS can be emitted with `--cjs` (produces `dist/index.cjs`).
- Emits types (`dist/index.d.ts`) via `tsc --emitDeclarationOnly`.
- Sourcemaps are disabled by default for release builds; enable external maps with `--sourcemap external` for debugging.
- For CLI packages we pass `--exec-js` so the built JS entry (`dist/index.mjs` or `dist/index.cjs`) is marked executable.

`package.json` excerpt:

```json
{
  "scripts": {
    "build": "node ../build/dist/cli.mjs build --sourcemap none --external-auto",
    "build:cli": "node ../build/dist/cli.mjs build --cjs --exec-js --sourcemap none --external-auto"
  },
  "devDependencies": {
    "@packlet/build": "workspace:*"
  }
}
```

Use `--no-minify` during debugging if you need readable output.

> **Note:** `@packlet/build` invokes `bun build` under the hood for bundling. Bun must be installed on the machine where you run package builds (recommended Bun >= 1.2.0). If Bun is not available, the build step (CLI or package scripts that call `packlet build` / `packlet-build`) will fail. For CI environments without Bun you can either install Bun in the runner or use the programmatic API with an alternate bundler workflow.

## License

MIT © KazViz
