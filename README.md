<div align="center">

# 📦️ Packlet

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![license](https://img.shields.io/github/license/kazvizian/conjura)<br />
[![Turborepo](https://img.shields.io/badge/-Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build)
[![semantic-release](https://img.shields.io/badge/semantic--release-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Biome Linter & Formatted](https://img.shields.io/badge/Biome-60a5fa?style=flat&logo=biome&logoColor=white)](https://biomejs.dev/)

</div>

A concise toolkit for packaging and creating deterministic release artifacts.

## Packages

- `@packlet/core` – Core utilities: artifact manifest, validation, name derivation, copy helpers
- `@packlet/gpr` – Tools for preparing GitHub Packages (GPR) scoped variants and tarballs
- `@packlet/cli` – Unified CLI exposing `packlet` commands (`gpr`, `validate`, `list-artifacts`)

## Philosophy

- Deterministic packing and artifact generation belong to `packlet`.
- Orchestration and publishing (CI, tokens, releases) are handled by `sailet` — see related docs in `docs/`.
- Both interact through a stable `artifacts.json` manifest.

## Quick Start (monorepo)

```sh
# install & build
bun install
bun run build

# prepare a GPR variant and output a JSON manifest
node packages/cli/dist/index.cjs gpr --root packages/gpr --json

# list artifacts (human or JSON output)
node packages/cli/dist/index.cjs list-artifacts --artifacts packages/gpr/.artifacts
node packages/cli/dist/index.cjs list-artifacts --artifacts packages/gpr/.artifacts --json

# validate dist
node packages/cli/dist/index.cjs validate --root packages/gpr --json
```

## CLI Commands (`packlet`)

- `packlet gpr` – Prepare a GPR-staged package and tarballs
  Flags: `--root`, `--gpr-dir`, `--artifacts`, `--dist`, `--scope`, `--registry`, `--name`,
  `--include-readme`, `--no-include-readme`, `--include-license`, `--no-include-license`,
  `--json`, `--manifest <file>`

- `packlet validate` – Verify required dist entries (`index.js`, `index.mjs`, `index.d.ts`)

- `packlet list-artifacts` – List all `.tgz` files in an artifacts directory

> [!NOTE]
>
> `@packlet/gpr` also provides a lightweight `prepare` subcommand (mainly for CI or testing).
> It conditionally stages the GPR variant if `packlet.gpr` is enabled and `dist/` exists.
> Supported flags: `--root`, `--dist`, `--gpr-dir`, `--artifacts`, `--scope`, `--registry`, `--name`,
> with optional `--json` and `--manifest <file>` for machine-readable output.

## Artifacts Manifest

Running `packlet gpr` generates `<root>/.artifacts/artifacts.json`:

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

## Name Derivation (for GPR)

Base name is determined by the following priority:

1. `--name` flag or `GPR_NAME` environment variable
2. Repository name from `package.json.repository`
3. `package.json.name` (scope stripped)

## Developer Notes

Temporary test fixtures are created under `.temp/` and cleaned up automatically.

## License

MIT © KazViz
