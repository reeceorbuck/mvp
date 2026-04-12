import { logStartupPerformanceSummary } from "@tinytools/hono-tools";
import { buildScriptFiles } from "@tinytools/hono-tools/build";
import "./main.tsx";

await buildScriptFiles();
logStartupPerformanceSummary();
