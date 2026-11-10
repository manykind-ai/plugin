#!/usr/bin/env node
// SessionStart: say (in one line) when the manykind plugin or the project's
// Manykind CLI is behind the latest release. No dependencies. At most one
// check round per day (cached in ~/.manykind/update-check.json), 3s budget,
// silent on any failure. Opt out with MK_NO_UPDATE_NOTIFIER=1.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_MANIFEST_URL =
  "https://raw.githubusercontent.com/manykind-ai/plugin/main/.claude-plugin/plugin.json";
const CLI_PACKAGE = "@manykind-ai/cli";
const DAY_MS = 24 * 60 * 60 * 1000;
const BUDGET_MS = 3000;

const done = () => process.exit(0);
setTimeout(done, BUDGET_MS + 500).unref();

const readJson = (p) => {
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
};

const core = (v) => {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(v ?? "").trim());
  return m ? m.slice(1, 4).map(Number) : null;
};
const behind = (local, latest) => {
  const a = core(local), b = core(latest);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i];
  return false;
};

function pluginVersion() {
  const root = process.env.CLAUDE_PLUGIN_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), "..");
  return readJson(join(root, ".claude-plugin", "plugin.json"))?.version ?? null;
}

// The CLI the project uses: the nearest node_modules copy, walking up from cwd.
function localCli() {
  let dir = process.cwd();
  for (;;) {
    const pkg = readJson(join(dir, "node_modules", ...CLI_PACKAGE.split("/"), "package.json"));
    if (pkg?.version) return { name: CLI_PACKAGE, version: pkg.version };
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

async function fetchJson(url, signal) {
  const res = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

async function main() {
  if (process.env.MK_NO_UPDATE_NOTIFIER) return;
  const plugin = pluginVersion();
  const cli = localCli();
  const cacheDir = join(homedir(), ".manykind");
  const cacheFile = join(cacheDir, "update-check.json");
  let cache = readJson(cacheFile) ?? {};

  if (!(typeof cache.checkedAt === "number" && Date.now() - cache.checkedAt < DAY_MS)) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), BUDGET_MS);
    const cliName = CLI_PACKAGE;
    const [p, c] = await Promise.allSettled([
      fetchJson(PLUGIN_MANIFEST_URL, ctl.signal),
      fetchJson(`https://registry.npmjs.org/${cliName.replace("/", "%2F")}/latest`, ctl.signal),
    ]);
    clearTimeout(t);
    cache = {
      checkedAt: Date.now(),
      plugin: p.status === "fulfilled" ? p.value?.version ?? null : cache.plugin ?? null,
      cli: { ...(cache.cli ?? {}), ...(c.status === "fulfilled" && c.value?.version ? { [cliName]: c.value.version } : {}) },
    };
    try {
      if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
      writeFileSync(cacheFile, JSON.stringify(cache));
    } catch { /* cache is best effort */ }
  }

  const notes = [];
  if (plugin && behind(plugin, cache.plugin)) {
    notes.push(`plugin ${plugin} → ${cache.plugin} (/plugin marketplace update manykind-ai)`);
  }
  const latestCli = cli ? cache.cli?.[cli.name] : null;
  if (cli && behind(cli.version, latestCli)) {
    notes.push(`CLI ${cli.version} → ${latestCli} (pnpm add -D ${cli.name}@latest)`);
  }
  if (notes.length === 0) return;
  const line = `manykind: newer version available: ${notes.join("; ")}`;
  process.stdout.write(JSON.stringify({
    systemMessage: line,
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: line },
  }) + "\n");
}

main().catch(() => {}).finally(done);
