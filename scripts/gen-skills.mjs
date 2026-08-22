#!/usr/bin/env node
// Renders the generated sections of the bundled skills from strata-core's
// committed IDL artifacts at the pinned STRATA_CORE_REV (AR-8: authored
// structure, generated substance). No build of strata-core is required —
// everything read here is checked into that repo.
//
//   node scripts/gen-skills.mjs --strata-core <dir>          # write
//   node scripts/gen-skills.mjs --strata-core <dir> --check  # CI freshness
//
// The script refuses to run against a checkout whose HEAD differs from
// STRATA_CORE_REV: bump the pin file first, then regenerate.

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---- curated config (authored; validated against the checkout) -------------

// Mirrors the tool table in strata-core's crates/cli/src/mcp.rs at the pinned
// rev. The set is cross-checked against the source file, so a rev bump that
// adds or renames tools fails generation instead of drifting.
const CURATED_TOOLS = [
  ["strata_guide", null, "Full usage guide, version-matched to the server. Call it first when unsure."],
  ["strata_command", null, "Run any cataloged command as raw wire JSON — the escape hatch to the full catalog."],
  ["strata_kv_put", "kv.put"],
  ["strata_kv_get", "kv.get"],
  ["strata_kv_delete", "kv.delete"],
  ["strata_kv_list", "kv.list"],
  ["strata_json_set", "json.set"],
  ["strata_json_get", "json.get"],
  ["strata_json_delete", "json.delete"],
  ["strata_vector_create_collection", "vector.collection.create"],
  ["strata_vector_upsert", "vector.upsert"],
  ["strata_vector_query", "vector.query"],
  ["strata_event_append", "event.append"],
  ["strata_event_list", "event.list"],
  ["strata_graph_create", "graph.create"],
  ["strata_graph_add_node", "graph.node.add"],
  ["strata_graph_add_edge", "graph.edge.add"],
  ["strata_graph_neighbors", "graph.neighbors"],
  ["strata_branch_list", "branch.list"],
  ["strata_branch_fork", "branch.fork"],
];

// Codes surfaced in the strata skill's "codes you will actually meet" table.
// Glosses are authored; the codes themselves must exist in the IDL registry.
const REPRESENTATIVE_ERRORS = [
  ["not_found.engine.branch", "the `branch` argument names a branch that does not exist — check `strata_branch_list`"],
  ["already_exists.engine.branch", "the branch name for a create/fork is already taken"],
  ["history_unavailable.engine.persistence_history", "`as_of`, history, or a fork anchor points outside retained history — pick a newer timestamp"],
  ["invalid_argument.engine.kv_key", "the key is invalid (for example, empty)"],
  ["access_denied.executor.read_only_session", "this session is read-only and the command writes — reconnect writable"],
  ["failed_precondition.engine.runtime_closed", "the database handle is closed or shutting down — reconnect"],
];

// Which generated section ids live in which skill file.
const EXPECTED_SECTIONS = {
  "skills/strata/SKILL.md": ["mcp-tools", "representative-errors"],
  "skills/strata/references/commands.md": ["command-catalog"],
  "skills/strata/references/errors.md": ["error-catalog"],
  "skills/strata-branching/SKILL.md": ["branch-commands", "branch-errors"],
  "skills/strata-time-travel/SKILL.md": ["asof-commands", "history-commands"],
  // Authored-only: its substance is the stratadb SDK surface (vendored by the
  // wheel as stratadb.agents_skill()), not an IDL artifact — still pin-stamped.
  "skills/strata-python/SKILL.md": [],
};

// ---- argument parsing -------------------------------------------------------

function fail(message, code = 1) {
  process.stderr.write(`gen-skills: ${message}\n`);
  process.exit(code);
}

const args = process.argv.slice(2);
let strataCore;
let checkMode = false;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--strata-core") {
    strataCore = args[++i];
  } else if (args[i] === "--check") {
    checkMode = true;
  } else {
    fail(`unknown argument ${args[i]} (usage: gen-skills.mjs --strata-core <dir> [--check])`, 2);
  }
}
if (strataCore === undefined) fail("--strata-core <dir> is required", 2);
strataCore = path.resolve(strataCore);

// ---- pin verification -------------------------------------------------------

const pin = fs.readFileSync(path.join(repoRoot, "STRATA_CORE_REV"), "utf8").trim();
if (!/^[0-9a-f]{40}$/.test(pin)) fail(`STRATA_CORE_REV is not a 40-char sha: ${pin}`);
let head;
try {
  head = execFileSync("git", ["-C", strataCore, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {
  fail(`${strataCore} is not a git checkout`);
}
if (head !== pin) {
  fail(
    `checkout is at ${head}, pin is ${pin}.\n` +
      `  Either check out the pinned rev, or bump STRATA_CORE_REV first and regenerate.`,
    2,
  );
}

// ---- load IDL artifacts -----------------------------------------------------

const idlDir = path.join(strataCore, "crates", "executor", "idl", "v1");

const index = JSON.parse(fs.readFileSync(path.join(idlDir, "generated", "command-index.json"), "utf8"));
const commands = index.commands;
if (!Array.isArray(commands) || commands.length === 0) fail("command-index.json has no commands");

// Per-command wire type and as_of capability come from the generated request
// schemas — never derived from the id.
for (const command of commands) {
  const schemaPath = path.join(idlDir, "generated", "schemas", `${command.id}.json`);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const properties = schema.request?.properties;
  const wireType = properties?.type?.const;
  if (typeof wireType !== "string") fail(`${command.id}: no request type const in schema`);
  command.wireType = wireType;
  command.takesAsOf = Object.prototype.hasOwnProperty.call(properties, "as_of");
}

const byId = new Map(commands.map((command) => [command.id, command]));

// errors.yaml is a flat `errors:` list — parsed strictly so an upstream
// reshape fails loudly here instead of producing an empty catalog.
const errorCodes = [];
{
  const lines = fs.readFileSync(path.join(idlDir, "errors.yaml"), "utf8").split("\n");
  for (const line of lines) {
    if (line.trim() === "" || line.trim().startsWith("#") || line.trim() === "errors:") continue;
    const item = line.match(/^\s+-\s+([a-z_0-9]+(?:\.[a-z_0-9]+)+)\s*$/);
    if (item === null) fail(`errors.yaml line not understood: ${JSON.stringify(line)}`);
    errorCodes.push(item[1]);
  }
  if (errorCodes.length === 0) fail("errors.yaml parsed to zero codes");
}
const errorCodeSet = new Set(errorCodes);

// Cross-check the curated tool list against the MCP server source at the pin:
// the set of "strata_*" string literals in mcp.rs must equal our config.
{
  const mcpSource = fs
    .readFileSync(path.join(strataCore, "crates", "cli", "src", "mcp.rs"), "utf8")
    .split("#[cfg(test)]")[0];
  const found = new Set();
  for (const match of mcpSource.matchAll(/"(strata_[a-z_]+)"/g)) found.add(match[1]);
  const configured = new Set(CURATED_TOOLS.map(([tool]) => tool));
  const missing = [...found].filter((tool) => !configured.has(tool));
  const stale = [...configured].filter((tool) => !found.has(tool));
  if (missing.length > 0 || stale.length > 0) {
    fail(
      `curated tool list drifted from crates/cli/src/mcp.rs\n` +
        `  in mcp.rs but not configured: ${missing.join(", ") || "(none)"}\n` +
        `  configured but not in mcp.rs: ${stale.join(", ") || "(none)"}`,
    );
  }
}

for (const [code] of REPRESENTATIVE_ERRORS) {
  if (!errorCodeSet.has(code)) fail(`representative error ${code} is not in errors.yaml`);
}

// ---- renderers --------------------------------------------------------------

// command-index docs entries are site-relative paths; the rendered site base
// matches strata-core's llms.txt renderer.
function docsUrl(command) {
  return command.docs.startsWith("/") ? `https://stratadb.org${command.docs}` : command.docs;
}

function commandById(id) {
  const command = byId.get(id);
  if (command === undefined) fail(`curated tool maps to unknown command ${id}`);
  return command;
}

function renderMcpTools() {
  const rows = CURATED_TOOLS.map(([tool, id, authored]) => {
    if (id === null) return `| \`${tool}\` | — | ${authored} |`;
    const command = commandById(id);
    const asOf = command.takesAsOf ? "yes" : "—";
    return `| \`${tool}\` | ${asOf} | ${command.mcp.description} |`;
  });
  return ["| Tool | `as_of` | Use it for |", "|---|---|---|", ...rows].join("\n");
}

function renderRepresentativeErrors() {
  const rows = REPRESENTATIVE_ERRORS.map(([code, gloss]) => `| \`${code}\` | ${gloss} |`);
  return ["| Code | Meaning |", "|---|---|", ...rows].join("\n");
}

function renderCommandCatalog() {
  const families = [...new Set(commands.map((command) => command.family))].sort();
  const parts = [];
  for (const family of families) {
    const members = commands.filter((command) => command.family === family);
    parts.push(`## ${family} (${members.length} commands)`);
    parts.push("| Command | Access | Summary |");
    parts.push("|---|---|---|");
    for (const command of members) {
      parts.push(`| [\`${command.wireType}\`](${docsUrl(command)}) | ${command.access} | ${command.summary} |`);
    }
    parts.push("");
  }
  return parts.join("\n").trimEnd();
}

function renderErrorCatalog() {
  const byClass = new Map();
  for (const code of [...errorCodes].sort()) {
    const errorClass = code.split(".")[0];
    if (!byClass.has(errorClass)) byClass.set(errorClass, []);
    byClass.get(errorClass).push(code);
  }
  const parts = [];
  for (const [errorClass, codes] of [...byClass.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    parts.push(`## ${errorClass}`);
    for (const code of codes) parts.push(`- [\`${code}\`](https://stratadb.org/e/${code})`);
    parts.push("");
  }
  return parts.join("\n").trimEnd();
}

const BRANCH_TOOL_ROUTE = new Map([
  ["branch.list", "`strata_branch_list`"],
  ["branch.fork", "`strata_branch_fork`"],
  ["branch.fork_at_version", "`strata_branch_fork` (`version`)"],
  ["branch.fork_at_timestamp", "`strata_branch_fork` (`timestamp`)"],
]);

function renderBranchCommands() {
  const members = commands.filter((command) => command.family === "branch");
  const rows = members.map((command) => {
    const route = BRANCH_TOOL_ROUTE.get(command.id) ?? "`strata_command`";
    return `| [\`${command.wireType}\`](${docsUrl(command)}) | ${route} | ${command.summary} |`;
  });
  return ["| Command | Via MCP | Summary |", "|---|---|---|", ...rows].join("\n");
}

function renderBranchErrors() {
  const codes = new Map();
  for (const command of commands) {
    if (command.family !== "branch") continue;
    for (const entry of command.errors) codes.set(entry.code, entry.docs);
  }
  return [...codes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, docs]) => `- [\`${code}\`](${docs})`)
    .join("\n");
}

function renderAsOfCommands() {
  const takers = commands.filter((command) => command.takesAsOf);
  const families = [...new Set(takers.map((command) => command.family))].sort();
  return families
    .map((family) => {
      const names = takers
        .filter((command) => command.family === family)
        .map((command) => `\`${command.wireType}\``);
      return `- **${family}** — ${names.join(", ")}`;
    })
    .join("\n");
}

function renderHistoryCommands() {
  const members = commands.filter((command) => command.kind === "read.history");
  if (members.length === 0) fail("no read.history commands found");
  const rows = members.map(
    (command) => `| [\`${command.wireType}\`](${docsUrl(command)}) | ${command.summary} |`,
  );
  return ["| Command | Summary |", "|---|---|", ...rows].join("\n");
}

const RENDERERS = {
  "mcp-tools": renderMcpTools,
  "representative-errors": renderRepresentativeErrors,
  "command-catalog": renderCommandCatalog,
  "error-catalog": renderErrorCatalog,
  "branch-commands": renderBranchCommands,
  "branch-errors": renderBranchErrors,
  "asof-commands": renderAsOfCommands,
  "history-commands": renderHistoryCommands,
};

// ---- splice -----------------------------------------------------------------

const BEGIN = /^<!-- generated:begin ([a-z-]+) -->$/;
const END = /^<!-- generated:end ([a-z-]+) -->$/;

function renderFile(relPath, expectedSections) {
  const filePath = path.join(repoRoot, relPath);
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const output = [];
  const seen = [];
  let open = null;
  for (const line of lines) {
    const begin = line.match(BEGIN);
    const end = line.match(END);
    if (begin !== null) {
      if (open !== null) fail(`${relPath}: nested generated section ${begin[1]} inside ${open}`);
      open = begin[1];
      if (RENDERERS[open] === undefined) fail(`${relPath}: unknown generated section ${open}`);
      seen.push(open);
      output.push(line, RENDERERS[open]());
      continue;
    }
    if (end !== null) {
      if (open !== end[1]) fail(`${relPath}: generated:end ${end[1]} does not close ${open ?? "anything"}`);
      open = null;
      output.push(line);
      continue;
    }
    if (open === null) output.push(line);
  }
  if (open !== null) fail(`${relPath}: generated section ${open} never closed`);
  if (JSON.stringify(seen) !== JSON.stringify(expectedSections)) {
    fail(`${relPath}: sections ${JSON.stringify(seen)} != expected ${JSON.stringify(expectedSections)}`);
  }
  let content = output.join("\n");
  // The pin is also stamped into each SKILL.md's frontmatter provenance.
  content = content.replace(/(strata-core-rev: ")[0-9a-f]{40}(")/, `$1${pin}$2`);
  return content;
}

const stale = [];
for (const [relPath, sections] of Object.entries(EXPECTED_SECTIONS)) {
  const rendered = renderFile(relPath, sections);
  const filePath = path.join(repoRoot, relPath);
  const current = fs.readFileSync(filePath, "utf8");
  if (current === rendered) continue;
  if (checkMode) {
    stale.push(relPath);
  } else {
    fs.writeFileSync(filePath, rendered);
    process.stdout.write(`wrote ${relPath}\n`);
  }
}

if (checkMode) {
  if (stale.length > 0) {
    fail(
      `stale generated content (run: npm run skills:gen -- --strata-core <dir>):\n` +
        stale.map((relPath) => `  ${relPath}`).join("\n"),
    );
  }
  process.stdout.write(`skills are fresh at ${pin}\n`);
} else {
  process.stdout.write(`generated from strata-core @ ${pin}\n`);
}
