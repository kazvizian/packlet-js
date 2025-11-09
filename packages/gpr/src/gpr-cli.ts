import type { AwakenGprOptions } from "./awaken-gpr"
import { awakenGpr } from "./awaken-gpr"

/**
 * Handle the `gpr` CLI command (full feature) as a separate module for clarity.
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
