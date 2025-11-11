#!/usr/bin/env node

/**
 * Packlet umbrella package entry.
 *
 * - Exposes the public CLI via `runCli` and the `packlet` binary.
 * - Re-exports core utilities and selected GPR helpers for programmatic use.
 */

export type { BuildOptions } from "@packlet/build"
export type {
  AnyArtifactsManifest,
  ArtifactEntry,
  ArtifactsManifestV1,
  DeriveNameInput,
  ValidateDistOptions,
  ValidateDistResult
} from "@packlet/core"
// CLI entry (lazy to keep runtime deps optional for programmatic users)
export async function runCli(
  argv: readonly string[] = process.argv
): Promise<void> {
  const mod = await import("@packlet/cli")
  return mod.runCli(argv)
}
export { build } from "@packlet/build"
// Programmatic API surface
// Curated public API surface
// Re-export commonly used core helpers & types for clarity instead of wildcard.
export {
  deriveScopedName,
  listArtifacts,
  validateDist,
  writeArtifactsManifest
} from "@packlet/core"
export { awakenGpr } from "@packlet/gpr"

// Execute CLI when run directly
if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module
) {
  // Fire-and-forget; discard promise
  void (async () => {
    await runCli()
  })()
}
