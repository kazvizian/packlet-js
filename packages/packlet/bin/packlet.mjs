#!/usr/bin/env node
import("../dist/index.mjs")
  .then((m) =>
    typeof m.runCli === "function" ? m.runCli(process.argv) : Promise.resolve()
  )
  .catch((err) => {
    console.error(err?.message ?? String(err))
    process.exit(1)
  })
