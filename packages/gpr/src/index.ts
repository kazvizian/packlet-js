#!/usr/bin/env node
import { Command } from "commander"
import { awakenGpr } from "./awaken-gpr"
import { handleGpr } from "./gpr-cli"
import { handlePrepare } from "./prepare-gpr"

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

  // Lightweight 'prepare' helper used in tests and CI to conditionally stage GPR
  program
    .command("prepare")
    .description(
      "Prepare GPR variant if dist exists and packlet.gpr flag is enabled; writes basic output"
    )
    .option("--root <path>", "Root directory (default: cwd)")
    .option("--dist <path>", "Built output directory (default: dist)")
    .option(
      "--gpr-dir <path>",
      "Directory to stage GPR package (default: .gpr)"
    )
    .option(
      "--artifacts <path>",
      "Directory for tarballs (default: .artifacts)"
    )
    .option(
      "--scope <scope>",
      "GitHub Packages scope (default env or kazvizian)"
    )
    .option("--registry <url>", "Registry URL (default env or GitHub Packages)")
    .option("--name <name>", "Override fully-scoped name or base name")
    .action((opts: Record<string, unknown>) => {
      // Delegate to the dedicated handler implemented in prepare-gpr.ts
      handlePrepare(opts)
    })

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
      // Delegate to gpr-cli handler
      await handleGpr(opts)
    })

  await program.parseAsync(argv)
}

// Execute when run directly in Node (guard for environments without CommonJS globals)
if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module
) {
  // Fire-and-forget; explicitly discard returned promise for clarity
  void runCli()
}
