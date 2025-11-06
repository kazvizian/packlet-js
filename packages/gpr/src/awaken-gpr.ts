import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

/**
 * Options for awakenGpr. All paths are resolved relative to process.cwd() by default.
 */
export interface AwakenGprOptions {
  /** Root directory of the package to prepare. Defaults to process.cwd(). */
  rootDir?: string
  /** Directory where a scoped GPR package will be staged. Defaults to .gpr under root. */
  gprDir?: string
  /** Directory where tarballs will be placed. Defaults to .artifacts under root. */
  artifactsDir?: string
  /** Directory containing build outputs to publish. Defaults to dist under root. */
  distDir?: string
  /** GitHub Packages scope, e.g. "kazvizian". Can be overridden by env GPR_SCOPE. */
  scope?: string
  /** GPR registry URL. Can be overridden by env GPR_REGISTRY. */
  registry?: string
  /** Include README.md if present. Can be toggled by env GPR_INCLUDE_README. */
  includeReadme?: boolean
  /** Include LICENSE if present. Can be toggled by env GPR_INCLUDE_LICENSE. */
  includeLicense?: boolean
  /** Name override for the scoped package. Can be provided via env GPR_NAME. */
  nameOverride?: string
}

/** Result of awakenGpr operation. */
export interface AwakenGprResult {
  /** Path to the staged GPR directory (contains package.json and dist). */
  gprDir: string
  /** Path to the artifacts directory where tarballs were placed. */
  artifactsDir: string
  /** The resolved scoped package name (e.g., @scope/name). */
  scopedName: string
  /** Version string from the root package.json. */
  version: string
}

interface FileSystemEntry {
  name: string
  isDirectory(): boolean
  isFile(): boolean
}

interface CopyRecursiveFn {
  (src: string, dest: string): void
}

const copyRecursive: CopyRecursiveFn = (src: string, dest: string): void => {
  const entries: FileSystemEntry[] = fs.readdirSync(src, {
    withFileTypes: true
  }) as unknown as FileSystemEntry[]
  for (const entry of entries) {
    const s: string = path.join(src, entry.name)
    const d: string = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true })
      copyRecursive(s, d)
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d)
    }
  }
}

/**
 * Prepare a GitHub Packages (GPR) scoped variant of the current package.
 *
 * Contract:
 * - Reads root package.json to derive metadata.
 * - Stages a scoped package under gprDir with adjusted name and exports.
 * - Copies dist/ into the staged package and optionally README/LICENSE.
 * - Runs `npm pack` for root and staged package to produce tarballs in artifactsDir.
 *
 * Throws if `dist/` does not exist.
 */
export function awakenGpr(opts: AwakenGprOptions = {}): AwakenGprResult {
  const root = path.resolve(opts.rootDir ?? process.cwd())
  const gprDir = path.resolve(opts.gprDir ?? path.join(root, ".gpr"))
  const artifactsDir = path.resolve(
    opts.artifactsDir ?? path.join(root, ".artifacts")
  )
  const distDir = path.resolve(opts.distDir ?? path.join(root, "dist"))

  // Ensure dist exists
  if (!fs.existsSync(distDir)) {
    throw new Error("dist/ not found. Run build before preparing GPR package.")
  }

  // Clean and recreate .gpr and .artifacts
  fs.rmSync(gprDir, { recursive: true, force: true })
  fs.mkdirSync(gprDir, { recursive: true })
  fs.rmSync(artifactsDir, { recursive: true, force: true })
  fs.mkdirSync(artifactsDir, { recursive: true })

  // Read root package.json
  const rootPkgPath = path.join(root, "package.json")
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8")) as {
    name: string
    version: string
    description?: string
    license?: string
    homepage?: string
    repository?: unknown
    author?: unknown
    keywords?: string[]
    sideEffects?: boolean
  }

  // Env-based configuration for reusability
  const SCOPE = process.env.GPR_SCOPE || opts.scope || "kazvizian"
  const REGISTRY =
    process.env.GPR_REGISTRY || opts.registry || "https://npm.pkg.github.com/"
  const INCLUDE_README =
    (process.env.GPR_INCLUDE_README ?? String(opts.includeReadme ?? true)) ===
    "true"
  const INCLUDE_LICENSE =
    (process.env.GPR_INCLUDE_LICENSE ?? String(opts.includeLicense ?? true)) ===
    "true"
  const NAME_OVERRIDE = process.env.GPR_NAME || opts.nameOverride

  // Create scoped package.json for GitHub Packages
  // Determine base name for the scoped package. Priority:
  // 1. NAME_OVERRIDE (env or opts)
  // 2. repository URL's repo name (if present) — this ensures GPR package name matches GitHub URL when npm name differs
  // 3. package.json name (strip existing scope if present)
  const repoUrlRaw: string | undefined = (() => {
    const repo = (rootPkg as any).repository
    if (!repo) return undefined
    if (typeof repo === "string") return repo
    if (typeof repo === "object" && repo !== null)
      return repo.url || repo.directory || undefined
    return undefined
  })()

  const parseRepoName = (u?: string): string | undefined => {
    if (!u) return undefined
    // normalize common prefixes
    const s = u.replace(/^git\+/, "").replace(/\.git$/, "")
    // match both ssh and https forms: git@github.com:owner/repo or https://github.com/owner/repo
    const m = s.match(/[/:]([^/:]+)\/([^/]+)$/)
    if (m && m[2]) return m[2].replace(/\.git$/, "")
    return undefined
  }

  const repoName = parseRepoName(repoUrlRaw)
  let baseName =
    NAME_OVERRIDE && NAME_OVERRIDE.trim().length
      ? NAME_OVERRIDE.trim()
      : repoName ?? rootPkg.name
  // If the chosen baseName is scoped like @scope/name, strip the original scope
  if (baseName.includes("/")) {
    baseName = baseName.split("/").pop() as string
  }
  const scopedName = `@${SCOPE}/${baseName}`
  const gprPkg = {
    name: scopedName,
    version: rootPkg.version,
    description: rootPkg.description,
    license: rootPkg.license,
    homepage: rootPkg.homepage,
    repository: rootPkg.repository,
    author: rootPkg.author,
    keywords: rootPkg.keywords,
    sideEffects: rootPkg.sideEffects,
    files: ["dist"],
    main: "./dist/index.js",
    module: "./dist/index.mjs",
    types: "./dist/index.d.ts",
    exports: {
      ".": {
        types: "./dist/index.d.ts",
        require: "./dist/index.js",
        import: "./dist/index.mjs",
        default: "./dist/index.mjs"
      }
    },
    publishConfig: {
      registry: REGISTRY,
      access: "public"
    }
  }

  fs.writeFileSync(
    path.join(gprDir, "package.json"),
    JSON.stringify(gprPkg, null, 2)
  )

  // Copy dist into .gpr/dist
  const targetDist = path.join(gprDir, "dist")
  fs.mkdirSync(targetDist, { recursive: true })
  copyRecursive(distDir, targetDist)

  // Optionally include README and LICENSE
  if (INCLUDE_README) {
    const p = path.join(root, "README.md")
    if (fs.existsSync(p)) fs.copyFileSync(p, path.join(gprDir, "README.md"))
  }
  if (INCLUDE_LICENSE) {
    const p = path.join(root, "LICENSE")
    if (fs.existsSync(p)) fs.copyFileSync(p, path.join(gprDir, "LICENSE"))
  }

  // Create npm pack tarballs for GitHub Release assets
  const version = rootPkg.version
  // pack root (npmjs package)
  try {
    const out = execSync("npm pack", {
      cwd: root,
      stdio: ["ignore", "pipe", "inherit"]
    })
      .toString()
      .trim()
      .split("\n")
      .pop()
    const packFile = out && out.length ? out : `${rootPkg.name}-${version}.tgz`
    const src = path.join(root, packFile)
    const dst = path.join(artifactsDir, packFile)
    if (fs.existsSync(src)) fs.renameSync(src, dst)
  } catch {
    // non-fatal
  }

  // pack GPR (scoped package)
  try {
    const out = execSync("npm pack", {
      cwd: gprDir,
      stdio: ["ignore", "pipe", "inherit"]
    })
      .toString()
      .trim()
      .split("\n")
      .pop()
    const scopeName = scopedName.replace(/^@/, "").replace("/", "-")
    const fallback = `${scopeName}-${version}.tgz`
    const packFile = out && out.length ? out : fallback
    const src = path.join(gprDir, packFile)
    const dst = path.join(artifactsDir, packFile)
    if (fs.existsSync(src)) fs.renameSync(src, dst)
  } catch {
    // non-fatal
  }

  return { gprDir, artifactsDir, scopedName, version }
}
