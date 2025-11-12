# @packlet/cli

## 0.2.1

### Patch Changes

- 1099c2b: Update the CLI entrypoints in both `packages/cli/src/index.ts` and `packages/gpr/src/index.ts` to improve compatibility with both CommonJS (CJS) and ECMAScript Module (ESM) environments. The main change is a refactor of the logic that determines whether the CLI should be executed when the script is run directly, ensuring correct behavior regardless of module type.
- Updated dependencies [1099c2b]
  - @packlet/gpr@0.1.2

## 0.2.0

### Minor Changes

- 5f83f4d: This update modernizes the build system by making ESM the default output format (CJS now opt-in), disabling sourcemaps by default, and adding external dependency handling. The changes reduce package sizes and improve flexibility for library consumers.
  - ESM-first approach: All packages now default to ESM output with CJS available via `--cjs` flag
  - Sourcemap optimization: Disabled by default; inline maps coerced to external to prevent large base64 embeds
  - External dependencies: New `--external` and `--external-auto` flags to avoid bundling dependencies

### Patch Changes

- Updated dependencies [5f83f4d]
  - @packlet/build@0.2.0
  - @packlet/gpr@0.1.1
  - @packlet/core@0.1.1
