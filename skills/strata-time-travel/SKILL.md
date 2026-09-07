---
name: strata-time-travel
description: >-
  Read Strata data as it was at any retained moment. Use when the user asks
  what the database looked like earlier, wants to debug or audit an agent run
  ("what did it know when it decided"), mentions as_of, as_of_time,
  committed_at, history, point-in-time reads, "what was this yesterday",
  version history, or rolling back agent memory. Covers Strata's two clocks —
  the logical commit timeline (as_of) and real wall-clock time (as_of_time,
  committed_at) — where each value comes from, which commands accept them, the
  kv/json/vector history commands, retention limits and the
  history_unavailable error, forking a branch at a past version instead of
  copying data, and event-chain verification.
license: MIT
metadata:
  strata-core-rev: "acff6cb416d3e4320ee4fd3e509e5929c715ff90"
  cli-version-range: "1.x"
---

# Strata time travel

**First:** know the basics in the `strata` skill. If it is not installed:
`npx skills add stratalab/strata-agent-skills --skill strata`.

Strata keeps **two clocks**, and picking the wrong one is the mistake this
skill exists to prevent.

| | What it is | Read it back with | Where the value comes from |
|---|---|---|---|
| `version` / `timestamp` | a position on the database's own commit timeline — a counter that starts near 1, **never** a date | `as_of` | write receipts (`data.commit.timestamp`), history rows, branch info — values you were **given** |
| `committed_at` | the real UTC instant the commit was applied, in epoch microseconds | `as_of_time` | the same receipts and history rows — or a clock, a date, anything you **compute** |

Both arrive in every write receipt:

```json
{ "commit": { "version": 3, "timestamp": 3, "committed_at": 1788756763672897 } }
```

Use `as_of` when you want **exactly this commit** — reproducing a run,
paginating stably, comparing two known points. Use `as_of_time` when the
question is about **real time** — "what did this look like yesterday", "what
did the agent see at 14:05". Supplying both in one call is
`invalid_argument.executor.as_of_conflict`.

`committed_at` is `null` for commits written before engine 1.2.1 and for
commits replayed from an artifact import: those exist on the commit timeline
but carry no instant, so only `as_of` can reach them.

## Reading the past: as_of and as_of_time

Any read tool or command below accepts both clocks. Everything not listed —
scans, samples, existence checks, event ranges — reads current state only;
when you need a point-in-time scan, fork a branch at that timestamp instead
(below).

**Through MCP, the curated tools take `as_of` only.** A wall-clock read goes
through `strata_command` with the raw wire command:

```json
{ "command": { "type": "kv_get", "key": "bm90ZXM=", "as_of_time": 1788756763672897 } }
```

<!-- generated:begin asof-commands -->
- **event** — `event_count`, `event_get`, `event_list`, `event_list_types`
- **graph** — `graph_bfs`, `graph_cdlp`, `graph_lcc`, `graph_pagerank`, `graph_sssp`, `graph_wcc`, `graph_bindings_for_entity`, `graph_get_edge`, `graph_list`, `graph_get_meta`, `graph_neighbors`, `graph_get_node`, `graph_list_nodes`, `graph_nodes_by_type`, `graph_get_ontology`, `graph_ontology_summary`
- **json** — `json_count`, `json_get`, `json_list`
- **kv** — `kv_count`, `kv_get`, `kv_list`
- **vector** — `vector_count`, `vector_get`, `vector_index_query`, `vector_list_keys`, `vector_query`

All 31 accept **both** `as_of` (commit timeline) and `as_of_time` (wall clock) — one or the other, never both in one call.
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
    { "version": 4, "timestamp": 4, "tombstone": false, "value": "dHdv",
      "committed_at": 1788756763672897 },
    { "version": 3, "timestamp": 3, "tombstone": false, "value": "b25l",
      "committed_at": 1788756701004512 } ] } }
```

`committed_at` is what you show a human ("changed 2026-09-06 14:05"); the
`timestamp` beside it is what you send back to `as_of`.

A key with no history is an ordinary miss (empty/absent result), not an
error. From MCP these commands go through `strata_command` with wire base64
keys: `{ "command": { "type": "kv_history", "key": "bm90ZXM=" } }`.

## Retention and the dated window: the one error to plan for

History is retained, not infinite, and the wall clock reaches a narrower
window still. Asking for a moment outside either — an old `as_of`, a pruned
history row, a fork anchor too far back, or an `as_of_time` outside the
branch's dated history — returns:

```json
{ "code": "history_unavailable.engine.persistence_history",
  "class": "history_unavailable",
  "retryable": true, "retry_policy": "after_state_change" }
```

It is **never** a `not_found`: the data existed, the window moved past it. Do
not retry the same request in a loop (`after_state_change` means the answer
changes only if retention state does). Recover by choosing a newer timestamp —
from history rows or a later receipt — or by falling back to a current-state
read and saying so.

**`as_of_time` does not clamp, at either end.** This is the trap:

```
as_of_time = <now>                  ->  history_unavailable  (now is past the newest commit)
as_of_time = <yesterday>            ->  history_unavailable  on a database created today
as_of_time = <a committed_at>       ->  that commit
as_of_time = <between two commits>  ->  the older one
```

Two consequences worth internalizing before you write the call:

1. **"Latest" is not a time — it is the absence of one.** To read current
   state, send neither clock. Never reach for `as_of_time: now`.
2. **The dated window is only as wide as the database's own history.** A store
   created an hour ago cannot answer "yesterday", and commits written before
   engine 1.2.1 have no instant at all. When a wall-clock question falls
   outside, say so and offer the nearest `committed_at` you can see in
   history — do not silently answer with current state.

## Fork the past instead of copying it

To *work* in the past rather than peek at it, fork a branch there:
`strata_branch_fork` with `version` or `timestamp` gives you a full,
writable database as of that moment — every primitive, not one key. Its
`timestamp` anchor is a **commit** timestamp, not a wall-clock instant: fork
anchors take the first clock only, so resolve a real time to a commit first
(read `history` and pick the row whose `committed_at` you want). That is
the move for "reproduce the state the agent saw", "A/B against yesterday's
data", or point-in-time scans. Patterns live in the `strata-branching`
skill.

## When time travel beats keeping copies

- **Debugging an agent run** — replay its reads with the `as_of` from its
  receipts instead of reconstructing state by hand.
- **Audit** — "what did it know when it decided": pair the decision's event
  log entry with `as_of` reads at that commit. When the question arrives in
  human time ("what did it know at 14:05?"), that is `as_of_time` — and the
  answer you show alongside it is the row's `committed_at`, not `timestamp`.
- **Before/after comparison** — read the same key at two timestamps; no
  snapshot files, no copies.
- **Safe rollback of agent memory** — fork at the last good timestamp and
  continue there; the bad line of history stays inspectable.

## Event-log integrity

Events are hash-chained per branch. `event_verify_chain` (via
`strata_command`) checks density and hash linkage — use it when an audit
trail must be shown intact, not just present.
