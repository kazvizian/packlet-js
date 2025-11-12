# 📦️ @packlet/core

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![license](https://img.shields.io/github/license/kazvizian/packlet-js)<br />
[![Turborepo](https://img.shields.io/badge/-Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build)
[![Changesets Butterfly](https://img.shields.io/badge/Changesets-🦋-white)](./CHANGELOG.md)
[![Biome Linter & Formatted](https://img.shields.io/badge/Biome-60a5fa?style=flat&logo=biome&logoColor=white)](https://biomejs.dev/)

[![gzip size](http://img.badgesize.io/https://unpkg.com/@packlet/core@latest/dist/index.mjs?compression=gzip)](https://unpkg.com/@packlet/core@latest/dist/index.mjs)

</div>

Core utilities for preparing and inspecting deterministic release artifacts.

## Features

- **Types:** `ArtifactEntry`, `ArtifactsManifestV1` — structure for artifact manifests.
- **Crypto:** `computeSha512(filePath)` — compute SHA-512 of a file.
- **Artifacts:** `listArtifacts(dir)`, `writeArtifactsManifest(dir, data)` — list and emit artifact manifests (`artifacts.json`).
- **Validation:** `validateDist({ distDir })` — check that expected build outputs exist.
- **Utilities:** `deriveScopedName`, `extractRepoName`, `copyRecursive`.

All symbols are exported from `src/index.ts`.

## Example

```ts
import {
  deriveScopedName,
  writeArtifactsManifest,
  validateDist,
  listArtifacts
} from "@packlet/core"

const { baseName, scopedName } = deriveScopedName({
  name: "my-lib",
  scope: "acme"
})
console.log(scopedName) // -> @acme/my-lib

const v = validateDist({ distDir: "./dist" })
if (!v.ok) console.warn("Missing dist files:", v.missing)

writeArtifactsManifest("./.artifacts", {
  packageName: baseName,
  scopedName,
  version: "0.1.0"
})
```

## Behavior

- `computeSha512(filePath)`: returns hex SHA-512 of file contents.
- `listArtifacts(dir)`: returns array of `{ file, size, sha512 }` for `*.tgz` files.
- `writeArtifactsManifest(dir, data)`: writes `artifacts.json` (schema v1) and returns the manifest.
- `validateDist({ distDir, expected? })`: checks for `index.js`, `index.mjs`, `index.d.ts` by default, returns `{ ok, missing }`.
- `deriveScopedName({ name, repoUrl?, override?, scope? })`: derives a base and scoped name; uses `override` verbatim if scoped.

Edge cases:

- `listArtifacts` returns `[]` if the directory doesn’t exist.
- `writeArtifactsManifest` calls `listArtifacts` if artifacts aren’t provided.

## Development

```fish
bun install --frozen-lockfile
cd packages/core
bun run build
bun test
```

Or use Turbo from the repo root for full monorepo builds/tests.

## More

- CLI and publishing tools: `packages/gpr`, `packages/cli`
- CI: `docs/ci-workflows.md`
- Changelog strategy: `docs/proposals/changelog-aggregation.md`

## License

MIT © KazViz
