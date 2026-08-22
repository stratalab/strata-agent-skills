---
name: strata
description: >-
  Use Strata — the embedded, branch-native database for AI agents: KV, JSON
  documents, event logs, vectors, and graphs in one local store with branching
  and time travel. Use when a project has a .strata database or strata_* MCP
  tools are available, when the user says "get started with Strata", mentions
  StrataDB, strata mcp serve, or npx strata init, or wants to store agent
  state, memory, embeddings, event logs, or graphs locally without a server.
  Covers choosing the right primitive, the MCP tool surface, the
  strata_command escape hatch to the full command catalog, write receipts,
  branch/space scoping, and error-code discipline.
license: MIT
metadata:
  strata-core-rev: "736f855dfcffc3ccf035d55a124681db95a11e1f"
  cli-version-range: "1.x"
---

# Strata

Strata is an embedded database built for AI agents. The whole database is a
local directory — no server, no account, no API key, air-gapped by
construction. One storage substrate carries five primitives (key-value, JSON
documents, hash-chained event logs, vectors, graphs), and every one of them is
branch-native and versioned: writes return commit receipts, reads can time
travel, and branches give each agent or experiment an isolated line of
history.

## How you are connected

You reach Strata through the `strata_*` MCP tools, served by `strata mcp
serve` from the `strata` CLI. `npx strata init` registers that server for a
workspace (and installs this skill). If no `strata_*` tools are visible, run
`npx strata init` in the project and reload.

Two meta-tools anchor everything:

- **`strata_guide`** returns the full usage guide for the exact CLI version
  you are talking to. Call it first when unsure — it is version-matched truth;
  this skill teaches the concepts and the traps.
- **`strata_command`** runs any command in the catalog (127 commands; the
  curated tools below cover only the common paths). See
  [the escape hatch](#the-escape-hatch-strata_command).

Every data tool also accepts two optional scope arguments:

- `branch` — which branch to operate on. Defaults to the branch the session
  was opened on (`default` unless started otherwise).
- `space` — a namespace within the branch. Defaults to `"default"`.

## Choose a primitive

All five primitives live in every branch and share the same commits,
branching, and time travel. Pick the natural shape for the data; do not
spread one record across primitives without a reason.

| The data is… | Use | Because |
|---|---|---|
| Config, flags, checkpoints, small state blobs | **KV** | Simplest shape; versioned history per key |
| Structured records you update field by field | **JSON** | Path-level reads and writes (`$.user.name`), indexes |
| Things that happened — decisions, tool calls, audit trail | **Events** | Append-only, hash-chained, integrity-verifiable |
| Text/embeddings you retrieve by similarity | **Vectors** | Collections with k-NN query and metadata filters |
| Entities and relationships you traverse | **Graph** | Typed nodes/edges, neighbors, analytics |

A useful default for agent memory: JSON for the working record, Events for
the decision log, Vectors for semantic recall, KV for checkpoints and flags.

## Writes return receipts; reads can time travel

Every mutation returns a commit receipt:

```json
{ "type": "write_result",
  "data": { "commit": { "version": 3, "timestamp": 3, "durability": "standard" },
             "effect": { "applied": true, "kind": "created" } } }
```

Save `data.commit.timestamp` when you may need to look back. Read tools that
accept `as_of` replay the database as of that commit timestamp. Timestamps
come from receipts and history rows — never compute them from wall-clock
time. The `strata-time-travel` skill covers this in depth.

## MCP tools

<!-- generated:begin mcp-tools -->
| Tool | `as_of` | Use it for |
|---|---|---|
| `strata_guide` | — | Full usage guide, version-matched to the server. Call it first when unsure. |
| `strata_command` | — | Run any cataloged command as raw wire JSON — the escape hatch to the full catalog. |
| `strata_kv_put` | — | Use this when the user wants to write, overwrite, or upsert a binary KV value. |
| `strata_kv_get` | yes | Use this when the user wants to fetch a binary KV value by key. |
| `strata_kv_delete` | — | Use this when the user wants to remove a KV value by key. |
| `strata_kv_list` | yes | Use this when the user wants to page through KV keys. |
| `strata_json_set` | — | Use this when the user wants to write, update, or upsert JSON data — a whole document (path `$`) or one nested field. |
| `strata_json_get` | yes | Use this when the user wants to fetch a JSON document or one nested field by key and path. |
| `strata_json_delete` | — | Use this when the user wants to remove a JSON document or delete one nested field from it. |
| `strata_vector_create_collection` | — | Use this when the user wants to add a new vector collection. |
| `strata_vector_upsert` | — | Use this when the user wants to store a vector embedding and optional metadata. |
| `strata_vector_query` | yes | Use this when the user wants nearest-neighbor vector matches. |
| `strata_event_append` | — | Use this when the user wants to record, log, or emit a single application event with a type and JSON payload. |
| `strata_event_list` | yes | Use this when the user wants to page through events, optionally filtered by event type, using a sequence cursor. |
| `strata_graph_create` | — | Use this when the user wants to create a new named graph for nodes and edges. Fails if a graph with this name already exists. |
| `strata_graph_add_node` | — | Use this when the user wants to insert or upsert a node in a graph, optionally with JSON properties, a declared object type, or a binding to a KV/JSON/vector/event entity. |
| `strata_graph_add_edge` | — | Use this when the user wants to connect two existing nodes with a directed, typed edge, optionally weighted or carrying JSON properties. |
| `strata_graph_neighbors` | yes | Use this when the user wants the nodes adjacent to a given node - who it points to, who points to it, or both - optionally filtered by edge type. |
| `strata_branch_list` | — | Use this when the user wants to see all branches in the database. |
| `strata_branch_fork` | — | Use this when the user wants to branch off the latest state of an existing branch. |
<!-- generated:end mcp-tools -->

Notes that save round trips:

- `strata_kv_put` / `strata_kv_get` take **text** keys and values and handle
  the wire's base64 encoding for you. Responses still show wire form:
  `data.value.value` is base64 (`"aGk="` is `"hi"`). Binary values go through
  `strata_command`.
- Pagination cursors are opaque base64 — pass them back verbatim, never
  decode or build one.
- `strata_branch_fork` picks its variant from the anchor: no anchor forks the
  current head; `version` or `timestamp` forks at that point; passing both is
  an error.

## The escape hatch: strata_command

`strata_command` submits one raw wire command, so the entire catalog is
reachable even though only the common tools are curated. **History
(`kv_history`, `json_history`, `vector_history`), branch create/delete,
batches, spaces, arrow import/export, graph analytics, and admin/status
(`info`) are only reachable this way** — do not conclude a capability is
missing because there is no
dedicated tool for it.

```json
{ "command": { "type": "kv_history", "key": "bm90ZXM=" } }
```

The wire speaks base64 for KV keys and values — `"bm90ZXM="` is `"notes"`.
Text convenience exists only in the curated KV tools; through
`strata_command` you encode yourself.

The full catalog with wire types and one-line summaries is in
[references/commands.md](references/commands.md). When in doubt about a
command's arguments, send a best effort — the wire deserializer names the
offending field and the valid set, and that error is the fastest
documentation.

## Inspect the database

`admin_info` — the `info` command, reachable through `strata_command` —
returns the database's identity plus what it is actually sized to run on:

```json
{ "command": { "type": "info" } }
```

The `data.memory_budget` field reports the resolved storage budget and where
it came from:

```json
{ "memory_budget": { "total_bytes": 536870912,
                     "source": "derived_from_host",
                     "usable_host_bytes": 2147483648 } }
```

When no budget is set explicitly, Strata derives one at open — 25% of usable
host memory, capped at an 8 GiB ceiling — so the same binary sizes itself
sanely on both a small edge device and a large server. `source` names the
rule that applied:

- `explicit` — a budget the caller set; `usable_host_bytes` is absent.
- `derived_from_host` — the auto-derived default; `usable_host_bytes` is the
  memory Strata detected.
- `fixed_default` — the 512 MiB fallback, used when the host memory cannot be
  probed.

If the database feels memory-starved on a constrained host, read
`memory_budget` first: it tells you whether the derivation, an explicit
override, or the probe fallback is in effect.

## Responses and errors

Success is always an envelope: `{ "type": "<result type>", "data": { … } }`.

Failure is always a structured status:

```json
{ "error": { "code": "not_found.engine.branch", "class": "not_found",
             "retryable": false, "retry_policy": "never",
             "message": "…", "suggested_fix": "…", "docs_url": "…" } }
```

The discipline: **branch on `code` (stable, `class.area.detail` format) and
the envelope fields (`retryable`, `retry_policy`, `suggested_fix`) — never on
message text.** The envelope is the recovery plan: if `retryable` is false,
change the request instead of repeating it. Every code has a reference page
at `https://stratadb.org/e/<code>`.

Codes you will actually meet:

<!-- generated:begin representative-errors -->
| Code | Meaning |
|---|---|
| `not_found.engine.branch` | the `branch` argument names a branch that does not exist — check `strata_branch_list` |
| `already_exists.engine.branch` | the branch name for a create/fork is already taken |
| `history_unavailable.engine.persistence_history` | `as_of`, history, or a fork anchor points outside retained history — pick a newer timestamp |
| `invalid_argument.engine.kv_key` | the key is invalid (for example, empty) |
| `access_denied.executor.read_only_session` | this session is read-only and the command writes — reconnect writable |
| `failed_precondition.engine.runtime_closed` | the database handle is closed or shutting down — reconnect |
<!-- generated:end representative-errors -->

The full public code registry is in
[references/errors.md](references/errors.md).

## Go deeper

- **`strata-branching`** — branch-per-agent and experiment isolation
  patterns, fork anchors, the no-merge rule.
- **`strata-time-travel`** — `as_of` reads, history commands, retention and
  `history_unavailable`.
- **`strata_guide`** (tool) — the complete, version-matched usage guide,
  including CLI and Python SDK equivalents.
