/**
 * Tests for validateDist.
 *
 * Purpose:
 * - Verify that the validator reports missing entry files by default
 *   (`index.js`, `index.mjs`, `index.d.ts`).
 * - Confirm the validator succeeds when those files are present.
 */
import { describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { validateDist } from "../src/index"

describe("validateDist", () => {
  /**
   * Test: validator reports missing default entry files.
   *
   * @expectation When none of the default entry files exist the result is
   * `ok: false` and `missing` contains the expected file names.
   */
  it("reports missing files by default", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "packlet-core-"))
    fs.mkdirSync(tmp, { recursive: true })
    const res = validateDist({ distDir: tmp })
    // Expect validation to fail when no entry files present
    expect(res.ok).toBe(false)
    // At minimum index.js should be reported missing
    expect(res.missing).toContain("index.js")
  })
  it("passes when files are present", () => {
    /**
     * Test: validator succeeds when all expected files exist.
     *
     * @expectation `ok` is true and `missing` is empty when default entry
     * files are present.
     */
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "packlet-core-"))
    fs.mkdirSync(tmp, { recursive: true })
    fs.writeFileSync(path.join(tmp, "index.js"), "")
    fs.writeFileSync(path.join(tmp, "index.mjs"), "")
    fs.writeFileSync(path.join(tmp, "index.d.ts"), "")
    const res = validateDist({ distDir: tmp })
    // All required entry files present -> success
    expect(res.ok).toBe(true)
    expect(res.missing.length).toBe(0)
  })
})
