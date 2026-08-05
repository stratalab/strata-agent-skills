// Reading and writing agent config files under the registration discipline
// (requirements AR-2): idempotent, JSON-preserving (unknown keys and detected
// indentation survive), and honest about the one thing we do not preserve —
// comments. A JSONC file (VS Code allows comments in mcp.json) is parsed
// tolerantly but never rewritten: destroying a user's comments silently would
// be worse than asking them to paste one entry by hand.

import * as fs from "node:fs";

export interface ConfigFile {
  /** Absolute path. */
  path: string;
  /** Parsed root object ({} when the file does not exist). */
  root: Record<string, unknown>;
  /** True when the file exists on disk. */
  existed: boolean;
  /** True when the source contained comments (file is read-only for us). */
  hasComments: boolean;
  /** Detected indentation (defaults to two spaces). */
  indent: string;
  /** True when the source ended with a newline (preserved on write). */
  trailingNewline: boolean;
}

/** Strip // and /* *​/ comments outside of strings. Minimal JSONC tolerance. */
export function stripJsonComments(text: string): { out: string; hadComments: boolean } {
  let out = "";
  let hadComments = false;
  let inString = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (inString) {
      out += ch;
      if (ch === "\\") {
        // Copy the escaped character verbatim so \" does not end the string.
        if (i + 1 < text.length) {
          out += text[i + 1];
          i += 2;
          continue;
        }
      } else if (ch === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      hadComments = true;
      while (i < text.length && text[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      hadComments = true;
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return { out, hadComments };
}

function detectIndent(text: string): string {
  const match = /^(?: {2,8}|\t)(?=\S)/m.exec(text);
  return match ? match[0] : "  ";
}

export class ConfigParseError extends Error {
  constructor(
    public readonly path: string,
    cause: string,
  ) {
    super(`malformed JSON in ${path}: ${cause}`);
  }
}

/** Read a config file, tolerating absence and JSONC comments. */
export function readConfig(path: string): ConfigFile {
  if (!fs.existsSync(path)) {
    return {
      path,
      root: {},
      existed: false,
      hasComments: false,
      indent: "  ",
      trailingNewline: true,
    };
  }
  const text = fs.readFileSync(path, "utf8");
  const { out, hadComments } = stripJsonComments(text);
  let root: unknown;
  try {
    root = out.trim() === "" ? {} : JSON.parse(out);
  } catch (error) {
    throw new ConfigParseError(path, error instanceof Error ? error.message : String(error));
  }
  if (root === null || typeof root !== "object" || Array.isArray(root)) {
    throw new ConfigParseError(path, "root is not an object");
  }
  return {
    path,
    root: root as Record<string, unknown>,
    existed: true,
    hasComments: hadComments,
    indent: detectIndent(text),
    trailingNewline: text.endsWith("\n"),
  };
}

/** Serialize with the file's own conventions. */
export function renderConfig(config: ConfigFile): string {
  const body = JSON.stringify(config.root, null, config.indent);
  return config.trailingNewline ? `${body}\n` : body;
}

export function writeConfig(config: ConfigFile): void {
  fs.mkdirSync(require_dirname(config.path), { recursive: true });
  fs.writeFileSync(config.path, renderConfig(config), "utf8");
}

function require_dirname(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx <= 0 ? "/" : path.slice(0, idx);
}
