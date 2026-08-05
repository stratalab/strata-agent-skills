#!/usr/bin/env node
// The bin: `npx strata init [--yes|--json|--remove|--check|…]` and
// `npx strata mcp [...]` (requirements F1–F4). Argument parsing is manual —
// the package has zero runtime dependencies (AR-7) and four flags do not need
// a framework.

import { spawn } from "node:child_process";
import * as path from "node:path";
import * as readline from "node:readline/promises";

import { resolveCli, installPlan, runInstall, CliResolveError } from "./cli-resolve.js";
import { CLI_BIN, DEFAULT_DB_DIRNAME, HANDOFF_LINE, INSTALL_HINT } from "./constants.js";
import { check, register, remove, type SurfaceResult } from "./registration.js";
import { installSkills, removeSkills } from "./skills.js";
import { SURFACES, surfaceById, type Surface } from "./surfaces.js";
import { findDatabases } from "./workspace.js";

interface InitFlags {
  yes: boolean;
  json: boolean;
  remove: boolean;
  check: boolean;
  all: boolean;
  skills: boolean;
  db?: string;
  binary?: string;
  surfaces?: string[];
}

function usage(): never {
  process.stderr.write(
    `usage:\n` +
      `  npx ${CLI_BIN} init [--yes] [--json] [--db <path>] [--binary <path>]\n` +
      `                   [--all] [--surface <id,id>] [--no-skills]\n` +
      `  npx ${CLI_BIN} init --remove | --check\n` +
      `  npx ${CLI_BIN} mcp [args…]        exec the installed CLI's MCP server\n` +
      `surfaces: ${SURFACES.map((s) => s.id).join(", ")}\n`,
  );
  process.exit(2);
}

function parseInitFlags(args: string[]): InitFlags {
  const flags: InitFlags = {
    yes: false,
    json: false,
    remove: false,
    check: false,
    all: false,
    skills: true,
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    switch (arg) {
      case "--yes":
        flags.yes = true;
        break;
      case "--json":
        flags.json = true;
        break;
      case "--remove":
        flags.remove = true;
        break;
      case "--check":
        flags.check = true;
        break;
      case "--all":
        flags.all = true;
        break;
      case "--no-skills":
        flags.skills = false;
        break;
      case "--db":
        flags.db = args[++i] ?? usage();
        break;
      case "--binary":
        flags.binary = args[++i] ?? usage();
        break;
      case "--surface":
        flags.surfaces = (args[++i] ?? usage()).split(",").map((s) => s.trim());
        break;
      default:
        usage();
    }
  }
  if (flags.remove && flags.check) usage();
  return flags;
}

function selectSurfaces(flags: InitFlags, root: string): Surface[] {
  if (flags.surfaces !== undefined) {
    return flags.surfaces.map((id) => {
      const surface = surfaceById(id);
      if (surface === undefined) usage();
      return surface;
    });
  }
  if (flags.all) return [...SURFACES];
  // Presence-based detection; user-global surfaces are explicit-only (Q2).
  return SURFACES.filter((surface) => surface.workspaceScoped && surface.detect(root));
}

async function confirm(question: string, yes: boolean): Promise<boolean> {
  if (yes) return true;
  if (!process.stdin.isTTY) return false;
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  const answer = (await rl.question(`${question} [y/N] `)).trim().toLowerCase();
  rl.close();
  return answer === "y" || answer === "yes";
}

async function resolveDatabase(flags: InitFlags, root: string): Promise<string> {
  if (flags.db !== undefined) return path.resolve(flags.db);
  const found = findDatabases(root);
  if (found.length === 1) return found[0]!;
  if (found.length === 0) {
    // No database yet: register the conventional home; the agent's first act
    // can be creating it (requirements Q3).
    return path.join(root, DEFAULT_DB_DIRNAME);
  }
  if (flags.yes || !process.stdin.isTTY) {
    process.stderr.write(
      `multiple databases found; pass --db to choose:\n${found.map((f) => `  ${f}`).join("\n")}\n`,
    );
    process.exit(2);
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  found.forEach((db, i) => process.stderr.write(`  [${i + 1}] ${db}\n`));
  const answer = await rl.question("which database? ");
  rl.close();
  const idx = Number.parseInt(answer, 10) - 1;
  const chosen = found[idx];
  if (chosen === undefined) usage();
  return chosen;
}

function reportHuman(results: SurfaceResult[], extra: string[]): void {
  for (const result of results) {
    const reason = result.reason === undefined ? "" : ` — ${result.reason}`;
    process.stdout.write(`${result.action.padEnd(11)} ${result.surface}: ${result.configPath}${reason}\n`);
  }
  for (const line of extra) process.stdout.write(`${line}\n`);
}

function exitCode(results: SurfaceResult[]): number {
  return results.some((result) => result.action === "failed") ? 1 : 0;
}

async function runInit(args: string[]): Promise<number> {
  const flags = parseInitFlags(args);
  const root = process.cwd();
  const surfaces = selectSurfaces(flags, root);

  if (flags.check) {
    let cli;
    try {
      cli = resolveCli(flags.binary);
    } catch (error) {
      if (!(error instanceof CliResolveError)) throw error;
      cli = undefined;
    }
    const db = flags.db !== undefined ? path.resolve(flags.db) : findDatabases(root)[0];
    const results = (flags.all ? [...SURFACES] : surfaces.length > 0 ? surfaces : [...SURFACES])
      .map((surface) => check(surface, root, cli?.path, db));
    if (flags.json) {
      process.stdout.write(`${JSON.stringify({ cli: cli ?? null, database: db ?? null, surfaces: results }, null, 2)}\n`);
    } else {
      for (const r of results) {
        const state = r.action === "failed" ? `malformed (${r.reason})`
          : !r.registered ? "not registered"
          : r.current ? "registered (current)"
          : "registered (stale entry)";
        process.stdout.write(`${r.detected ? "detected " : "         "} ${r.surface.padEnd(15)} ${state}\n`);
      }
      process.stdout.write(cli ? `cli: ${cli.path} (${cli.version})\n` : `cli: not found\n`);
    }
    return exitCode(results);
  }

  if (flags.remove) {
    const targets = flags.all || flags.surfaces !== undefined ? surfaces : [...SURFACES];
    const results = targets
      .filter((surface) => surface.workspaceScoped || flags.all || flags.surfaces !== undefined)
      .map((surface) => remove(surface, root));
    const skills = removeSkills(root);
    if (flags.json) {
      process.stdout.write(`${JSON.stringify({ surfaces: results, skills }, null, 2)}\n`);
    } else {
      reportHuman(results, skills.skills.length > 0 ? [`removed skills: ${skills.skills.join(", ")}`] : []);
    }
    return exitCode(results);
  }

  // The init flow proper (F1.1): resolve/install CLI → database → register →
  // skills → handoff.
  let cli;
  try {
    cli = resolveCli(flags.binary);
  } catch (error) {
    if (error instanceof CliResolveError) {
      process.stderr.write(`${error.message}\n`);
      return 3;
    }
    throw error;
  }
  if (cli === undefined) {
    const plan = installPlan();
    if (plan === undefined) {
      process.stderr.write(`Strata CLI not found; ${INSTALL_HINT}\n`);
      return 3;
    }
    process.stderr.write(`Strata CLI not found. Install with: ${plan.command.join(" ")}\n`);
    if (!(await confirm("run it now?", flags.yes))) {
      return 3;
    }
    if (!runInstall(plan)) {
      process.stderr.write(`install failed; ${INSTALL_HINT}\n`);
      return 3;
    }
    cli = resolveCli();
    if (cli === undefined) {
      process.stderr.write(`installed, but the CLI still is not resolvable; ${INSTALL_HINT}\n`);
      return 3;
    }
  }

  if (surfaces.length === 0) {
    process.stderr.write(
      "no agent surfaces detected in this workspace (use --all or --surface to register anyway)\n",
    );
    return 0;
  }

  const db = await resolveDatabase(flags, root);
  const results = surfaces.map((surface) => register(surface, root, cli.path, db));
  const skills = installSkills(root, flags.skills);

  if (flags.json) {
    process.stdout.write(
      `${JSON.stringify({ cli, database: db, surfaces: results, skills, handoff: HANDOFF_LINE }, null, 2)}\n`,
    );
  } else {
    const extra: string[] = [];
    if (skills.note !== undefined) extra.push(`skills: ${skills.note}`);
    if (skills.skills.length > 0) extra.push(`skills: ${skills.action} ${skills.skills.join(", ")}`);
    extra.push("", HANDOFF_LINE);
    reportHuman(results, extra);
  }
  return exitCode(results);
}

function runMcpPassthrough(args: string[]): void {
  let cli;
  try {
    cli = resolveCli();
  } catch {
    cli = undefined;
  }
  if (cli === undefined) {
    // Fail fast with the install hint (F4.1) — no install offer on the MCP
    // path, where we may be spawned headless by an agent host.
    process.stderr.write(`Strata CLI not found; ${INSTALL_HINT}\n`);
    process.exit(3);
  }
  const child = spawn(cli.path, ["mcp", "serve", ...args], { stdio: "inherit" });
  child.on("exit", (code, signal) => {
    process.exit(signal !== null ? 1 : (code ?? 1));
  });
}

const [, , command, ...rest] = process.argv;
switch (command) {
  case "init":
    runInit(rest).then(
      (code) => process.exit(code),
      (error) => {
        process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
        process.exit(1);
      },
    );
    break;
  case "mcp":
    runMcpPassthrough(rest);
    break;
  default:
    usage();
}
