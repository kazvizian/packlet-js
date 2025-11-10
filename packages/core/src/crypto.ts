import crypto from "node:crypto"
import fs from "node:fs"

/**
 * Compute the SHA-512 hex digest of a file's contents.
 *
 * This helper is synchronous and reads the entire file into memory before
 * computing the hash. It is intended for use on small packaged artifacts
 * (e.g. .tgz files), not for streaming very large files.
 *
 * @param filePath - Path to the file to hash.
 * @returns Hex-encoded SHA-512 digest.
 *
 * @example
 * const digest = computeSha512('./dist/my-pkg-1.0.0.tgz')
 */
export function computeSha512(filePath: string): string {
  const hash = crypto.createHash("sha512")
  const buf = fs.readFileSync(filePath)
  hash.update(buf)
  return hash.digest("hex")
}
