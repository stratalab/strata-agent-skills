// CLI discovery and install (requirements AR-3): explicit flag → PATH → known
// locations; offer install only when interactive or --yes consents; verify
// with `strata --version`. Exec, never embed — this module is the only place
// the package touches the binary.

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { CLI_BIN } from "./constants.js";

export interface ResolvedCli {
  path: string;
  version: string;
}

function versionOf(binary: string): string | undefined {
  const result = spawnSync(binary, ["--version"], { encoding: "utf8", timeout: 10_000 });
  if (result.status !== 0 || typeof result.stdout !== "string") return undefined;
  const line = result.stdout.trim();
  return line.length > 0 ? line : undefined;
}

function knownLocations(): string[] {
  return [
    path.join(os.homedir(), ".cargo", "bin", CLI_BIN),
    `/opt/homebrew/bin/${CLI_BIN}`,
    `/usr/local/bin/${CLI_BIN}`,
  ];
}

function onPath(): string | undefined {
  const dirs = (process.env["PATH"] ?? "").split(path.delimiter);
  for (const dir of dirs) {
    if (dir === "") continue;
    const candidate = path.join(dir, CLI_BIN);
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

export class CliResolveError extends Error {}

/** Resolve the CLI, or return undefined when it is simply not installed. */
export function resolveCli(explicit?: string): ResolvedCli | undefined {
  if (explicit !== undefined) {
    const version = versionOf(explicit);
    if (version === undefined) {
      throw new CliResolveError(
        `--binary ${explicit} did not answer \`--version\`; is it a Strata CLI?`,
      );
    }
    return { path: path.resolve(explicit), version };
  }
  for (const candidate of [onPath(), ...knownLocations()]) {
    if (candidate === undefined || !fs.existsSync(candidate)) continue;
    const version = versionOf(candidate);
    if (version !== undefined) return { path: path.resolve(candidate), version };
  }
  return undefined;
}

export interface InstallPlan {
  /** The command about to run, printed before running (AR-3). */
  command: string[];
}

/** The install we can offer on this machine, if any. */
export function installPlan(): InstallPlan | undefined {
  const brew = spawnSync("brew", ["--version"], { encoding: "utf8", timeout: 10_000 });
  if (brew.status === 0) {
    return { command: ["brew", "install", "stratalab/tap/strata"] };
  }
  return undefined;
}

export function runInstall(plan: InstallPlan): boolean {
  const [cmd, ...args] = plan.command;
  const result = spawnSync(cmd!, args, { stdio: "inherit" });
  return result.status === 0;
}
