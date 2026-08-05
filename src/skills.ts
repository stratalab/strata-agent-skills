// Skills install (requirements F5): copy the bundled skills into the
// workspace's Claude-compatible skills directory. The skill content itself
// ships in `skills/` at the package root; until it lands, this reports
// honestly that there is nothing to install yet.

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export interface SkillsResult {
  action: "installed" | "refreshed" | "none" | "skipped";
  skills: string[];
  note?: string;
}

function bundledSkillsDir(): string {
  // dist/skills.js → package root → skills/
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, "..", "skills");
}

export function installSkills(root: string, enabled: boolean): SkillsResult {
  if (!enabled) {
    return { action: "skipped", skills: [], note: "--no-skills" };
  }
  const source = bundledSkillsDir();
  if (!fs.existsSync(source)) {
    return {
      action: "none",
      skills: [],
      note: "no skills bundled in this release yet (they are on the way)",
    };
  }
  const names = fs
    .readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (names.length === 0) {
    return { action: "none", skills: [], note: "no skills bundled in this release yet" };
  }
  const target = path.join(root, ".claude", "skills");
  let refreshed = false;
  for (const name of names) {
    const dest = path.join(target, name);
    if (fs.existsSync(dest)) refreshed = true;
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(path.join(source, name), dest, { recursive: true });
  }
  return { action: refreshed ? "refreshed" : "installed", skills: names };
}

export function removeSkills(root: string): SkillsResult {
  const source = bundledSkillsDir();
  const target = path.join(root, ".claude", "skills");
  if (!fs.existsSync(source) || !fs.existsSync(target)) {
    return { action: "none", skills: [] };
  }
  const removed: string[] = [];
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dest = path.join(target, entry.name);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true });
      removed.push(entry.name);
    }
  }
  return { action: removed.length > 0 ? "installed" : "none", skills: removed };
}
