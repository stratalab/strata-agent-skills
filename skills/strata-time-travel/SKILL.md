---
name: strata-time-travel
description: >-
  Read Strata data as it was at any retained moment. Use when the user asks
  what the database looked like earlier, wants to debug or audit an agent run
  ("what did it know when it decided"), mentions as_of, history, point-in-time
  reads, version history, or rolling back agent memory. Covers where as_of
  timestamps come from (write receipts), which commands accept as_of, the
  kv/json/vector history commands, retention limits and the
  history_unavailable error, forking a branch at a past version instead of
  copying data, and event-chain verification.
license: MIT
metadata:
  strata-core-rev: "2556b6be18dd2a7c297c3d37e7831df4436c6df5"
  cli-version-range: "1.x"
---

# Strata time travel

**First:** know the basics in the `strata` skill. If it is not installed:
`npx skills add stratalab/strata-agent-skills --skill strata`.

Every commit in Strata gets a `version` and a `timestamp` on the database's
own commit clock, and both come back in every write receipt
(`data.commit.version`, `data.commit.timestamp`). Time travel is reading with
one of those timestamps: pass `as_of` to a read and it answers as the
database stood at that commit.

**Timestamps are values you were given, never values you compute.** Take
them from write receipts, history rows, or branch info — do not derive them
from wall-clock time.

## Reading the past: as_of

Any read tool or command below accepts `as_of` (a commit timestamp).
Everything not listed — scans, samples, existence checks, event ranges —
reads current state only; when you need a point-in-time scan, fork a branch
at that timestamp instead (below).

<!-- generated:begin asof-commands -->
- **event** — `event_count`, `event_get`, `event_list`, `event_list_types`
- **graph** — `graph_bfs`, `graph_cdlp`, `graph_lcc`, `graph_pagerank`, `graph_sssp`, `graph_wcc`, `graph_bindings_for_entity`, `graph_get_edge`, `graph_list`, `graph_get_meta`, `graph_neighbors`, `graph_get_node`, `graph_list_nodes`, `graph_nodes_by_type`, `graph_get_ontology`, `graph_ontology_summary`
- **json** — `json_count`, `json_get`, `json_list`
- **kv** — `kv_count`, `kv_get`, `kv_list`
- **vector** — `vector_count`, `vector_get`, `vector_index_query`, `vector_list_keys`, `vector_query`
<!-- generated:end asof-commands -->

## Reading the trail: history

<!-- generated:begin history-commands -->
| Command | Summary |
|---|---|
| [`json_history`](https://stratadb.org/docs/json/history) | Read retained version history for one JSON document. |
| [`kv_history`](https://stratadb.org/docs/kv/history) | Read retained version history for one KV key. |
| [`vector_history`](https://stratadb.org/docs/vector/history) | Read retained vector history for one key. |
<!-- generated:end history-commands -->

History returns the retained version rows for one key, newest first,
including tombstones (deletions):

```json
{ "type": "version_history",
  "data": { "items": [
    { "version": 4, "timestamp": 4, "tombstone": false, "value": "dHdv" },
    { "version": 3, "timestamp": 3, "tombstone": false, "value": "b25l" } ] } }
```

A key with no history is an ordinary miss (empty/absent result), not an
error. From MCP these commands go through `strata_command` with wire base64
keys: `{ "command": { "type": "kv_history", "key": "bm90ZXM=" } }`.

## Retention: the one error to plan for

History is retained, not infinite. Asking for a moment outside the retained
window — an old `as_of`, a pruned history row, a fork anchor too far back —
returns:

```json
{ "code": "history_unavailable.engine.persistence_history",
  "class": "history_unavailable",
  "retryable": true, "retry_policy": "after_state_change" }
```

It is **never** a `not_found`: the data existed, the retention window moved
past it. Do not retry the same request in a loop (`after_state_change` means
the answer changes only if retention state does). Recover by choosing a
newer timestamp — from history rows or a later receipt — or by falling back
to a current-state read and saying so.

## Fork the past instead of copying it

To *work* in the past rather than peek at it, fork a branch there:
`strata_branch_fork` with `version` or `timestamp` gives you a full,
writable database as of that moment — every primitive, not one key. That is
the move for "reproduce the state the agent saw", "A/B against yesterday's
data", or point-in-time scans. Patterns live in the `strata-branching`
skill.

## When time travel beats keeping copies

- **Debugging an agent run** — replay its reads with the `as_of` from its
  receipts instead of reconstructing state by hand.
- **Audit** — "what did it know when it decided": pair the decision's event
  log entry with `as_of` reads at that commit.
- **Before/after comparison** — read the same key at two timestamps; no
  snapshot files, no copies.
- **Safe rollback of agent memory** — fork at the last good timestamp and
  continue there; the bad line of history stays inspectable.

## Event-log integrity

Events are hash-chained per branch. `event_verify_chain` (via
`strata_command`) checks density and hash linkage — use it when an audit
trail must be shown intact, not just present.
