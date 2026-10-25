/**
 * Measures what each `/compare` route sends to the browser: the HTML (and
 * the inline script inside it) plus every script and stylesheet the page
 * loads, following module imports and the handler bundles its event
 * attributes name. The lifecycle fallback only Safari loads is left out.
 *
 *   deno task measure                    print the table
 *   deno task measure --detail           also list each file
 *   deno task measure --save base.json   record the result
 *   deno task measure --baseline base.json   show changes against it
 */
import { compareApp, compareRoutes } from "./compare.tsx";

type Measurement = {
  html: number;
  inline: number;
  js: Record<string, number>;
  css: Record<string, number>;
};

const args = Deno.args;
const option = (name: string) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const encoder = new TextEncoder();
const size = (text: string) => encoder.encode(text).length;

async function fetchText(path: string): Promise<string> {
  const response = await compareApp.fetch(
    new Request(new URL(path, "http://localhost/")),
  );
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return await response.text();
}

/** Module specifiers a script imports, statically or with a literal `import()`. */
function importsOf(code: string, from: string): string[] {
  const specifiers = [
    ...code.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*["']([^"']+\.js)["']/g),
  ].map((match) => match[1]);
  // A runtime path held in a variable so bundlers leave it alone.
  for (const match of code.matchAll(/=\s*"(\/[^"]+\.js)";/g)) {
    specifiers.push(match[1]);
  }
  return specifiers
    .filter((specifier) => !specifier.includes("lifecycle-fallback"))
    .map((specifier) => new URL(specifier, `http://localhost${from}`).pathname);
}

async function measure(route: string): Promise<Measurement> {
  const html = await fetchText(route);
  const inline = [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ]
    .reduce((total, match) => total + size(match[1]), 0);
  const scripts = new Set<string>();
  for (const match of html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)) {
    scripts.add(match[1]);
  }
  for (
    const match of html.matchAll(
      /<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g,
    )
  ) scripts.add(match[1]);
  // Bundles named by event attributes load on first use.
  for (const match of html.matchAll(/tt-handler-[a-z]+="([^"]+)"/g)) {
    for (const reference of match[1].split(" ")) {
      scripts.add(`/handlers/${reference.split(".")[0]}.js`);
    }
  }
  const js: Record<string, number> = {};
  for (const path of scripts) {
    if (path in js) continue;
    const code = await fetchText(path);
    js[path] = size(code);
    for (const imported of importsOf(code, path)) scripts.add(imported);
  }
  const css: Record<string, number> = {};
  for (
    const match of html.matchAll(
      /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g,
    )
  ) {
    css[match[1]] = size(await fetchText(match[1]));
  }
  return { html: size(html), inline, js, css };
}

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((total, value) => total + value, 0);
const totalOf = (m: Measurement) => m.html + sum(m.js) + sum(m.css);

const results: Record<string, Measurement> = {};
for (const route of compareRoutes) results[route] = await measure(route);

const baselinePath = option("--baseline");
const baseline: Record<string, Measurement> | undefined = baselinePath
  ? JSON.parse(await Deno.readTextFile(baselinePath))
  : undefined;
const delta = (now: number, before?: number) =>
  before === undefined || before === now
    ? ""
    : ` (${now > before ? "+" : ""}${now - before})`;

const rows = Object.entries(results).map(([route, m]) => {
  const before = baseline?.[route];
  return [
    route,
    `${m.html}${delta(m.html, before?.html)}`,
    `${m.inline}${delta(m.inline, before?.inline)}`,
    `${Object.keys(m.js).length}`,
    `${sum(m.js)}${delta(sum(m.js), before && sum(before.js))}`,
    `${sum(m.css)}${delta(sum(m.css), before && sum(before.css))}`,
    `${totalOf(m)}${delta(totalOf(m), before && totalOf(before))}`,
  ];
});
const header = ["route", "html", "inline js", "js files", "js", "css", "total"];
const widths = header.map((title, column) =>
  Math.max(title.length, ...rows.map((row) => row[column].length))
);
const line = (cells: string[]) =>
  `| ${cells.map((cell, column) => cell.padEnd(widths[column])).join(" | ")} |`;
console.log(line(header));
console.log(`|${widths.map((width) => "-".repeat(width + 2)).join("|")}|`);
for (const row of rows) console.log(line(row));

if (args.includes("--detail")) {
  for (const [route, m] of Object.entries(results)) {
    console.log(`\n${route}`);
    for (const [path, bytes] of Object.entries({ ...m.js, ...m.css })) {
      console.log(`  ${String(bytes).padStart(6)}  ${path}`);
    }
  }
}

const savePath = option("--save");
if (savePath) {
  await Deno.writeTextFile(savePath, JSON.stringify(results, null, 2));
}
