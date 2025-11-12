// Shared name validation utilities for GPR overrides
export const SCOPED_GPR_NAME = /^@[^/]+\/[A-Za-z0-9._-]+$/
export const UNSCOPED_GPR_NAME = /^[A-Za-z0-9._-]+$/

export function isValidGprName(v: unknown): v is string {
  return (
    typeof v === "string" &&
    (SCOPED_GPR_NAME.test(v) || UNSCOPED_GPR_NAME.test(v))
  )
}

export function ensureGprName(v: unknown): string | undefined {
  return isValidGprName(v) ? v : undefined
}
