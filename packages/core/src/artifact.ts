import fs from "node:fs"
import path from "node:path"
import { computeSha512 } from "./crypto"
import type { ArtifactEntry, ArtifactsManifestV1 } from "./types"

/**
 * Utilities for working with artifact packages stored on disk.
 *
 * The functions in this module are small, synchronous helpers used by the
 * packlet toolchain to enumerate built package artifacts and to write a
 * machine-readable manifest file (`artifacts.json`) that contains file names,
 * sizes and SHA-512 checksums.
 */

/**
 * List artifact files found in a directory.
 *
 * This will synchronously read the directory and return an array of
 * ArtifactEntry objects for files ending with `.tgz`.
 *
 * Notes:
 * - If the directory does not exist an empty array is returned.
 * - SHA-512 digests are computed synchronously by reading each file.
 *
 * @param artifactsDir - Absolute or relative path to the artifacts directory.
 * @returns An array of artifact entries with `file`, `size` (bytes) and
 *          `sha512` (hex) properties.
 *
 * @example
 * const artifacts = listArtifacts('./dist')
 */
export function listArtifacts(artifactsDir: string): ArtifactEntry[] {
  if (!fs.existsSync(artifactsDir)) return []
  return fs
    .readdirSync(artifactsDir)
    .filter((f) => f.endsWith(".tgz"))
    .map((file) => {
      const full = path.join(artifactsDir, file)
      const stat = fs.statSync(full)
      return { file, size: stat.size, sha512: computeSha512(full) }
    })
}

/**
 * Write an artifacts manifest JSON file for a package.
 *
 * The generated manifest follows the `ArtifactsManifestV1` shape. If the
 * caller supplies an `artifacts` array it will be used verbatim; otherwise
 * the function will enumerate `.tgz` files in `artifactsDir` using
 * {@link listArtifacts}.
 *
 * This function writes `artifacts.json` into `artifactsDir` and returns the
 * manifest object that was written.
 *
 * @param artifactsDir - Directory that contains the artifact files (and
 *                       where the `artifacts.json` file will be written).
 * @param data - Manifest metadata. Must include `packageName`, `scopedName`
 *               and `version`. Optionally includes `artifacts` to override
 *               automatic discovery.
 * @returns The written `ArtifactsManifestV1` object.
 *
 * @example
 * writeArtifactsManifest('./dist', {
 *   packageName: 'my-pkg',
 *   scopedName: '@scope/my-pkg',
 *   version: '1.2.3'
 * })
 */
export function writeArtifactsManifest(
  artifactsDir: string,
  data: Omit<ArtifactsManifestV1, "schemaVersion" | "artifacts"> & {
    artifacts?: ArtifactEntry[]
  }
): ArtifactsManifestV1 {
  const artifacts = data.artifacts ?? listArtifacts(artifactsDir)
  const manifest: ArtifactsManifestV1 = {
    schemaVersion: 1,
    packageName: data.packageName,
    scopedName: data.scopedName,
    version: data.version,
    artifacts
  }
  fs.writeFileSync(
    path.join(artifactsDir, "artifacts.json"),
    JSON.stringify(manifest, null, 2)
  )
  return manifest
}
