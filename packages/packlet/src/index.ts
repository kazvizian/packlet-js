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

// Execute CLI when run directly (CJS or ESM)
import { pathToFileURL } from "node:url"

const isCjsMain =
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module
const isEsmMain = (() => {
  try {
    const invoked = process.argv[1]
    if (!invoked) return false
    const invokedUrl = pathToFileURL(invoked).href
    return typeof import.meta !== "undefined" && import.meta.url === invokedUrl
  } catch {
    return false
  }
})()

if (isCjsMain || isEsmMain) {
  void (async () => {
    await runCli()
  })()
}
