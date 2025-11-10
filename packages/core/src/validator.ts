import fs from "node:fs"
import path from "node:path"
import type { ValidateDistOptions, ValidateDistResult } from "./types"

/**
 * Validate that a distribution directory contains expected entry files.
 *
 * By default this checks for `index.js`, `index.mjs` and `index.d.ts` but
 * callers can supply a custom `expected` array via `opts`.
 *
 * @param opts - Validation options including `distDir` and optional
 *               `expected` file list.
 * @returns An object describing whether the check passed and which files
 *          are missing.
 *
 * @example
 * validateDist({ distDir: './dist' })
 */
export function validateDist(opts: ValidateDistOptions): ValidateDistResult {
  const expected = opts.expected ?? ["index.js", "index.mjs", "index.d.ts"]
  const missing = expected.filter(
    (f) => !fs.existsSync(path.join(opts.distDir, f))
  )
  return { ok: missing.length === 0, missing }
}
