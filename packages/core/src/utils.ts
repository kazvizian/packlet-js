import fs from "node:fs"
import path from "node:path"
import type { DeriveNameInput } from "./types"

/**
 * Derive a consistent base and scoped package name from several possible
 * inputs.
 *
 * The function prefers an explicit `override` when provided. If the override
 * includes a scope (e.g. `@scope/name`) it is returned verbatim as the
 * `scopedName`. Otherwise the function will apply the provided `scope` or
 * fall back to extracting a name from `repoUrl` or `name`.
 *
 * @param input - Input containing `name`, optional `repoUrl`, an optional
 *                `override`, and an optional `scope`.
 * @returns An object containing `baseName` (unscoped package name) and
 *          `scopedName` (the final package name, possibly with `@scope/`).
 *
 * @example
 * deriveScopedName({ name: 'pkg', scope: 'acme' })
 * // => { baseName: 'pkg', scopedName: '@acme/pkg' }
 */
export function deriveScopedName(input: DeriveNameInput): {
  baseName: string
  scopedName: string
} {
  if (input.override?.trim()) {
    const ov = input.override.trim()
    // If override already includes a scope (starts with @), honor it verbatim.
    if (ov.startsWith("@") && ov.includes("/")) {
      return {
        baseName: stripScope(ov),
        scopedName: ov
      }
    }
    return {
      baseName: stripScope(ov),
      scopedName: scoped(stripScope(ov), input.scope)
    }
  }
  const repoBase = extractRepoName(input.repoUrl)
  const base = repoBase || stripScope(input.name)
  return { baseName: base, scopedName: scoped(base, input.scope) }
}

/** Remove a leading scope from a package name, e.g. `@s/name` -> `name`. */
function stripScope(n: string): string {
  return n.includes("/") ? n.split("/").pop() || n : n
}

/** Combine a base name and an optional scope into a scoped package name. */
function scoped(base: string, scope?: string): string {
  return scope ? `@${scope}/${base}` : base
}

/**
 * Extract the repository (package) name from a git repository URL.
 *
 * Accepts common git URL forms, for example `git+https://github.com/owner/repo.git`
 * and returns `repo`.
 *
 * @param url - Repository URL.
 * @returns The repository name when it can be parsed, otherwise `undefined`.
 */
export function extractRepoName(url?: string): string | undefined {
  if (!url) return undefined
  const cleaned = url.replace(/^git\+/, "").replace(/\.git$/, "")
  const m = cleaned.match(/[/:]([^/:]+)\/([^/]+)$/)
  if (m?.[2]) return m[2].replace(/\.git$/, "")
  return undefined
}

/**
 * Recursively copy files and directories from `src` to `dest`.
 *
 * This is a small synchronous implementation that mirrors directory
 * structure and copies files. It uses `fs.readdirSync` with `withFileTypes`
 * and will create directories as needed.
 *
 * @param src - Source directory path.
 * @param dest - Destination directory path. Will be created as necessary.
 */
export function copyRecursive(src: string, dest: string): void {
  const entries = fs.readdirSync(src, {
    withFileTypes: true
  }) as unknown as Array<{
    name: string
    isDirectory(): boolean
    isFile(): boolean
  }>
  for (const entry of entries) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true })
      copyRecursive(s, d)
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d)
    }
  }
}
