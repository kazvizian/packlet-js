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

[![gzip size](http://img.badgesize.io/https://unpkg.com/@packlet/build@latest/dist/index.mjs?compression=gzip)](https://unpkg.com/@packlet/build@latest/dist/index.mjs)

</div>

Lightweight, general-purpose build wrapper for TypeScript/JavaScript packages.

- Outputs ESM by default: `dist/index.mjs` (CJS available via `--cjs`)
- Emits TypeScript declarations to `dist/` via `tsc`
- Minify on by default; sourcemaps are disabled by default (enable external maps explicitly with `--sourcemap external`)
- Works in any Node/Bun project
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
    "build": "node ../build/dist/cli.mjs build --sourcemap none --external-auto",
    "build:cli": "node ../build/dist/cli.mjs build --cjs --exec-js --sourcemap none --external-auto"
  }
}
```

Or via the umbrella CLI if you already use [`packlet`](https://npmjs.com/package/packlet):

```fish
packlet build
packlet build --exec-js
```

## Programmatic API

```ts
import { build } from "@packlet/build"
await build({
  entry: "src/index.ts",
  outdir: "dist",
  formats: ["esm"], // default
  sourcemap: "none",
  types: true,
  target: "node",
  execJs: false,
  minify: true
})
```

## CLI flags

Flags accepted by both `packlet build` and `packlet-build build`:

- `--entry <file>`: default `src/index.ts`
- `--outdir <dir>`: default `dist`
- `--formats <list>`: default `esm` (use `--cjs` or `--formats esm,cjs` to also emit CJS)
- `--sourcemap <kind>`: `external` | `none` (default `none`). Prefer `external` for dev/debug; `inline` is coerced to `external` to avoid embedding large base64 maps.
- `--no-types`: skip `.d.ts` emission
- `--target <target>`: default `node`
- `--exec-js`: mark `dist/index.mjs` or `dist/index.cjs` executable (for CLIs)
- `--cjs`: convenience flag to also emit `index.cjs` and imply `--exec-js`
- `--no-minify`: disable minification

Notes:

- Declarations are emitted with `tsc --emitDeclarationOnly` using your local `tsconfig.json`.
- Sourcemaps are disabled by default for release builds. If you need sourcemaps for debugging, prefer `--sourcemap external` (we coerce `inline` to `external` to avoid embedding large inline maps in published bundles).
- Prefer `--no-minify` while debugging locally.

## License

MIT © KazViz
