#!/usr/bin/env node
import { Command } from "commander"
import { awakenGpr } from "./awaken-gpr"
import type { AwakenGprOptions } from "./awaken-gpr"

/**
 * Public API surface re-exports
 */
export { awakenGpr }

/**
 * CLI entrypoint for `packlet`.
 * Provides a `gpr` subcommand to prepare a GitHub Packages variant of the package.
 */
export async function runCli(
  argv: readonly string[] = process.argv
): Promise<void> {
  const program = new Command()
    .name("packlet")
    .description("Utilities for preparing and publishing packages")
    .version("0.1.0")

  program
    .command("gpr")
    .description("Prepare a GitHub Packages scoped build and tarballs")
    .option("--root <path>", "Root directory (default: cwd)")
    .option(
      "--gpr-dir <path>",
      "Directory to stage GPR package (default: .gpr)"
    )
    .option(
      "--artifacts <path>",
      "Directory for tarballs (default: .artifacts)"
    )
    .option("--dist <path>", "Built output directory (default: dist)")
    .option(
      "--scope <scope>",
      "GitHub Packages scope (default: env GPR_SCOPE or kazvizian)"
    )
    .option(
      "--registry <url>",
      "Registry URL (default: env GPR_REGISTRY or https://npm.pkg.github.com/)"
    )
    .option("--name <name>", "Override package name for the scoped package")
    .option("--include-readme", "Include README.md", undefined)
    .option("--no-include-readme", "Do not include README.md")
    .option("--include-license", "Include LICENSE", undefined)
    .option("--no-include-license", "Do not include LICENSE")
    .action(async (opts: Record<string, unknown>) => {
      const options: AwakenGprOptions = {
        rootDir: opts.root as string | undefined,
        gprDir: (opts["gprDir"] as string) ?? (opts["gpr-dir"] as string),
        artifactsDir:
          (opts["artifacts"] as string) ?? (opts["artifactsDir"] as string),
        distDir: opts["dist"] as string | undefined,
        scope: opts["scope"] as string | undefined,
        registry: opts["registry"] as string | undefined,
        nameOverride:
          (opts["name"] as string) ?? (opts["nameOverride"] as string),
        includeReadme: opts["includeReadme"] as boolean | undefined,
        includeLicense: opts["includeLicense"] as boolean | undefined
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
    })

  await program.parseAsync(argv)
}

// Execute when run directly
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  runCli()
}
