import { describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { runCli } from "../src/index"

function mkTmp(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

describe("cli build command", () => {
  it("builds ESM + types by default (no CJS)", async () => {
    const tmp = mkTmp("packlet-build-")
    const src = path.join(tmp, "src")
    fs.mkdirSync(src, { recursive: true })
    fs.writeFileSync(
      path.join(src, "index.ts"),
      "export const hello = (n: string)=> 'hi ' + n\n"
    )
    fs.writeFileSync(
      path.join(tmp, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            declaration: true,
            emitDeclarationOnly: false,
            module: "ESNext",
            moduleResolution: "Bundler",
            target: "ES2019",
            strict: true
          }
        },
        null,
        2
      )
    )
    const origCwd = process.cwd()
    try {
      process.chdir(tmp)
      await runCli(["node", "packlet", "build"]) // default: esm only
    } finally {
      process.chdir(origCwd)
    }
    // verify outputs exist
    expect(fs.existsSync(path.join(tmp, "dist/index.mjs"))).toBe(true)
    expect(fs.existsSync(path.join(tmp, "dist/index.cjs"))).toBe(false)
    expect(fs.existsSync(path.join(tmp, "dist/index.d.ts"))).toBe(true)
  }, 20000)

  it("emits CJS when --cjs provided", async () => {
    const tmp = mkTmp("packlet-build-cjs-")
    const src = path.join(tmp, "src")
    fs.mkdirSync(src, { recursive: true })
    fs.writeFileSync(
      path.join(src, "index.ts"),
      "export const hello = (n: string)=> 'hi ' + n\n"
    )
    writeTsconfig(tmp)
    const origCwd = process.cwd()
    try {
      process.chdir(tmp)
      await runCli(["node", "packlet", "build", "--cjs"]) // request cjs
    } finally {
      process.chdir(origCwd)
    }
    expect(fs.existsSync(path.join(tmp, "dist/index.mjs"))).toBe(true)
    expect(fs.existsSync(path.join(tmp, "dist/index.cjs"))).toBe(true)
  }, 20000)
})

function writeTsconfig(dir: string) {
  fs.writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          declaration: true,
          emitDeclarationOnly: false,
          module: "ESNext",
          moduleResolution: "Bundler",
          target: "ES2019",
          strict: true
        }
      },
      null,
      2
    )
  )
}
