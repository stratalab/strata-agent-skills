# strata-agent-skills

**Everything AI agents need to use Strata**, in one repo:

- **Agent skills** (`skills/`) — SKILL.md-format knowledge for Claude Code, Cursor,
  Codex, and every Agent-Skills-compatible tool:
  - **`strata`** — what Strata is, which primitive when, the MCP tool surface and
    its `strata_command` escape hatch, error-code discipline. Ships the full
    command catalog and error registry as references.
  - **`strata-branching`** — branch-per-agent isolation patterns, fork anchors,
    the no-merge rule.
  - **`strata-time-travel`** — `as_of` reads, history, retention and
    `history_unavailable`.
  - **`strata-python`** — the Python face of the set: `stratadb.open()` and
    its durability/IPC/memory-budget options, every `db.<namespace>`, return
    shapes (`None` on miss, receipts, `Page`), `db.at()` branching, typed
    errors, and the sharp edges. The `stratadb` wheel vendors this skill and
    `stratadb.init()` installs it, so pip-only projects get it offline.

  Install any way you like: `npx skills add stratalab/strata-agent-skills`,
  `/plugin marketplace add stratalab/strata-agent-skills` in Claude Code, or
  `npx strata init` once the package is published (see Status).

  Skills are **authored structure + generated substance**: workflow prose is
  written by hand; command tables, error codes, and catalogs are rendered from
  strata-core's IDL artifacts at the rev pinned in `STRATA_CORE_REV`
  (`npm run skills:gen`), and CI fails if they drift (`npm run skills:check`).
- **The on-ramp** — one command that makes Strata usable by every agent in a project:

  ```bash
  npx strata init
  ```

  Verifies or installs the `strata` CLI, registers the Strata MCP server with every
  agent surface it finds (VS Code, Cursor, Claude Code, Claude Desktop —
  workspace-scoped, idempotent, reversible), installs the skills, and prints the
  handoff line: *tell your agent "get started with Strata."*

- **`npx strata mcp`** — resolves the installed CLI and execs `strata mcp serve`,
  for configs that prefer an npx command to an absolute path.

## What lives elsewhere, on purpose

**The MCP server is not here.** It is `strata mcp serve`, inside the `strata` CLI
binary ([strata-core](https://github.com/stratalab/strata-core)) — one canonical
implementation, local stdio, no hosted endpoint, no OAuth: the database is local
files, air-gapped by construction. It opens the database as an IPC host, so other
surfaces (the [VS Code extension](https://github.com/stratalab/strata-vscode))
watch the agent's writes live. This repo is how agents *reach* that server, never a
second implementation of it.

## Usage

```bash
npx strata init             # detect agents, register the MCP server, install skills
npx strata init --check     # report state, change nothing
npx strata init --remove    # undo everything init wrote
npx strata init --yes --json  # agent-operable: no prompts, machine-readable result
npx strata mcp              # exec the installed CLI's `strata mcp serve`
```

Flags: `--db <path>` (choose among multiple databases), `--binary <path>`
(explicit CLI), `--all` / `--surface <id,…>` (register unconditionally;
`claude-desktop` is explicit-only since it is user-global), `--no-skills`.

The registered entry (VS Code shown; Cursor/Claude Code identical minus `type`):

```json
{ "type": "stdio", "command": "<abs strata>", "args": ["--db", "<db>", "mcp", "serve"] }
```

The `fixtures/registration/` directory is the shared contract with the VS Code
extension's own registration (its F6) — both writers converge on these bytes.

## Status

`init`, `--check`, `--remove`, the `mcp` passthrough, and the four skills are
implemented and tested (including an end-to-end lane: real CLI, real database,
real MCP handshake through the written entry, skills installed and removed).
`--check` reports installed-skill freshness against the bundle. Requirements:
[`docs/requirements.md`](docs/requirements.md).

npm package name: `strata`, pending the npm dispute for an abandoned 2013 package;
`strata-db` is the secured fallback. Not yet published.
