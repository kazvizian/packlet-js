---
"packlet": minor
"@packlet/cli": minor
"@packlet/gpr": minor
"@packlet/build": patch
"@packlet/core": patch
---

- Added support for a `packlet.gprName` field in `package.json` for each package, allowing explicit override of the GPR package name (scoped or unscoped). If unscoped, the chosen scope is applied automatically.
- In monorepos, the default base name for GPR is now always the package's own name (scope stripped), not the repo name, to avoid registry conflicts. Single-package repos may use the repo name if it differs from the package name.
- Internal dependencies in monorepos retain their original npm package names when preparing for GPR; only version ranges are normalized (e.g., workspace protocol to semver).
- Improved validation for `gprName` overrides, accepting only valid scoped or unscoped names and warning on invalid values.
