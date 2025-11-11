<div align="center">

# 📦️ @packlet/build

[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)<br />
![Conventional Commits](https://img.shields.io/badge/commit-conventional-blue.svg)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![license](https://img.shields.io/github/license/kazvizian/packlet-js)<br />
[![Turborepo](https://img.shields.io/badge/-Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build)
[![Changesets Butterfly](https://img.shields.io/badge/Changesets-🦋-white)](./CHANGELOG.md)
[![Biome Linter & Formatted](https://img.shields.io/badge/Biome-60a5fa?style=flat&logo=biome&logoColor=white)](https://biomejs.dev/)

</div>

Lightweight, general-purpose build wrapper for TypeScript/JavaScript packages.

- Outputs ESM and CJS: `dist/index.mjs`, `dist/index.cjs`
- Emits TypeScript declarations to `dist/` via `tsc`
- Minify on by default; inline sourcemaps by default (tweakable)
- Works in any Node/Bun project, inside or outside this monorepo
- Powers `packlet build` in the umbrella CLI

## Install

```fish
# as a dev dependency
bun add -D @packlet/build

# npm
# npm i -D @packlet/build
```

> **Note:** @packlet/build invokes `bun build` under the hood for bundling. Bun must be installed on the machine where you run the build (recommended Bun >= 1.2.0). If Bun is not available, the build step will fail. For CI or developer environments without Bun you can still call the programmatic API, but the CLI and scripts depend on Bun.

## Scripts

Use the provided binary or the umbrella CLI:

```json
{
  "scripts": {
    "build": "bun x packlet-build build",
    "build:cli": "bun x packlet-build build --exec-cjs"
  }
}
```

Or via the umbrella CLI if you already use `packlet`:

```fish
packlet build
packlet build --exec-cjs
```

## Programmatic API

```ts
import { build } from "@packlet/build"
await build({
  entry: "src/index.ts",
  outdir: "dist",
  formats: ["esm", "cjs"],
  sourcemap: "inline",
  types: true,
  target: "node",
  execCjs: false,
  minify: true
})
```

## CLI flags

Flags accepted by both `packlet build` and `packlet-build build`:

- `--entry <file>`: default `src/index.ts`
- `--outdir <dir>`: default `dist`
- `--formats <list>`: default `esm,cjs`
- `--sourcemap <kind>`: `inline` | `none` (default `inline`)
- `--no-types`: skip `.d.ts` emission
- `--target <target>`: default `node`
- `--exec-cjs`: mark `dist/index.cjs` executable (for CLIs)
- `--no-minify`: disable minification

Notes:

- Declarations are emitted with `tsc --emitDeclarationOnly` using your local `tsconfig.json`.
- For small, single-file outputs we use inline sourcemaps by default.
- Prefer `--no-minify` while debugging locally.

## License

MIT © KazViz
