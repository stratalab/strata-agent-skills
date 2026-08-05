# Strata Agent Skills & On-Ramp — V1 Requirements

**Status:** Draft for review
**Date:** 2026-08-05
**Repo:** `stratalab/strata-agent-skills` (succeeds the retired `strata-mcp` repo)
**Reference patterns:** Neon's `npx neon@latest init` and `neondatabase/agent-skills`
(https://neon.com/docs/get-started/with-an-agent, https://neon.com/docs/ai/agent-skills)

> **npm package name:** `strata`, pending the npm dispute for the abandoned 2013
> package of that name; `strata-db` is the secured fallback if the dispute fails.
> Everything else in this document is name-final.

---

## 1. Context

Installing a database is not the finish line anymore — the finish line is the
user's AI agent being able to *use it well*. That takes two things: **wiring**
(the agent can reach the database through MCP) and **knowledge** (the agent knows
Strata's model — branches, time travel, the primitives — instead of guessing from
generic database priors). This repo owns both, because they version together: a
skill that teaches tools the server doesn't have yet, or an init that installs
stale skills, is the same bug in two directions.

```bash
npx strata init
```

After it runs, every agent surface in the project can reach the project's Strata
database, carries the current Strata skills, and the user has the handoff line:
*tell your agent "get started with Strata."*

Three commitments anchor everything below:

1. **This repo implements no MCP tools and embeds no engine.** The Strata MCP
   server is `strata mcp serve`, inside the CLI binary — one canonical path, local
   stdio, IPC-hosting, no cloud. This repo is distribution and knowledge for that
   server.
2. **MCP access is on by default, workspace-scoped, never a per-database chore**
   (founder decision, 2026-08-05). One registration per workspace; database
   selection is the server's job at runtime.
3. **Skills are generated-fed, never hand-drifted.** Skill content derives from
   strata-core's IDL docs pipeline (`llms.txt`, the agents guide, command prose) at
   a pinned `STRATA_CORE_REV`; a rev bump is a reviewed PR that regenerates, same
   as every other IDL consumer.

## 2. Product scope

### In scope (V1)

| # | Feature | One-liner |
|---|---------|-----------|
| F1 | `init` | Verify/install the CLI, register the MCP server with every detected agent surface, install skills, print the handoff line |
| F2 | `init --remove` | Cleanly unregister everything `init` wrote |
| F3 | `init --check` | Report detected agent surfaces, registration state, and skill freshness, changing nothing |
| F4 | `mcp` passthrough | `npx strata mcp` resolves the installed CLI and execs `strata mcp serve` |
| F5 | Agent skills | The authored+generated skill set (`skills/`), installable via `init`, the skills CLI, and plugin marketplaces |

### Out of scope (V1)

- **Implementing MCP tools** — permanently out; the CLI's server is canonical.
- **Hosted/remote MCP, OAuth, API keys** — there is no cloud in this path; the
  database is local files. (A positioning fact, not a limitation.)
- **Database creation** — `init` wires and teaches agents; the agent creates
  databases through the tools it just gained (Q3).
- **Windows** — follows the upstream transport (strata-core G10); `init` on
  Windows exits with a clear not-yet message rather than half-registering.
- **Telemetry** — none, matching every other Strata surface.

## 3. System context

### 3.1 What registration means per agent surface

| Surface | Mechanism | Scope |
|---|---|---|
| VS Code (Copilot agent mode) | `.vscode/mcp.json` | Workspace |
| Cursor | `.cursor/mcp.json` | Workspace |
| Claude Code | `.mcp.json` | Workspace |
| Claude Desktop | `claude_desktop_config.json` | **User-global** (Q2) |

The entry written is the standard stdio shape, identical across surfaces except
for each file's envelope:

```json
{ "command": "<resolved strata binary>", "args": ["mcp", "serve", "--db", "<db>"] }
```

### 3.2 Two writers, one format

The VS Code extension (`stratalab/strata-vscode`, requirements §F6) registers the
same entries from inside the editor. The two implementations MUST write
byte-identical entries, verified by a **shared fixture set** (the fixtures live
here; the extension vendors them). Either writer must recognize, update, and
remove the other's entries as its own.

### 3.3 Relationship to the canonical server

`strata mcp serve` opens the database with `IpcMode::Host`: while an agent works,
its session is visible in `ipc_status.clients`, and its writes stream to any
attached observer via version ticks. Registration is wiring; the live-observation
payoff belongs to the extension and CLI.

### 3.4 How skills reach agents

| Channel | Mechanism |
|---|---|
| `init` (F1) | Installs/refreshes skills for detected compatible surfaces |
| Skills CLI | `npx skills add stratalab/strata-agent-skills` (skills.sh indexed) |
| Claude Code | Plugin marketplace (`/plugin marketplace add`, `/plugin install`) |
| Repo direct | `skills/<name>/SKILL.md`, the interchange format everything reads |

## 4. Architecture requirements

- **AR-1 — Exec, never embed.** The package contains no engine, no wire client,
  and no MCP implementation. Everything database-shaped happens by exec'ing the
  CLI. The package stays small enough to be an incidental `npx` download.
- **AR-2 — Registration discipline.** Idempotent (re-runs converge, never
  duplicate); reversible (F2 removes exactly what was written, preserving
  everything else in each file); explicit (every write is printed); JSON-preserving
  (unknown keys and formatting of existing config files survive edits).
- **AR-3 — CLI discovery and install.** Resolve the `strata` binary: explicit
  `--binary` flag → `PATH` → known install locations. If absent, offer install via
  Homebrew tap or the curl installer (tier-1 channels) with the chosen command
  printed before running; `--yes` consents. Never a bundled or vendored engine.
  Verify with `strata --version`.
- **AR-4 — Workspace scoping.** One entry per workspace, named `strata`. Database
  path resolution (transitional, until the server grows workspace discovery): a
  single database → pin it; multiple → prompt (`--db` preselects); none → register
  with the workspace root as the intended home and say the agent can create one.
- **AR-5 — Agent-operable.** `--yes` answers every prompt with the safe default;
  exit codes are meaningful; `--json` emits a machine-readable result. An agent
  running `npx strata init --yes` mid-task must succeed or fail atomically and
  legibly.
- **AR-6 — Package-name contingency.** The npm package name is the one unsettled
  name (dispute pending; `strata-db` fallback). It lives in exactly one module.
  Bin name, config entry name, skill names, and everything user-facing are
  `strata`, final.
- **AR-7 — Toolchain.** TypeScript, Node 18+, zero runtime dependencies for the
  package (dev/build dependencies unrestricted); no postinstall scripts.
- **AR-8 — Skill generation discipline.** Each skill is authored structure +
  generated substance: the workflow prose is human-authored; command references,
  tool names, and examples are generated from the IDL artifacts at the pinned
  `STRATA_CORE_REV`. CI fails if generated content is stale against the pinned rev
  (the same freshness contract as every IDL consumer). Skills never contradict the
  catalog because their factual content *is* the catalog.

## 5. Functional requirements

- **F1.1** `init` runs: CLI resolve/install (AR-3) → surface detection (§3.1) →
  per-surface registration (AR-2, AR-4) → skills install (F5) → summary + handoff
  line. Interactive by default; `--yes` for unattended; `--no-skills` opts out.
- **F1.2** Detection is presence-based: a surface is offered when its config
  convention exists in the workspace (or, for Claude Desktop, on the machine).
  `--all` registers every supported surface unconditionally.
- **F1.3** Partial failure is loud: each surface registers independently; the
  summary names every success and failure with its reason; non-zero exit if any
  requested surface failed.
- **F2.1** `--remove` deletes exactly the entries this tool (or the extension —
  §3.2) wrote, across all surfaces, plus installed skills, and reports what it
  removed.
- **F3.1** `--check` prints the detection/registration matrix, resolved CLI
  version, and installed-skill freshness, changing nothing. The support artifact.
- **F4.1** `mcp` resolves the CLI (no install offer — fail fast with the install
  hint) and execs `strata mcp serve` with remaining args passed through verbatim.
  Default written entries use the absolute binary path (fast, offline);
  `npx strata mcp` is the documented alternative for unstable-PATH environments.
- **F5.1** V1 skill set, in `skills/`:
  - **`strata`** — the core skill: what Strata is (embedded, branch-native,
    multi-primitive), when to reach for which primitive, the MCP tool surface,
    error-code discipline (`class.area.detail`, retry policies).
  - **`strata-branching`** — the workflow skill: branch-per-task/agent patterns,
    isolation guarantees (no cross-branch references), fork-at-version/timestamp.
  - **`strata-time-travel`** — `as_of` reads, history commands, retention errors,
    and when time travel beats keeping copies.
- **F5.2** Every skill carries frontmatter with its `STRATA_CORE_REV` provenance
  and the CLI version range it describes; `--check` compares installed skills
  against the package's bundled set.
- **F5.3** Skills are also consumable with zero installation: the repo layout is
  the Agent-Skills interchange convention, so `npx skills add` and marketplace
  indexing work against `main` directly.

## 6. Non-functional requirements

- **N1 — Footprint.** Zero runtime deps; npx cold start dominated by the registry
  fetch, not the payload. Skills are text; the whole package stays small.
- **N2 — Security.** Writes only the known config files and skill directories,
  shown before writing; entries reference the resolved absolute binary path;
  network access only in the explicit install step and npx's own fetch; no
  postinstall.
- **N3 — Error discipline.** CLI-originated failures surface the registry code
  verbatim; package-originated failures use a small stable code set. Tests assert
  on codes, not prose.
- **N4 — Testing.** The shared fixture set (§3.2) is the contract test. CI on
  macOS + Linux: fixture round-trips over pre-seeded configs (fresh, foreign
  entries, malformed), idempotence, remove-restores-originals, `--check` accuracy,
  skill freshness against the pinned rev, and an end-to-end lane with a real CLI:
  `init --yes` then a real MCP handshake through the registered entry.
- **N5 — Release.** npm with provenance; semver independent of the CLI; a CLI
  compatibility floor enforced at runtime via `strata --version`. Skill updates
  ship as package releases (init refreshes) and land on `main` for the
  zero-install channels simultaneously.

## 7. Upstream dependencies

- **Workspace-discovery mode for `strata mcp serve`** (serve without a pinned
  `--db`) — removes AR-4's transitional shape. File in strata-core when F1 lands.
- **IDL-driven MCP tool generation** (strata-core roadmap) — when the MCP tool
  surface becomes catalog-generated, the `strata` skill's tool reference
  regenerates from the same source, closing the loop.
- **The curl installer** (tier-1 distribution) — AR-3's non-Homebrew install path.
- **The npm name dispute** (owner: founder) — gates the publish name; `strata-db`
  is the fallback.

## 8. Open questions

- **Q1** Should the VS Code extension delegate its F6 file-based registrations to
  this package (`npx strata init --yes --surface cursor,claude-code`) instead of
  reimplementing the writes? (Draft assumes shared fixtures, separate
  implementations; delegation would collapse them to one.)
- **Q2** Claude Desktop is user-global, not per-workspace — register by default,
  or only with `--all`/explicit consent? (Draft assumes explicit only.)
- **Q3** When no database exists, should `init` create one, or is that the
  agent's first act through its new tools? (Draft: the agent's — creating state
  belongs to the surface that will own it.)
- **Q4** Global-config registration (`~/.cursor/mcp.json` etc.) behind a flag,
  for users who want Strata everywhere?
- **Q5** Skill granularity: three skills (draft) vs. one comprehensive `strata`
  skill? (Three matches Neon's core-vs-workflow split and lets agents load only
  what the task needs; revisit against real agent usage.)
