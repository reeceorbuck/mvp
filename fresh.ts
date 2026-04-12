// Wipe existing cache and built handler/style files, then rebuild from scratch.

import { logStartupPerformanceSummary } from "@tinytools/hono-tools";
import { buildScriptFiles } from "@tinytools/hono-tools/build";
import "./main.tsx";

const dirs = ["./.cache", "./public/handlers", "./public/styles"];

for (const dir of dirs) {
  try {
    await Deno.remove(dir, { recursive: true });
    console.log(`Removed ${dir}`);
  } catch {
    // Directory doesn't exist, nothing to clean
  }
}

await buildScriptFiles({ fresh: true });
logStartupPerformanceSummary();
