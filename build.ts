import { logStartupPerformanceSummary } from "tinytools";
import { buildScriptFiles } from "tinytools/build";
import "./main.tsx";

await buildScriptFiles();
logStartupPerformanceSummary();
