import { describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { runCli } from "packlet"

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

describe("packlet CLI integration", () => {
  it("list-artifacts JSON on empty dir returns []", async () => {
    const artifactsDir = makeTempDir("packlet-artifacts-")
    let out = ""
    const origWrite = process.stdout.write
    // Capture stdout
    const writer = (
      chunk: string | Uint8Array,
      _encOrCb?: unknown,
      _cb?: unknown
    ): boolean => {
      out += chunk.toString()
      return true
    }
    process.stdout.write = writer as unknown as typeof process.stdout.write
    try {
      await runCli([
        "node",
        "packlet",
        "list-artifacts",
        "--artifacts",
        artifactsDir,
        "--json"
      ])
    } finally {
      process.stdout.write = origWrite
    }
    const parsed = JSON.parse(out.trim())
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBe(0)
  })

  it("validate JSON reports missing when dist absent", async () => {
    const rootDir = makeTempDir("packlet-root-")
    let out = ""
    const origWrite = process.stdout.write
    const writer = (
      chunk: string | Uint8Array,
      _encOrCb?: unknown,
      _cb?: unknown
    ): boolean => {
      out += chunk.toString()
      return true
    }
    process.stdout.write = writer as unknown as typeof process.stdout.write
    try {
      await runCli(["node", "packlet", "validate", "--root", rootDir, "--json"])
    } finally {
      process.stdout.write = origWrite
    }
    const parsed = JSON.parse(out.trim())
    expect(parsed.ok).toBe(false)
    expect(parsed.missing).toContain("index.js")
  })
})
