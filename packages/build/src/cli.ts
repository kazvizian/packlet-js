#!/usr/bin/env node
import { build } from "./index"

function parseArgv(argv: string[]) {
  const opts: Record<string, unknown> = {
    entry: "src/index.ts",
    outdir: "dist",
    formats: "esm,cjs",
    sourcemap: "inline",
    types: true,
    target: "node",
    execCjs: false,
    minify: true
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === "build") continue
    else if (a === "--entry") opts.entry = argv[++i]
    else if (a === "--outdir") opts.outdir = argv[++i]
    else if (a === "--formats") opts.formats = argv[++i]
    else if (a === "--sourcemap") opts.sourcemap = argv[++i]
    else if (a === "--no-types") opts.types = false
    else if (a === "--target") opts.target = argv[++i]
    else if (a === "--exec-cjs") opts.execCjs = true
    else if (a === "--no-minify") opts.minify = false
    else if (a === "--minify") opts.minify = true
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
  await build({
    entry: String(parsed.entry),
    outdir: String(parsed.outdir),
    formats,
    sourcemap: parsed.sourcemap === "none" ? "none" : "inline",
    types: Boolean(parsed.types),
    target: String(parsed.target),
    execCjs: Boolean(parsed.execCjs),
    minify: Boolean(parsed.minify)
  })
}

// Execute if run directly
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main()
}
