import type { AwakenGprOptions } from "./awaken-gpr"
import { awakenGpr } from "./awaken-gpr"

/**
 * Handle the `gpr` CLI command (full feature) as a separate module for clarity.
 */
/**
 * Handle the `gpr` CLI command.
 *
 * This function adapts raw Commander option objects into a strongly-typed
 * {@link AwakenGprOptions} and invokes {@link awakenGpr}. Any errors are
 * logged and the process exit code is set to `1` on failure.
 *
 * @param opts - Raw options object produced by Commander. Common fields:
 *               `root`, `gprDir`, `artifacts`, `dist`, `scope`, `registry`,
 *               `name`, `includeReadme`, `includeLicense`.
 * @returns A promise that resolves when the operation completes.
 *
 * @example
 * await handleGpr({ root: '.', dist: 'dist' })
 */
export async function handleGpr(opts: Record<string, unknown>): Promise<void> {
  const options: AwakenGprOptions = {
    rootDir: opts.root as string | undefined,
    gprDir: (opts.gprDir as string) ?? (opts["gpr-dir"] as string),
    artifactsDir: (opts.artifacts as string) ?? (opts.artifactsDir as string),
    distDir: opts.dist as string | undefined,
    scope: opts.scope as string | undefined,
    registry: opts.registry as string | undefined,
    nameOverride: (opts.name as string) ?? (opts.nameOverride as string),
    includeReadme: opts.includeReadme as boolean | undefined,
    includeLicense: opts.includeLicense as boolean | undefined
  }

  try {
    const res = awakenGpr(options)
    console.log(`Prepared GPR package at ${res.gprDir}`)
    console.log(`Artifacts prepared at ${res.artifactsDir}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(message)
    process.exitCode = 1
  }
}

export default handleGpr
