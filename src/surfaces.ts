// The agent surfaces init can register with (requirements §3.1): where each
// one's config lives, which envelope key it uses, and when it is "present" in
// a workspace. The entry shape is identical across surfaces; only the envelope
// differs — and the shapes here are the contract the shared fixture set pins
// (§3.2), byte-identical with the VS Code extension's F6 writer.

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export type SurfaceId = "vscode" | "cursor" | "claude-code" | "claude-desktop";

export interface Surface {
  id: SurfaceId;
  /** Human name for summaries. */
  label: string;
  /** The envelope key the surface's config nests servers under. */
  rootKey: "servers" | "mcpServers";
  /** Whether entries carry an explicit `"type": "stdio"` field. */
  explicitStdioType: boolean;
  /** Absolute config path for a workspace root. */
  configPath(root: string): string;
  /** Presence-based detection (requirements F1.2). */
  detect(root: string): boolean;
  /** User-global surfaces are registered only on explicit request (Q2). */
  workspaceScoped: boolean;
}

function claudeDesktopConfigPath(): string {
  if (process.platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json",
    );
  }
  return path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json");
}

export const SURFACES: readonly Surface[] = [
  {
    id: "vscode",
    label: "VS Code (agent mode)",
    rootKey: "servers",
    explicitStdioType: true,
    configPath: (root) => path.join(root, ".vscode", "mcp.json"),
    detect: (root) => fs.existsSync(path.join(root, ".vscode")),
    workspaceScoped: true,
  },
  {
    id: "cursor",
    label: "Cursor",
    rootKey: "mcpServers",
    explicitStdioType: false,
    configPath: (root) => path.join(root, ".cursor", "mcp.json"),
    detect: (root) => fs.existsSync(path.join(root, ".cursor")),
    workspaceScoped: true,
  },
  {
    id: "claude-code",
    label: "Claude Code",
    rootKey: "mcpServers",
    explicitStdioType: false,
    configPath: (root) => path.join(root, ".mcp.json"),
    detect: (root) =>
      fs.existsSync(path.join(root, ".mcp.json")) || fs.existsSync(path.join(root, ".claude")),
    workspaceScoped: true,
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    rootKey: "mcpServers",
    explicitStdioType: false,
    configPath: () => claudeDesktopConfigPath(),
    // User-global: never auto-detected into a workspace run; explicit only.
    detect: () => false,
    workspaceScoped: false,
  },
];

export function surfaceById(id: string): Surface | undefined {
  return SURFACES.find((surface) => surface.id === id);
}

/** The MCP server entry a surface's config carries for Strata. `--db` precedes
 *  the subcommand — it is a top-level CLI flag, not an `mcp serve` option. */
export function entryFor(
  surface: Surface,
  binary: string,
  db: string,
): Record<string, unknown> {
  const entry: Record<string, unknown> = {};
  if (surface.explicitStdioType) {
    entry["type"] = "stdio";
  }
  entry["command"] = binary;
  entry["args"] = ["--db", db, "mcp", "serve"];
  return entry;
}

/** Whether an existing entry is one of ours (this tool's or the extension's):
 *  any args carrying the `mcp serve` subcommand pair, wherever flags sit. */
export function isStrataEntry(value: unknown): boolean {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  const args = entry["args"];
  if (!Array.isArray(args)) return false;
  return args.some((arg, i) => arg === "mcp" && args[i + 1] === "serve");
}
