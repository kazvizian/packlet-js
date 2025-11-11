/**
 * Integration-style tests for `awakenGpr`.
 *
 * These tests exercise the end-to-end packing flow used to stage a GitHub
 * Packages (GPR) scoped variant of a package. Key assertions:
 * - `.gpr` staging directory and `.artifacts` directory are created.
 * - `artifacts.json` manifest is written and contains the expected fields.
 *
 * The test suite stubs `execSync` to avoid invoking `npm pack` during the
 * test run and performs file-system based assertions against temporary
 * fixture directories.
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { awakenGpr } from "../src/awaken-gpr"

const mkpwd = () => fs.mkdtempSync(path.join(os.tmpdir(), "packlet-gpr-"))

function writeJson(p: string, obj: unknown) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2))
}

function touch(p: string, content = "") {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content)
}

describe("awakenGpr", () => {
  const originalCwd = process.cwd()
  beforeEach(() => {
    // no module reset needed in bun:test context
  })
  afterEach(() => {
    process.chdir(originalCwd)
  })

  /**
   * Integration test: awakenGpr creates staging and artifacts locations and
   * writes a manifest.
   *
   * @expectation The `.gpr` directory and `.artifacts` dir exist and
   * `artifacts.json` contains `schemaVersion` 1 and the expected scopedName.
   * @edgecases We stub `execSync` to avoid running `npm pack` which would
   * otherwise execute external commands during the test.
   */
  it("creates manifest and artifacts dirs", () => {
    const tmp = mkpwd()
    const root = tmp
    const dist = path.join(root, "dist")
    fs.mkdirSync(dist)
    // minimal package.json
    writeJson(path.join(root, "package.json"), {
      name: "pkg-test",
      version: "0.1.0",
      repository: { type: "git", url: "https://github.com/acme/pkg-test.git" }
    })
    // dist files
    touch(path.join(dist, "index.js"))
    touch(path.join(dist, "index.mjs"))
    touch(path.join(dist, "index.d.ts"))

    // mock npm pack to avoid running real command
    // monkey-patch execSync to avoid running real npm pack
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const child =
      require("node:child_process") as typeof import("node:child_process")
    const originalExecSync = child.execSync
    child.execSync = (() =>
      Buffer.from("pkg-test-0.1.0.tgz\n")) as unknown as typeof originalExecSync

    const res = awakenGpr({ rootDir: root, scope: "acme" })
    // The staging directory for the scoped package should exist
    expect(fs.existsSync(res.gprDir)).toBe(true)
    // The artifacts directory should exist and contain tarballs/manifests
    expect(fs.existsSync(res.artifactsDir)).toBe(true)
    const manifestPath = path.join(res.artifactsDir, "artifacts.json")
    // artifacts.json must be present and parseable
    expect(fs.existsSync(manifestPath)).toBe(true)
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    // Manifest schema and scopedName validation
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.scopedName).toBe("@acme/pkg-test")
    // artifacts should be an array even if empty
    expect(Array.isArray(manifest.artifacts)).toBe(true)

    // restore execSync
    child.execSync = originalExecSync
  })
})
