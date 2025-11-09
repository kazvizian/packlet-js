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
    expect(fs.existsSync(res.gprDir)).toBe(true)
    expect(fs.existsSync(res.artifactsDir)).toBe(true)
    const manifestPath = path.join(res.artifactsDir, "artifacts.json")
    expect(fs.existsSync(manifestPath)).toBe(true)
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.scopedName).toBe("@acme/pkg-test")
    expect(Array.isArray(manifest.artifacts)).toBe(true)

    // restore execSync
    child.execSync = originalExecSync
  })
})
