<div align="center">

# @packlet/gpr

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm version](https://img.shields.io/npm/v/@packlet/gpr.svg)](https://www.npmjs.com/package/@packlet/gpr)
![license](https://img.shields.io/github/license/kazvizian/packlet-gpr)

[![gzip size](http://img.badgesize.io/https://unpkg.com/@packlet/gpr@latest/dist/index.mjs?compression=gzip)](https://unpkg.com/@packlet/gpr@latest/dist/index.mjs)

</div>

## Overview

`@packlet/gpr` is a lightweight utility for preparing package variants compatible with **GitHub Packages (GPR)**.
It focuses on **deterministic**, **local**, and **CI-friendly** workflows:

- Prepares a _scoped_ package (e.g. `@<scope>/<name>`) based on your project metadata.
- Supports monorepo-friendly naming and a per-package override via `packlet.gprName` in `package.json`.
- Copies build output (`dist/`) into a staging area `.gpr/` and generates `.tgz` tarballs for release.

The package provides two interfaces:

- **CLI:** `packlet gpr` — convenient for local or CI use.
- **API:** `awakenGpr(options)` — for use within JS/TS scripts.

> **Note:** This tool only prepares packages and artifacts.
> It does **not** publish automatically unless you add a publish step to your CI (see the CI section below).

## Key Features

- Creates a **staging package** in `.gpr/` with a properly scoped `package.json`.
- Copies `dist/` into `.gpr/dist/`.
- Optionally includes `README.md` and `LICENSE`.
- Uses `npm pack` to generate `.tgz` tarballs for both the root and scoped package (saved in `.artifacts/`).
- Deterministic GPR package name resolution, with the following priority:
  1. `GPR_NAME` / `nameOverride` option
  2. Repository name from `package.json.repository` (if present)
  3. `package.json.name` (scope removed if applicable)

## Installation

Install as a **development dependency** (recommended):

```sh
# npm
npm i -D @packlet/gpr

# pnpm
pnpm add -D @packlet/gpr

# bun
bun add -d @packlet/gpr
```

## CLI Usage

Once installed, the `packlet` binary becomes available (depending on your package manager).
The main command is:

```sh
packlet gpr [options]
```

**Example:**

```sh
# Prepare a GPR variant for the package at ./packages/gpr
packlet gpr --root packages/gpr --scope kazvizian
```

## CLI Options

| Option                                       | Description                                  | Default                                         |
| -------------------------------------------- | -------------------------------------------- | ----------------------------------------------- |
| `--root <path>`                              | Root directory of the project                | Current working directory                       |
| `--gpr-dir <path>`                           | Staging directory for GPR package            | `.gpr` in root                                  |
| `--artifacts <path>`                         | Output directory for tarballs                | `.artifacts` in root                            |
| `--dist <path>`                              | Build directory                              | `dist` in root                                  |
| `--scope <scope>`                            | GPR scope                                    | `GPR_SCOPE` or `kazvizian`                      |
| `--registry <url>`                           | GPR registry URL                             | `GPR_REGISTRY` or `https://npm.pkg.github.com/` |
| `--name <name>`                              | Override package name (scoped or unscoped)   | Reads `packlet.gprName` if present              |
| `--include-readme` / `--no-include-readme`   | Include or exclude `README.md`               | `true`                                          |
| `--include-license` / `--no-include-license` | Include or exclude `LICENSE`                 | `true`                                          |
| `--json`                                     | Emit artifacts manifest JSON to stdout       | `false`                                         |
| `--manifest <file>`                          | Also write artifacts manifest to custom file | —                                               |

## Output Structure

- **Staging Package:** `<root>/.gpr`
  Contains `package.json`, `dist/`, and optionally `README.md` / `LICENSE`.
- **Tarball Artifacts:** `<root>/.artifacts`
  Contains `.tgz` tarballs for both the root and scoped package.

## Environment Variables

| Variable              | Description                          | Example                       |
| --------------------- | ------------------------------------ | ----------------------------- |
| `GPR_SCOPE`           | Default scope for GPR packages       | `kazvizian`                   |
| `GPR_REGISTRY`        | Default registry URL                 | `https://npm.pkg.github.com/` |
| `GPR_INCLUDE_README`  | Include `README.md` (`true`/`false`) | `true`                        |
| `GPR_INCLUDE_LICENSE` | Include `LICENSE` (`true`/`false`)   | `true`                        |
| `GPR_NAME`            | Override name (scoped or unscoped)   | `packlet-core` or `@acme/x`   |

## Package.json configuration

You can configure GPR behavior per package using a `packlet` block in `package.json`:

```jsonc
{
  "packlet": {
    "gpr": true,
    // Optional override; can be unscoped ("packlet-core") or fully scoped ("@acme/packlet-core").
    "gprName": "packlet-core"
  }
}
```

Rules:

- If `gprName` is unscoped, the CLI applies `--scope` (or `GPR_SCOPE`) automatically, e.g. `@kazvizian/packlet-core`.
- If `gprName` is fully scoped, it will be used verbatim.
- Invalid values (e.g. containing spaces) are ignored with a warning.

## API Usage (Programmatic)

This package exports a single function, `awakenGpr`, which can be used in JavaScript or TypeScript scripts.

**Example:**

```ts
import { awakenGpr } from "@packlet/gpr"

const res = awakenGpr({
  rootDir: "/path/to/pkg",
  scope: "acme",
  includeReadme: true
})

console.log(res.gprDir)
console.log(res.artifactsDir)
console.log(res.scopedName)
console.log(res.version)
```

**Type definitions:**

```ts
interface AwakenGprOptions {
  rootDir?: string
  gprDir?: string
  artifactsDir?: string
  distDir?: string
  scope?: string
  registry?: string
  nameOverride?: string
}
```

## Package naming behavior (important)

Name resolution differs slightly for single-package repos vs monorepos:

Priority used by `awakenGpr`:

1. Explicit overrides

- `packlet.gprName` in `package.json` (scoped or unscoped), or
- `--name` flag / `GPR_NAME` env (scoped or unscoped)

2. Monorepos: prefer the package's own name

- In a monorepo (e.g. `packages/*`), the base name comes from `package.json.name` (scope stripped).

3. Single-package repos: repo or package name

- If not in a monorepo and `repository.url` is present, the repo name may be used as base
  when it differs from `package.json.name`.
- Otherwise, fall back to `package.json.name` (scope stripped).

All unscoped base names are combined with the selected scope (default `kazvizian`) to produce `@<scope>/<base>`.

### Internal dependency version normalization (monorepo)

When staging a GPR variant in a monorepo, internal dependency NAMES are left unchanged (original npm names).
Only version ranges using the `workspace:` protocol are normalized to concrete semver ranges, typically
pinning to `^<internalVersion>` for `dependencies`, `peerDependencies`, and `optionalDependencies`.
If a sibling package defines `packlet.gprName`, that affects only how THIS package itself is named for GPR,
not how its dependencies are referenced.

## CI Example (GitHub Actions)

A minimal example workflow (build + pack):

```yaml
name: Build and Pack

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install dependencies
        run: bun install
      - name: Build
        run: bun run build
      - name: Prepare GPR package
        run: node packages/gpr/dist/index.js gpr --root ./packages/your-pkg --scope your-org
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: packlet-artifacts
          path: packages/your-pkg/.artifacts
```

### Publishing to GitHub Packages

Publishing should be handled **separately** in CI to ensure control and security.

- Use a secret token (`GPR_TOKEN`) — either a GitHub token or a Personal Access Token with `packages:write` permission.
- Run the following in your CI step:

```sh
npm publish <path-to-tgz> --registry https://npm.pkg.github.com/
```

or publish directly from the `.gpr` directory if desired.

## Design Philosophy: Packing vs Publishing

This tool focuses deliberately on **packing**, not publishing, because:

- Packing is **deterministic** and **local** — easy to test and reproduce.
- Publishing involves **authentication**, **2FA**, **organization policies**, and **side effects** — better handled explicitly in CI with secrets.

If you prefer a single command that performs both steps (pack + publish), a conservative subcommand like
`packlet publish` may be introduced in the future — with safe defaults (`--dry-run`, explicit `--confirm`, and token requirements).

## Troubleshooting

- **`dist/ not found`:** Make sure you’ve built your package first (`bun run build` or equivalent).
- **Missing `.tgz` file:** Check the `npm pack` output — sometimes fallback names differ for scoped packages.
- **Unexpected package name:** Use the `GPR_NAME` env variable or `--name` CLI flag to override it.
- **Missing manifest JSON in CI:** Ensure you pass `--json` (for stdout) or `--manifest <file>` so downstream steps can locate `artifacts.json`.
- **Extra temp directories:** Test fixtures may create `.temp/`; they clean up automatically, but you can safely add `.temp/` to `.gitignore`.

## Testing & Contributing

Contributions are welcome!
If you plan to add publishing capabilities, please include:

- Dry-run test cases
- Unit tests for repo/name parsing and overrides
- Documentation that clearly explains token/2FA implications
- Keep CLI handlers lean: `prepare` lives in `src/prepare-gpr.ts`, full `gpr` logic in `src/gpr-cli.ts`.
- When adding new flags, update this README table and the root monorepo README.

## License

MIT © KazViz
