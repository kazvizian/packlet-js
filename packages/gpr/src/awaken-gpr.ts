import * as child from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import {
  copyRecursive,
  deriveScopedName,
  writeArtifactsManifest
} from "@packlet/core"

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

// file copy handled by @packlet/core.copyRecursive

/**
 * Prepare a GitHub Packages (GPR) scoped variant of the current package.
 *
 * Contract:
 * - Reads root package.json to derive metadata.
 * - Stages a scoped package under gprDir with adjusted name and exports.
 * - Copies dist/ into the staged package and optionally README/LICENSE.
 * - Runs `npm pack` for root and staged package to produce tarballs in
 *   `artifactsDir`.
 *
 * The function performs synchronous filesystem operations and will throw an
 * Error on fatal conditions (for example when `dist` does not exist). Some
 * non-fatal failures (such as `npm pack` failing) are swallowed to make the
 * operation robust in CI environments.
 *
 * @param opts - Configuration options for the operation (paths, scope,
 *               registry and include flags).
 * @returns An object describing the prepared GPR artifact locations and
 *          resolved package name/version.
 * @throws When required files (e.g. `dist/`) are missing or other fatal
 *         filesystem errors occur.
 *
 * @example
 * const res = awakenGpr({ rootDir: process.cwd(), scope: 'acme' })
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
  type RepoField =
    | string
    | {
        type?: string
        url?: string
        directory?: string
      }
    | undefined
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8")) as {
    name: string
    version: string
    description?: string
    license?: string
    homepage?: string
    repository?: RepoField
    author?: { name?: string; email?: string; url?: string } | string
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

  // In CI on Windows, spawning `npm pack` is slow and flaky. Allow opt-out via env
  // and auto-disable in Windows CI to keep tests fast and deterministic.
  const IS_WINDOWS = process.platform === "win32" || path.sep === "\\"
  const IN_CI = process.env.CI === "true"
  const SKIP_PACK =
    process.env.GPR_SKIP_PACK === "true" || (IS_WINDOWS && IN_CI)

  // Create scoped package.json for GitHub Packages via shared derivation logic
  const repoUrlRaw: string | undefined = (() => {
    const repo = rootPkg.repository
    if (!repo) return undefined
    if (typeof repo === "string") return repo
    return repo.url ?? repo.directory ?? undefined
  })()

  const { baseName, scopedName } = deriveScopedName({
    name: rootPkg.name,
    repoUrl: repoUrlRaw,
    override: NAME_OVERRIDE,
    scope: SCOPE
  })
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
  // pack root (npmjs package) - allow skipping during tests to speed up
  if (!SKIP_PACK) {
    try {
      const out = child
        .execSync("npm pack", {
          cwd: root,
          stdio: ["ignore", "pipe", "inherit"]
        })
        .toString()
        .trim()
        .split("\n")
        .pop()
      const packFile = out?.length ? out : `${rootPkg.name}-${version}.tgz`
      const src = path.join(root, packFile)
      const dst = path.join(artifactsDir, packFile)
      if (fs.existsSync(src)) fs.renameSync(src, dst)
    } catch {
      // non-fatal
    }
  }

  // pack GPR (scoped package) - allow skipping during tests to speed up
  if (!SKIP_PACK) {
    try {
      const out = child
        .execSync("npm pack", {
          cwd: gprDir,
          stdio: ["ignore", "pipe", "inherit"]
        })
        .toString()
        .trim()
        .split("\n")
        .pop()
      const scopeName = scopedName.replace(/^@/, "").replace("/", "-")
      const fallback = `${scopeName}-${version}.tgz`
      const packFile = out?.length ? out : fallback
      const src = path.join(gprDir, packFile)
      const dst = path.join(artifactsDir, packFile)
      if (fs.existsSync(src)) fs.renameSync(src, dst)
    } catch {
      // non-fatal
    }
  }

  // Write artifacts manifest for downstream orchestration (sailet)
  writeArtifactsManifest(artifactsDir, {
    packageName: baseName,
    scopedName,
    version
  })

  return { gprDir, artifactsDir, scopedName, version }
}
