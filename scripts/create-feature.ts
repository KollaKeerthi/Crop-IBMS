#!/usr/bin/env bun
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const flags: Record<string, string | true> = {};
const positionals: string[] = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a && a.startsWith("--")) {
    const key = a.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = true;
    }
  } else if (a) {
    positionals.push(a);
  }
}

const name = positionals[0];
if (!name || flags.help === true) {
  printUsage();
  process.exit(name ? 0 : 1);
}

if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(name)) {
  fail(`Invalid feature name "${name}". Use kebab-case.`);
}
if (name === "_template") fail(`The name "_template" is reserved.`);

const RESERVED = new Set(["app", "lib", "test", "components", "auth", "db", "types"]);
if (RESERVED.has(name)) fail(`The name "${name}" is reserved.`);

const templateDir = path.join(ROOT, "src/features/_template");
const targetDir = path.join(ROOT, `src/features/${name}`);

if (!fs.existsSync(templateDir)) fail(`Template not found at ${templateDir}.`);
if (fs.existsSync(targetDir)) fail(`Feature already exists at ${targetDir}.`);

const pascalPlural = name
  .split("-")
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join("");

const pascalSingularDefault = pascalPlural.replace(/s$/, "") || pascalPlural;
const pascalSingular = typeof flags.singular === "string" ? flags.singular : pascalSingularDefault;
const kebabSingular = pascalSingular.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

const replacements: [RegExp, string][] = [
  [/_template/g, name],
  [/Things/g, pascalPlural],
  [/Thing/g, pascalSingular],
  [/things/g, name],
  [/thing/g, kebabSingular],
];

function applyReplacements(input: string): string {
  let out = input;
  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

let filesWritten = 0;

function copyTree(srcDir: string, dstDir: string): void {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const newName = applyReplacements(entry.name);
    const dstPath = path.join(dstDir, newName);
    if (entry.isDirectory()) copyTree(srcPath, dstPath);
    else {
      const content = fs.readFileSync(srcPath, "utf8");
      fs.writeFileSync(dstPath, applyReplacements(content));
      filesWritten++;
    }
  }
}

copyTree(templateDir, targetDir);

const relTarget = path.relative(ROOT, targetDir);
console.log(`Created ${relTarget}/  (${filesWritten} files)`);
console.log("");
console.log("Next steps:");
console.log(
  `  1. Define the DB table in src/db/schema/${name}.ts and re-export from src/db/schema/index.ts`
);
console.log(`  2. Add AuditAction values to src/lib/audit.ts (e.g. "${kebabSingular}.created")`);
console.log(`  3. Create routes at src/app/api/v1/${name}/route.ts and [id]/route.ts`);
console.log(`  4. Build out components under src/features/${name}/components/`);
console.log(`  5. bun run db:generate && bun run db:migrate`);
console.log(`  6. bunx tsc --noEmit && bunx vitest run`);

function fail(message: string): never {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

function printUsage(): void {
  console.log("Usage: bun run create-feature <kebab-name> [--singular <PascalNoun>]");
}
