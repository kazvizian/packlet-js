import { describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { runCli } from "../src/index"

function mkTmp(prefix: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

describe("cli build command", () => {
  it("builds a simple package into dist", async () => {
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
      await runCli(["node", "packlet", "build"]) // default options
    } finally {
      process.chdir(origCwd)
    }
    // verify outputs exist
    expect(fs.existsSync(path.join(tmp, "dist/index.mjs"))).toBe(true)
    expect(fs.existsSync(path.join(tmp, "dist/index.cjs"))).toBe(true)
    expect(fs.existsSync(path.join(tmp, "dist/index.d.ts"))).toBe(true)
  }, 20000)
})
