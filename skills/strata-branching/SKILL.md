---
name: strata-branching
description: >-
  Create and manage Strata branches for isolated agent work. Use when running
  multiple agents or experiments against one Strata database, when the user
  asks for a sandbox, scratch copy, or safe place to try changes without
  touching real state, or mentions strata_branch_fork, branch-per-agent,
  forking a database at a version or timestamp, or merging a branch back
  (branch_diff, branch_preview, branch_merge). Covers empty branches vs
  forks, fork anchors (head, version, timestamp), isolation guarantees (no
  cross-branch references), compare → preview → promote with the strict and
  source_wins strategies, what merges (KV, JSON, vectors) and what is
  compare-only (events, graphs), branch naming rules, and the branch error
  codes.
license: MIT
metadata:
  strata-core-rev: "dc825d9ba98b1285563870b1b697b21667bd3fba"
  cli-version-range: "1.x"
---

# Strata branching

**First:** know the basics in the `strata` skill. If it is not installed:
`npx skills add stratalab/strata-agent-skills --skill strata`.

A branch is an isolated line of history over the whole database — all five
primitives, all spaces. Branches are cheap: forking copies history claims,
not data. The default branch is named `default` (not `main`).

## The rules that shape every workflow

1. **Branches are fully isolated.** Writes on one branch are invisible to
   every other. Cross-branch references are rejected by design — you cannot
   point a graph edge or any other record at another branch's data.
2. **Bringing work back is compare → preview → promote.** `branch_diff`
   reports what differs between two branches; `branch_preview` reports the
   conflicts a promotion would hit without touching either branch;
   `branch_merge` promotes the source's changes into the target as one atomic
   commit and leaves the source unchanged. Key-value, JSON, and vector data
   merge; event streams and graphs are compared but never merged (append-only
   and structural data do not three-way merge) — carry those over yourself if
   you need them. There is no revert or cherry-pick; never assume git
   semantics beyond this.
3. **A new branch is empty or a fork.** `branch_create` makes an empty root
   branch sharing no history. Forks start from a source branch at its head, a
   version, or a timestamp.
4. **The `default` branch cannot be deleted.**

## Patterns

- **Branch-per-agent.** Give each concurrent agent its own fork; their writes
  cannot collide or leak. Afterwards `branch_preview` each fork against the
  main line and `branch_merge` the ones you keep; delete the rest.
- **Experiment, then promote or delete.** Fork, try the risky change,
  evaluate. Promote it with `branch_merge` — or delete the branch and nothing
  happened. This replaces backup-and-restore.
- **Fork the past for debugging.** `strata_branch_fork` with a `timestamp`
  from an earlier receipt reproduces the database exactly as the agent saw it
  then — see the `strata-time-travel` skill for where timestamps come from.
- **Empty branch as scratch space.** `branch_create` (via `strata_command`)
  gives a blank, isolated database inside the same store — useful for staging
  imports or tests that must start clean.

## Mechanics

<!-- generated:begin branch-commands -->
| Command | Via MCP | Summary |
|---|---|---|
| [`branch_create`](https://stratadb.org/docs/branch/create) | `strata_command` | Create a new empty root branch. |
| [`branch_delete`](https://stratadb.org/docs/branch/delete) | `strata_command` | Delete an active branch and release its storage claims. |
| [`branch_diff`](https://stratadb.org/docs/branch/diff) | `strata_command` | Compare two branches and report the entities that differ across every primitive. |
| [`branch_fork_current`](https://stratadb.org/docs/branch/fork) | `strata_branch_fork` | Fork a new branch from the current head of a source branch. |
| [`branch_fork_at_timestamp`](https://stratadb.org/docs/branch/fork_at_timestamp) | `strata_branch_fork` (`timestamp`) | Fork a new branch from a retained source timestamp. |
| [`branch_fork_at_version`](https://stratadb.org/docs/branch/fork_at_version) | `strata_branch_fork` (`version`) | Fork a new branch from a retained source commit version. |
| [`branch_get`](https://stratadb.org/docs/branch/get) | `strata_command` | Read one branch summary by name. |
| [`branch_list`](https://stratadb.org/docs/branch/list) | `strata_branch_list` | List active branches with their lineage facts. |
| [`branch_merge`](https://stratadb.org/docs/branch/merge) | `strata_command` | Promote one branch's changes into another as a single atomic commit. |
| [`branch_preview`](https://stratadb.org/docs/branch/preview) | `strata_command` | Preview promoting one branch into another, reporting conflicts without mutating either branch. |
<!-- generated:end branch-commands -->

`strata_branch_fork` selects the wire variant from its anchor arguments: no
anchor forks the source's current head; `version` forks at that commit
version; `timestamp` forks at that commit timestamp; passing both is an
input error. Fork anchors must lie within retained history — outside it you
get `history_unavailable.engine.persistence_history` (see
`strata-time-travel`).

Branch names are validated (`invalid_argument.engine.branch_name`); stick to
short lowercase ASCII names like `agent-7` or `exp-cache` unless told
otherwise.

## Promoting a branch

`branch_diff`, `branch_preview`, and `branch_merge` have no dedicated MCP
tools; send them through `strata_command`:

```json
{ "type": "branch_diff", "branch_a": "default", "branch_b": "agent-7" }
{ "type": "branch_preview", "source": "agent-7", "target": "default", "strategy": "strict" }
{ "type": "branch_merge", "source": "agent-7", "target": "default", "strategy": "strict" }
```

- **Diff is directional, A → B.** `added` entries exist only on B, `removed`
  only on A, `modified` on both with different values — grouped per space and
  capability (`key_value`, `json`, `vector`, `vector_collection`, `event`,
  `graph_metadata`, `graph_node`, `graph_edge`, `graph_ontology`). Pass
  `at_timestamp` to compare both branches as of a past commit.
- **Preview and merge need shared fork lineage.** The branch point comes from
  the recorded fork, so promote a fork into the branch it came from. Branches
  with no shared lineage — a `branch_create` root, for instance — are rejected
  with `invalid_argument.engine.branch_point`.
- **`strict` (the default) refuses on any conflict** with
  `conflict.engine.promotion` and mutates nothing. `source_wins` applies the
  source's value or tombstone for each conflict and reports every overwritten
  or deleted target entry. Preview first when the outcome matters: an empty
  `conflicts` list means a `strict` promotion will apply.
- **The result says what was skipped.** `capabilities_unsupported` lists the
  compare-only capabilities; a promotion that applies nothing writes no commit
  (`target_version` is null). The target's `branch_get` afterwards carries
  `merge_parent` — the promotion lineage.

## Errors

<!-- generated:begin branch-errors -->
- [`already_exists.engine.branch`](https://stratadb.org/e/already_exists.engine.branch)
- [`conflict.engine.promotion`](https://stratadb.org/e/conflict.engine.promotion)
- [`failed_precondition.engine.runtime_closed`](https://stratadb.org/e/failed_precondition.engine.runtime_closed)
- [`history_unavailable.engine.persistence_history`](https://stratadb.org/e/history_unavailable.engine.persistence_history)
- [`invalid_argument.engine.branch_delete`](https://stratadb.org/e/invalid_argument.engine.branch_delete)
- [`invalid_argument.engine.branch_name`](https://stratadb.org/e/invalid_argument.engine.branch_name)
- [`invalid_argument.engine.branch_name_reserved`](https://stratadb.org/e/invalid_argument.engine.branch_name_reserved)
- [`invalid_argument.engine.branch_point`](https://stratadb.org/e/invalid_argument.engine.branch_point)
- [`not_found.engine.branch`](https://stratadb.org/e/not_found.engine.branch)
<!-- generated:end branch-errors -->

Four to handle deliberately:

- `already_exists.engine.branch` — the name is taken. In idempotent setup,
  treat as success only after confirming (`branch_get`) it is the branch you
  meant.
- `not_found.engine.branch` — any command can return it when its `branch`
  argument names a branch that does not exist; check spelling against
  `strata_branch_list` before creating.
- `conflict.engine.promotion` — a `strict` promotion hit a conflict and
  changed nothing. `branch_preview` shows the entries; resolve them on the
  source branch and retry, or promote with `source_wins` deliberately.
- `invalid_argument.engine.branch_point` — the two branches share no fork
  lineage. Only forks can be promoted into the branch they came from; a
  `branch_create` root cannot be merged anywhere.
