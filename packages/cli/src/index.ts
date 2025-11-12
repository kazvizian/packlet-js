#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { type BuildOptions, build as buildPacklet } from "@packlet/build"
import {
  listArtifacts,
  validateDist,
  writeArtifactsManifest
} from "@packlet/core"
import { awakenGpr } from "@packlet/gpr"
import { Command } from "commander"

function outputJson(data: unknown) {
  process.stdout.write(`${JSON.stringify(data)}\n`)
}

/**
 * Execute the `packlet` command-line interface.
 *
 * The function wires up subcommands (currently `prepare` and `gpr`) and
 * delegates handling to smaller handlers in `gpr-cli.ts` and `prepare-gpr.ts`.
 *
 * @param argv - Optional argv array (defaults to `process.argv`). Useful
 *               for tests or programmatic invocation.
 * @returns Promise that resolves after parsing/executing the command.
 */
export async function runCli(
  argv: readonly string[] = process.argv
): Promise<void> {
  const program = new Command()
    .name("packlet")
    .description("Packing and artifact utilities")
    .version("0.1.0")

  program
    .command("build")
    .description(
      "Build ESM (default) and emit types for current package; add CJS via --cjs"
    )
    .option("--entry <file>", "Entry file (default: src/index.ts)")
    .option("--outdir <dir>", "Output directory (default: dist)")
    .option("--formats <list>", "Comma-separated: esm,cjs (default: esm)")
    .option(
      "--sourcemap <kind>",
      "external | none (default: none). 'inline' is coerced to external."
    )
    .option("--no-types", "Skip emitting .d.ts")
    .option("--target <target>", "Build target (default: node)")
    .option(
      "--exec-js",
      "chmod +x built entry (prefers dist/index.mjs; falls back to dist/index.cjs)"
    )
    .option("--cjs", "Also emit CommonJS output")
    .option("--no-minify", "Disable minification")
    .action(async (opts: Record<string, unknown>) => {
      const formats = String(opts.formats || "esm")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as ("esm" | "cjs")[]
      if (opts.cjs && !formats.includes("cjs")) formats.push("cjs")
      try {
        const buildOpts: BuildOptions = {
          entry: (opts.entry as string) || "src/index.ts",
          outdir: (opts.outdir as string) || "dist",
          formats,
          sourcemap: ((): "inline" | "external" | "none" => {
            const sm = String(opts.sourcemap || "none")
            if (sm === "inline") return "inline" // coerced to external downstream
            if (sm === "external") return "external"
            return "none"
          })(),
          types: (opts.types as boolean) ?? true,
          target: (opts.target as string) || "node",
          execJs: Boolean((opts as Record<string, unknown>).execJs),
          minify: (opts.minify as boolean) ?? true
        }
        await buildPacklet(buildOpts)
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err))
        process.exitCode = 1
      }
    })

  program
    .command("gpr")
    .description("Prepare a GitHub Packages scoped build and tarballs")
    .option("--root <path>", "Root directory (default: cwd)")
    .option("--dist <path>", "Built output directory (default: dist)")
    .option(
      "--artifacts <path>",
      "Directory for tarballs (default: .artifacts)"
    )
    .option(
      "--gpr-dir <path>",
      "Directory to stage GPR package (default: .gpr)"
    )
    .option(
      "--scope <scope>",
      "GitHub Packages scope (default: env GPR_SCOPE or kazvizian)"
    )
    .option(
      "--registry <url>",
      "Registry URL (default: env GPR_REGISTRY or https://npm.pkg.github.com/)"
    )
    .option(
      "--name <name>",
      "Override base package name for the scoped package"
    )
    .option("--include-readme", "Include README.md", undefined)
    .option("--no-include-readme", "Do not include README.md")
    .option("--include-license", "Include LICENSE", undefined)
    .option("--no-include-license", "Do not include LICENSE")
    .option("--json", "Output JSON manifest after packing")
    .option(
      "--manifest <file>",
      "Write artifacts manifest to file (default: artifacts.json in artifacts dir)"
    )
    .action((opts: Record<string, unknown>) => {
      const options = {
        rootDir: opts.root as string | undefined,
        distDir: opts.dist as string | undefined,
        artifactsDir: (opts.artifacts as string) || undefined,
        gprDir:
          (opts.gprDir as string) || (opts["gpr-dir"] as string) || undefined,
        scope: (opts.scope as string) || undefined,
        registry: (opts.registry as string) || undefined,
        nameOverride: (opts.name as string) || undefined,
        includeReadme: opts.includeReadme as boolean | undefined,
        includeLicense: opts.includeLicense as boolean | undefined
      }
      try {
        const res = awakenGpr(options)
        // produce manifest
        const artifactsDir = res.artifactsDir
        const manifest = writeArtifactsManifest(artifactsDir, {
          packageName:
            path.basename(res.scopedName).replace(/^@.+\//, "") ||
            res.scopedName,
          scopedName: res.scopedName,
          version: res.version
        })
        const manifestPath = opts.manifest
          ? path.resolve(String(opts.manifest))
          : path.join(artifactsDir, "artifacts.json")
        if (opts.manifest) {
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        }
        if (opts.json) {
          outputJson(manifest)
        } else {
          console.log(`Prepared GPR package at ${res.gprDir}`)
          console.log(`Artifacts prepared at ${res.artifactsDir}`)
        }
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err))
        process.exitCode = 1
      }
    })

  program
    .command("validate")
    .description("Validate dist directory contains expected entry files")
    .option("--dist <path>", "Dist directory (default: dist)")
    .option("--root <path>", "Root directory (default: cwd)")
    .option("--json", "Output JSON result")
    .action((opts: Record<string, unknown>) => {
      const root = path.resolve((opts.root as string) || process.cwd())
      const dist = path.resolve(root, (opts.dist as string) || "dist")
      const result = validateDist({ distDir: dist })
      if (opts.json) {
        outputJson(result)
      } else if (result.ok) {
        console.log("dist validation: OK")
      } else {
        console.error("Missing files:", result.missing.join(", "))
        process.exitCode = 1
      }
    })

  program
    .command("list-artifacts")
    .description("List tarball artifacts in a directory")
    .option("--artifacts <path>", "Artifacts directory (default: .artifacts)")
    .option("--json", "Output JSON list")
    .action((opts: Record<string, unknown>) => {
      const artifactsDir = path.resolve(
        (opts.artifacts as string) || ".artifacts"
      )
      const list = listArtifacts(artifactsDir)
      if (opts.json) outputJson(list)
      else if (!list.length) console.log("No artifacts found.")
      else
        list.forEach((a: { file: string; size: number }) => {
          console.log(`${a.file}\t${a.size} bytes`)
        })
    })

  await program.parseAsync(argv)
}

// Execute when run directly:
// - CommonJS: require.main === module
// - ESM: import.meta.url matches the executed file (argv[1])
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

if (isCjsMain || isEsmMain) void runCli()
