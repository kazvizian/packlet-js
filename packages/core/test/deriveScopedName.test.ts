/**
 * Tests for name derivation helpers.
 *
 * This suite covers two related helpers:
 * - `extractRepoName`: parsing repository URLs to obtain the repository name.
 * - `deriveScopedName`: logic to compose a base and scoped package name from
 *   `package.json` name, repository URL, overrides and an optional scope.
 *
 * The tests exercise common URL forms and override/scope precedence rules.
 */
import { describe, expect, it } from "bun:test"
import { deriveScopedName, extractRepoName } from "../src/index"

describe("extractRepoName", () => {
  /**
   * Test: extractRepoName should parse common HTTPS forms.
   *
   * @expectation Returns the repository base name without protocol or .git
   * suffix.
   */
  it("handles https urls", () => {
    // Should strip protocol and return final path segment
    expect(extractRepoName("https://github.com/org/repo")).toBe("repo")
    // Should also strip leading git+ and trailing .git
    expect(extractRepoName("git+https://github.com/org/repo.git")).toBe("repo")
  })
  it("handles ssh urls", () => {
    // SSH style URLs with colon-separated owner/repo should parse correctly
    expect(extractRepoName("git@github.com:org/repo.git")).toBe("repo")
  })
  it("returns undefined for unknown", () => {
    // When no URL provided, function should return undefined
    expect(extractRepoName(undefined)).toBeUndefined()
  })
})

describe("deriveScopedName", () => {
  /**
   * Test: override precedence.
   *
   * @expectation When an `override` is provided it becomes the base name.
   */
  it("uses override when provided", () => {
    const res = deriveScopedName({ name: "foo", override: "bar", scope: "sc" })
    // Base name should reflect the override
    expect(res.baseName).toBe("bar")
    // Scoped name should apply the provided scope to the overridden base
    expect(res.scopedName).toBe("@sc/bar")
  })
  it("derives from repo url when present", () => {
    // When repoUrl is provided prefer its last segment as the base name
    const res = deriveScopedName({
      name: "foo",
      repoUrl: "https://github.com/acme/xyz",
      scope: "sc"
    })
    expect(res.baseName).toBe("xyz")
    expect(res.scopedName).toBe("@sc/xyz")
  })
  it("strips existing scope", () => {
    // If the package name already has a scope, strip it and apply new scope
    const res = deriveScopedName({ name: "@old/name", scope: "new" })
    expect(res.baseName).toBe("name")
    expect(res.scopedName).toBe("@new/name")
  })
})
