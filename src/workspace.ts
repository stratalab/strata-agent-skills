// Workspace database discovery (requirements AR-4): a bounded scan for Strata
// layout markers. Conservative on purpose — a directory is a database when it
// carries the storage writer lock or the IPC owner files, never on a name
// guess.

import * as fs from "node:fs";
import * as path from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "target", "dist", "out", ".venv"]);
const MAX_DEPTH = 3;

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isStrataDatabase(dir: string): boolean {
  // Structural marker: the storage layout's locks directory next to the
  // manifest or WAL directory (object names inside vary by backend), or the
  // IPC owner files of a live/recently-live database.
  if (isDir(path.join(dir, "locks")) && (isDir(path.join(dir, "manifest")) || isDir(path.join(dir, "wal")))) {
    return true;
  }
  return fs.existsSync(path.join(dir, "strata.pid")) || fs.existsSync(path.join(dir, "strata.sock"));
}

/** Find Strata database directories under `root`, depth- and noise-bounded. */
export function findDatabases(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string, depth: number): void => {
    if (isStrataDatabase(dir)) {
      found.push(dir);
      return; // databases do not nest
    }
    if (depth >= MAX_DEPTH) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // unreadable directories are not our business
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".") && entry.name !== ".strata") continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), depth + 1);
    }
  };
  walk(path.resolve(root), 0);
  return found.sort();
}
