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
  it("builds esm+cjs+d.ts to dist by default", async () => {
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
    expect(fs.existsSync(path.join(tmp, "dist/index.cjs"))).toBe(true)
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

  it("marks dist/index.cjs executable when execCjs is true", async () => {
    const tmp = mkTmp()
    writeFixtureTsconfig(tmp)
    writeSrc(tmp)

    const cwd0 = process.cwd()
    try {
      process.chdir(tmp)
      await build({ execCjs: true })
    } finally {
      process.chdir(cwd0)
    }

    const stat = fs.statSync(path.join(tmp, "dist/index.cjs"))
    // Check any execute bit is set
    expect((stat.mode & 0o111) !== 0).toBe(true)
  }, 20000)
})
