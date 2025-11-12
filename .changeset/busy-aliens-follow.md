---
"@packlet/cli": patch
"@packlet/gpr": patch
---

Update the CLI entrypoints in both `packages/cli/src/index.ts` and `packages/gpr/src/index.ts` to improve compatibility with both CommonJS (CJS) and ECMAScript Module (ESM) environments. The main change is a refactor of the logic that determines whether the CLI should be executed when the script is run directly, ensuring correct behavior regardless of module type.
