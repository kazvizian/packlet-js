import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

export type BuildOptions = {
  entry?: string
  outdir?: string
  formats?: ("esm" | "cjs")[]
  sourcemap?: "inline" | "none"
  types?: boolean
  target?: string
  execCjs?: boolean
  minify?: boolean
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
  const opts: Required<BuildOptions> = {
    entry: options.entry ?? "src/index.ts",
    outdir: options.outdir ?? "dist",
    formats: options.formats ?? ["esm", "cjs"],
    sourcemap: options.sourcemap ?? "inline",
    types: options.types ?? true,
    target: options.target ?? "node",
    execCjs: options.execCjs ?? false,
    minify: options.minify ?? true
  }
  const entry = path.resolve(cwd, opts.entry)
  const outdir = path.resolve(cwd, opts.outdir)
  ensureDir(outdir)

  for (const fmt of opts.formats) {
    const outfile = path.join(outdir, `index.${fmt === "esm" ? "mjs" : "cjs"}`)
    const bunArgs = [
      "build",
      entry,
      `--outfile=${outfile}`,
      `--format=${fmt}`,
      `--target=${opts.target}`
    ]
    if (opts.sourcemap && opts.sourcemap !== "none")
      bunArgs.push(`--sourcemap=${opts.sourcemap}`)
    if (opts.minify) bunArgs.push("--minify")
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

  if (opts.execCjs) {
    try {
      fs.chmodSync(path.join(outdir, "index.cjs"), 0o755)
    } catch {}
  }
}

export default { build }
