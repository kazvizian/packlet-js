import { describe, expect, it } from "bun:test"
import { awakenGpr, build, runCli, validateDist } from "../src/index"

describe("packlet umbrella exports", () => {
  it("exposes core helpers and gpr", () => {
    expect(typeof validateDist).toBe("function")
    expect(typeof awakenGpr).toBe("function")
    expect(typeof build).toBe("function")
  })

  it("exposes CLI runner", () => {
    expect(typeof runCli).toBe("function")
  })
})
