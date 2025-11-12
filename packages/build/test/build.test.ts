import { describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { build } from "../src/index"

function mkTmp(prefix = "packlet-build-test-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

function writeFixtureTsconfig(dir: string) {
  const cfg = {
    compilerOptions: {
      declaration: true,
      emitDeclarationOnly: false,
      module: "ESNext",
      moduleResolution: "Bundler",
      target: "ES2019",
      strict: true
    }
  }
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify(cfg, null, 2)
  )
}

function writeSrc(dir: string, code = "export const x=1\n") {
  const srcDir = path.join(dir, "src")
  fs.mkdirSync(srcDir, { recursive: true })
  fs.writeFileSync(path.join(srcDir, "index.ts"), code)
}

describe("@packlet/build programmatic API", () => {
  it("builds esm+d.ts to dist by default (CJS opt-in)", async () => {
    const tmp = mkTmp()
    writeFixtureTsconfig(tmp)
    writeSrc(tmp, "export const hello=(n:string)=>'hi '+n\n")

    const cwd0 = process.cwd()
    try {
      process.chdir(tmp)
      await build()
    } finally {
      process.chdir(cwd0)
    }

    expect(fs.existsSync(path.join(tmp, "dist/index.mjs"))).toBe(true)
    expect(fs.existsSync(path.join(tmp, "dist/index.cjs"))).toBe(false)
    expect(fs.existsSync(path.join(tmp, "dist/index.d.ts"))).toBe(true)
  }, 20000)

  it("respects types:false and formats: esm only", async () => {
    const tmp = mkTmp()
    writeFixtureTsconfig(tmp)
    writeSrc(tmp)

    const cwd0 = process.cwd()
    try {
      process.chdir(tmp)
      await build({ types: false, formats: ["esm"] })
    } finally {
      process.chdir(cwd0)
    }

    expect(fs.existsSync(path.join(tmp, "dist/index.mjs"))).toBe(true)
    expect(fs.existsSync(path.join(tmp, "dist/index.cjs"))).toBe(false)
    expect(fs.existsSync(path.join(tmp, "dist/index.d.ts"))).toBe(false)
  }, 20000)

  it("marks built entry executable (prefers mjs, falls back to cjs)", async () => {
    const tmp = mkTmp()
    writeFixtureTsconfig(tmp)
    writeSrc(tmp)

    const cwd0 = process.cwd()
    try {
      process.chdir(tmp)
      await build({ execJs: true, formats: ["esm", "cjs"] })
    } finally {
      process.chdir(cwd0)
    }

    // Prefer mjs; ensure at least one entry got execute bits
    const mjsPath = path.join(tmp, "dist/index.mjs")
    const cjsPath = path.join(tmp, "dist/index.cjs")
    const target = fs.existsSync(mjsPath) ? mjsPath : cjsPath
    const stat = fs.statSync(target)
    if (process.platform === "win32") {
      // Windows doesn't have POSIX execute bits; chmod is a no-op. Just assert file exists.
      expect(stat.isFile()).toBe(true)
    } else {
      expect((stat.mode & 0o111) !== 0).toBe(true)
    }
  }, 20000)
})
