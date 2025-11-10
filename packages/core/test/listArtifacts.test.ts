/**
 * Tests for listArtifacts utility.
 *
 * Purpose:
 * - Ensure only `.tgz` files are discovered in an artifacts directory.
 * - Verify returned entries include file names (we assume other metadata like
 *   size and sha512 are produced by the implementation but the test focuses
 *   on correct filtering behaviour).
 */
import { describe, expect, it } from "bun:test"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { listArtifacts } from "../src/index"

describe("listArtifacts", () => {
  /**
   * Test case: only `.tgz` files are discovered as artifacts.
   *
   * @expectation The returned list contains only names of files ending with
   * `.tgz` and ignores other extensions. We map to filenames and sort the
   * result to make the assertion order-insensitive.
   * @edgecases Files with other extensions should be ignored.
   */
  it("lists .tgz files only", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "packlet-core-arts-"))
    fs.writeFileSync(path.join(dir, "a.tgz"), "x")
    fs.writeFileSync(path.join(dir, "b.tgz"), "x")
    fs.writeFileSync(path.join(dir, "c.txt"), "x")
    const list = listArtifacts(dir)
    // Map to filenames and sort to assert deterministically regardless of
    // filesystem ordering.
    expect(list.map((a) => a.file).sort()).toEqual(["a.tgz", "b.tgz"])
    // Rationale: Non-.tgz files (c.txt) must not be present in the results.
  })
})
