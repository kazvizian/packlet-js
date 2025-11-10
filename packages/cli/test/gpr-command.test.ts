/**
 * Tests for the CLI `gpr` command.
 *
 * This test ensures the `packlet gpr` command can run against a simple
 * fixture, produce packed artifacts (with `npm pack` stubbed) and emit the
 * artifacts manifest JSON when `--json` is specified.
 */
import { describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { runCli } from "../src/index"

//

describe("cli gpr command", () => {
  /**
   * End-to-end CLI test for `gpr` command.
   *
   * @expectation When run with `--json` the CLI prints a single JSON line
   * containing the artifacts manifest. We stub `npm pack` to avoid external
   * side-effects and capture `process.stdout.write` to parse the JSON.
   */
  it("runs gpr and outputs JSON when --json specified", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "packlet-cli-"))
    // create fake dist and package.json
    const dist = path.join(tmp, "dist")
    fs.mkdirSync(dist)
    fs.writeFileSync(path.join(dist, "index.js"), "")
    fs.writeFileSync(path.join(dist, "index.mjs"), "")
    fs.writeFileSync(path.join(dist, "index.d.ts"), "")
    fs.writeFileSync(
      path.join(tmp, "package.json"),
      JSON.stringify({ name: "cli-test", version: "0.1.0" }, null, 2)
    )

    // stub npm pack via monkey-patch
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const child =
      require("node:child_process") as typeof import("node:child_process")
    const originalExecSync = child.execSync
    child.execSync = (() =>
      Buffer.from("cli-test-0.1.0.tgz\n")) as unknown as typeof originalExecSync

    const output: string[] = []
    const origWrite = process.stdout.write
    // monkey-patch stdout.write
    type WriteFn = (chunk: string | Uint8Array) => boolean
    ;(process.stdout.write as unknown as WriteFn) = (chunk) => {
      output.push(String(chunk))
      return true
    }

    await runCli(["node", "packlet", "gpr", "--root", tmp, "--json"])

    // Find the first JSON line emitted to stdout and assert manifest fields
    const jsonLine = output.find((l) => l.trim().startsWith("{"))
    expect(jsonLine).toBeTruthy()
    const manifest = JSON.parse(String(jsonLine))
    // Basic manifest sanity checks
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.version).toBe("0.1.0")
    // restore stdout
    process.stdout.write = origWrite
    // restore execSync
    child.execSync = originalExecSync
  })
})
