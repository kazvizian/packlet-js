/**
 * Describes a single artifact file inside a package distribution.
 */
export interface ArtifactEntry {
  /** File name (relative to the artifacts directory), e.g. `my-pkg-1.0.0.tgz`. */
  file: string
  /** Size of the file in bytes. */
  size: number
  /** Hex-encoded SHA-512 digest of the file contents. */
  sha512: string
}

/**
 * Version 1 of the artifacts manifest produced by `writeArtifactsManifest`.
 * The `schemaVersion` field is a literal `1` to allow future schema upgrades.
 */
export interface ArtifactsManifestV1 {
  schemaVersion: 1
  /** Package short name, without scope. */
  packageName: string
  /** Fully scoped package name (including `@scope/` when present). */
  scopedName: string
  /** Package version string (semver). */
  version: string
  /** List of artifacts associated with this manifest. */
  artifacts: ArtifactEntry[]
}

/** Union of supported artifacts manifest versions. Presently only V1. */
export type AnyArtifactsManifest = ArtifactsManifestV1

/**
 * Result returned by `validateDist`.
 */
export interface ValidateDistResult {
  /** True when all expected files are present. */
  ok: boolean
  /** List of missing file names (relative to dist dir). */
  missing: string[]
}

/**
 * Options accepted by `validateDist`.
 */
export interface ValidateDistOptions {
  /** Directory containing the built distribution (e.g. `dist`). */
  distDir: string
  /** Optional list of expected file names. Defaults to `index.js`, `index.mjs`, `index.d.ts`. */
  expected?: string[]
}

/**
 * Input used by {@link deriveScopedName} to construct package names.
 *
 * - `name` is the package name from package.json.
 * - `repoUrl` may be used to derive a sensible base name when the package
 *   name corresponds to a monorepo or has unusual formatting.
 * - `override` lets callers force a specific package name; if it contains a
 *   scope (starts with `@` and contains `/`) it will be honored verbatim.
 * - `scope` is an optional scope to apply when the final scoped name is
 *   composed.
 */
export interface DeriveNameInput {
  name: string
  repoUrl?: string
  override?: string
  scope?: string
}
