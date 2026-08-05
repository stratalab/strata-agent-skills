// Registration itself (requirements AR-2, F1–F3): compute the entry, converge
// each surface's config toward it, remove cleanly, and report state without
// changing anything. Every function here is pure over ConfigFile except the
// final write, so the fixture tests exercise exactly what production runs.

import * as fs from "node:fs";

import { ENTRY_NAME } from "./constants.js";
import { readConfig, writeConfig, type ConfigFile, ConfigParseError } from "./json-config.js";
import { entryFor, isStrataEntry, type Surface } from "./surfaces.js";

export type Action =
  | "registered"
  | "updated"
  | "unchanged"
  | "removed"
  | "absent"
  | "skipped"
  | "failed";

export interface SurfaceResult {
  surface: Surface["id"];
  configPath: string;
  action: Action;
  reason?: string;
}

function serversOf(config: ConfigFile, rootKey: string): Record<string, unknown> {
  const existing = config.root[rootKey];
  if (existing !== null && typeof existing === "object" && !Array.isArray(existing)) {
    return existing as Record<string, unknown>;
  }
  const fresh: Record<string, unknown> = {};
  config.root[rootKey] = fresh;
  return fresh;
}

/** Converge one surface's config to carry the current Strata entry. */
export function register(surface: Surface, root: string, binary: string, db: string): SurfaceResult {
  const configPath = surface.configPath(root);
  let config: ConfigFile;
  try {
    config = readConfig(configPath);
  } catch (error) {
    if (error instanceof ConfigParseError) {
      return { surface: surface.id, configPath, action: "failed", reason: error.message };
    }
    throw error;
  }
  if (config.hasComments) {
    // AR-2's honesty clause: we preserve unknown keys and indentation, but not
    // comments — so a commented file is never rewritten. The user (or their
    // agent) adds the printed entry by hand.
    return {
      surface: surface.id,
      configPath,
      action: "skipped",
      reason: "config contains comments; add the entry manually to preserve them",
    };
  }

  const desired = entryFor(surface, binary, db);
  const servers = serversOf(config, surface.rootKey);
  const current = servers[ENTRY_NAME];
  if (current !== undefined && JSON.stringify(current) === JSON.stringify(desired)) {
    return { surface: surface.id, configPath, action: "unchanged" };
  }
  const action: Action = current === undefined ? "registered" : "updated";
  servers[ENTRY_NAME] = desired;
  writeConfig(config);
  return { surface: surface.id, configPath, action };
}

/** Remove exactly the entries we (or the extension) wrote (requirements F2.1). */
export function remove(surface: Surface, root: string): SurfaceResult {
  const configPath = surface.configPath(root);
  let config: ConfigFile;
  try {
    config = readConfig(configPath);
  } catch (error) {
    if (error instanceof ConfigParseError) {
      return { surface: surface.id, configPath, action: "failed", reason: error.message };
    }
    throw error;
  }
  if (!config.existed) {
    return { surface: surface.id, configPath, action: "absent" };
  }
  if (config.hasComments) {
    return {
      surface: surface.id,
      configPath,
      action: "skipped",
      reason: "config contains comments; remove the entry manually to preserve them",
    };
  }
  const servers = config.root[surface.rootKey];
  if (servers === null || typeof servers !== "object" || Array.isArray(servers)) {
    return { surface: surface.id, configPath, action: "absent" };
  }
  const table = servers as Record<string, unknown>;
  const current = table[ENTRY_NAME];
  if (current === undefined || !isStrataEntry(current)) {
    return { surface: surface.id, configPath, action: "absent" };
  }
  delete table[ENTRY_NAME];

  // If removal leaves a config that only ever held our entry, delete the file
  // rather than leaving an empty husk behind.
  const emptyEnvelope =
    Object.keys(table).length === 0 &&
    Object.keys(config.root).length === 1 &&
    config.root[surface.rootKey] === table;
  if (emptyEnvelope) {
    fs.rmSync(configPath);
  } else {
    writeConfig(config);
  }
  return { surface: surface.id, configPath, action: "removed" };
}

export interface CheckResult extends SurfaceResult {
  detected: boolean;
  registered: boolean;
  current: boolean;
}

/** Report a surface's state without changing anything (requirements F3.1). */
export function check(
  surface: Surface,
  root: string,
  binary: string | undefined,
  db: string | undefined,
): CheckResult {
  const configPath = surface.configPath(root);
  const detected = surface.detect(root) || fs.existsSync(configPath);
  let config: ConfigFile;
  try {
    config = readConfig(configPath);
  } catch (error) {
    if (error instanceof ConfigParseError) {
      return {
        surface: surface.id,
        configPath,
        action: "failed",
        reason: error.message,
        detected,
        registered: false,
        current: false,
      };
    }
    throw error;
  }
  const servers = config.root[surface.rootKey];
  const entry =
    servers !== null && typeof servers === "object" && !Array.isArray(servers)
      ? (servers as Record<string, unknown>)[ENTRY_NAME]
      : undefined;
  const registered = entry !== undefined && isStrataEntry(entry);
  const current =
    registered &&
    binary !== undefined &&
    db !== undefined &&
    JSON.stringify(entry) === JSON.stringify(entryFor(surface, binary, db));
  return {
    surface: surface.id,
    configPath,
    action: "unchanged",
    detected,
    registered,
    current,
  };
}
