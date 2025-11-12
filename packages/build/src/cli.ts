#!/usr/bin/env node
import { build } from "./index"

function parseArgv(argv: string[]) {
  const opts: Record<string, unknown> = {
    entry: "src/index.ts",
    outdir: "dist",
    formats: "esm",
    sourcemap: "none",
    types: true,
    target: "node",
    execJs: false,
    minify: true,
    external: undefined as unknown,
    externalAuto: false as boolean
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === "build") continue
    else if (a === "--entry") opts.entry = argv[++i]
    else if (a === "--outdir") opts.outdir = argv[++i]
    else if (a === "--formats") opts.formats = argv[++i]
    else if (a === "--sourcemap") opts.sourcemap = argv[++i]
    else if (a === "--cjs") {
      // convenience flag: include cjs alongside current formats (does not set execJs)
      const current = String(opts.formats)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      if (!current.includes("cjs")) current.push("cjs")
      opts.formats = current.join(",")
      // opts.execJs is no longer set by --cjs; use --exec-js to control executability
    } else if (a === "--no-types") opts.types = false
    else if (a === "--target") opts.target = argv[++i]
    else if (a === "--exec-js") opts.execJs = true
    else if (a === "--no-minify") opts.minify = false
    else if (a === "--minify") opts.minify = true
    else if (a === "--external") {
      const v = argv[++i]
      const list = String(v)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      const prev = (opts.external as string[] | undefined) ?? []
      opts.external = [...prev, ...list]
    } else if (a === "--external-auto") opts.externalAuto = true
    else {
      console.error(`Unknown arg: ${a}`)
      process.exit(2)
    }
  }
  return opts
}

async function main() {
  const parsed = parseArgv(process.argv)
  const formats = String(parsed.formats)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as ("esm" | "cjs")[]
  const external = parsed.externalAuto
    ? "auto"
    : (parsed.external as string[] | undefined)
  await build({
    entry: String(parsed.entry),
    outdir: String(parsed.outdir),
    formats,
    sourcemap: ((): "inline" | "external" | "none" => {
      const sm = String(parsed.sourcemap)
      if (sm === "inline") return "inline" // will coerce to external internally
      if (sm === "external") return "external"
      return "none"
    })(),
    types: Boolean(parsed.types),
    target: String(parsed.target),
    execJs: Boolean(parsed.execJs),
    minify: Boolean(parsed.minify),
    external
  })
}

// Execute if run directly
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main()
}
