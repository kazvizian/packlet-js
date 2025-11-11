# 📦️ @packlet/cli

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![license](https://img.shields.io/github/license/kazvizian/packlet-js)<br />
[![Turborepo](https://img.shields.io/badge/-Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build)
[![Changesets Butterfly](https://img.shields.io/badge/Changesets-🦋-white)](./CHANGELOG.md)
[![Biome Linter & Formatted](https://img.shields.io/badge/Biome-60a5fa?style=flat&logo=biome&logoColor=white)](https://biomejs.dev/)

</div>

Umbrella CLI providing the `packlet` command across the monorepo.

## Commands

### `packlet gpr`

Prepare a GitHub Packages scoped variant and tarballs.

Flags:
`--root <path>` root directory (default: cwd)
`--dist <path>` dist directory (default: dist)
`--artifacts <path>` artifacts directory (default: .artifacts)
`--gpr-dir <path>` staging directory (default: .gpr)
`--scope <scope>` scope (default env `GPR_SCOPE` or `kazvizian`)
`--registry <url>` registry (default env `GPR_REGISTRY` or GitHub Packages URL)
`--name <name>` override base package name
`--include-readme` / `--no-include-readme`
`--include-license` / `--no-include-license`
`--json` emit artifacts manifest JSON to stdout
`--manifest <file>` custom manifest output path

### `packlet validate`

Validate required dist entry files exist. Checks for `index.js`, `index.mjs`, `index.d.ts` by default.

Flags:
`--root <path>` root directory (default: cwd)
`--dist <path>` dist directory (default: dist)
`--json` output JSON result

### `packlet list-artifacts`

List `.tgz` tarball artifacts in a directory.

Flags:
`--artifacts <path>` artifacts directory (default: .artifacts)
`--json` JSON output

## JSON Manifest Structure

Produced by `gpr` (and optionally `prepare` in `@packlet/gpr`):

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

## Development

```fish
bun install
bun run build
node packages/cli/dist/index.cjs list-artifacts --artifacts packages/gpr/.artifacts
```

## Relationship to `@packlet/gpr`

`@packlet/gpr` implements the underlying packing logic (`awakenGpr`). This CLI wraps it and adds manifest/JSON convenience output. For conditional staging in CI tests, use the `prepare` subcommand from `@packlet/gpr` directly.

## License

MIT © KazViz
