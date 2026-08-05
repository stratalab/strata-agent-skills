# strata-agent-skills

**Everything AI agents need to use Strata**, in one repo:

- **Agent skills** (`skills/`) — SKILL.md-format knowledge for Claude Code, Cursor,
  Codex, and every Agent-Skills-compatible tool: how to use Strata, when to branch,
  how to time-travel. Installable via `npx skills add stratalab/strata-agent-skills`
  and bundled into `init`.
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

`init`, `--check`, `--remove`, and the `mcp` passthrough are implemented and
tested (including an end-to-end lane: real CLI, real database, real MCP
handshake through the written entry). Skill content is the next deliverable;
`init` already installs whatever lands in `skills/`. Requirements:
[`docs/requirements.md`](docs/requirements.md).

npm package name: `strata`, pending the npm dispute for an abandoned 2013 package;
`strata-db` is the secured fallback. Not yet published.
