import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

export type BuildOptions = {
  entry?: string
  outdir?: string
  formats?: ("esm" | "cjs")[]
  sourcemap?: "inline" | "external" | "none"
  types?: boolean
  target?: string
  /**
   * Mark the built JavaScript entry as executable (chmod +x).
   * If true, prefers mjs when present; falls back to cjs when only cjs is emitted.
   */
  execJs?: boolean
  minify?: boolean
  /**
   * Externalize dependencies instead of bundling them.
   * - array: explicit package names to externalize
   * - "auto": read package.json dependencies and peerDependencies and externalize all
   */
  external?: string[] | "auto"
}

type ResolvedBuildOptions = {
  entry: string
  outdir: string
  formats: ("esm" | "cjs")[]
  sourcemap: "inline" | "external" | "none"
  types: boolean
  target: string
  execJs: boolean
  minify: boolean
  external?: string[] | "auto"
}

function run(cmd: string, args: string[], opts: { cwd?: string } = {}) {
  const res = spawnSync(cmd, args, { stdio: "inherit", cwd: opts.cwd })
  if ((res.status ?? 0) !== 0) {
    const code = res.status ?? 1
    const err: Error & { code?: number } = new Error(
      `Command failed: ${cmd} ${args.join(" ")}`
    )
    err.code = code
    throw err
  }
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true })
}

/**
 * Build the current package using Bun and tsc, mirroring old @packlet/bun.
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  const cwd = process.cwd()
  const opts: ResolvedBuildOptions = {
    entry: options.entry ?? "src/index.ts",
    outdir: options.outdir ?? "dist",
    formats: options.formats ?? ["esm"],
    sourcemap: options.sourcemap ?? "none",
    types: options.types ?? true,
    target: options.target ?? "node",
    execJs: options.execJs ?? false,
    minify: options.minify ?? true,
    external: options.external ?? undefined
  }
  const entry = path.resolve(cwd, opts.entry)
  const outdir = path.resolve(cwd, opts.outdir)
  ensureDir(outdir)

  // Resolve externals if set to "auto"
  let externals: string[] | undefined
  if (opts.external === "auto") {
    try {
      const pkgJson = JSON.parse(
        fs.readFileSync(path.join(cwd, "package.json"), "utf-8")
      ) as {
        dependencies?: Record<string, string>
        peerDependencies?: Record<string, string>
      }
      externals = [
        ...Object.keys(pkgJson.dependencies ?? {}),
        ...Object.keys(pkgJson.peerDependencies ?? {})
      ]
    } catch {
      externals = []
    }
  } else if (Array.isArray(opts.external)) {
    externals = opts.external
  }

  for (const fmt of opts.formats) {
    const outfile = path.join(outdir, `index.${fmt === "esm" ? "mjs" : "cjs"}`)
    const bunArgs = [
      "build",
      entry,
      `--outfile=${outfile}`,
      `--format=${fmt}`,
      `--target=${opts.target}`
    ]
    // Explicitly set sourcemap behavior (coerce inline -> external)
    const sm = opts.sourcemap === "inline" ? "external" : opts.sourcemap
    if (sm === "none") bunArgs.push("--sourcemap=none")
    else if (sm === "external") bunArgs.push("--sourcemap=external")
    if (opts.minify) bunArgs.push("--minify")
    if (externals && externals.length > 0) {
      for (const ext of externals) {
        if (!ext) continue
        // pass as separate args to be safe: --external <pkg>
        bunArgs.push("--external", ext)
      }
    }
    run("bun", bunArgs)
  }

  if (opts.types) {
    run("bun", [
      "x",
      "tsc",
      "-p",
      "tsconfig.json",
      "--emitDeclarationOnly",
      "--outDir",
      opts.outdir
    ])
  }

  if (opts.execJs) {
    const preferred: Array<{ name: string; present: boolean }> = [
      {
        name: "index.mjs",
        present: fs.existsSync(path.join(outdir, "index.mjs"))
      },
      {
        name: "index.cjs",
        present: fs.existsSync(path.join(outdir, "index.cjs"))
      }
    ]
    const targetFile = preferred.find((p) => p.present)?.name
    if (targetFile) {
      try {
        fs.chmodSync(path.join(outdir, targetFile), 0o755)
      } catch {}
    }
  }
}

export default { build }
