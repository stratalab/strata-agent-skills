---
name: strata-branching
description: >-
  Create and manage Strata branches for isolated agent work. Use when running
  multiple agents or experiments against one Strata database, when the user
  asks for a sandbox, scratch copy, or safe place to try changes without
  touching real state, or mentions strata_branch_fork, branch-per-agent, or
  forking a database at a version or timestamp. Covers empty branches vs
  forks, fork anchors (head, version, timestamp), isolation guarantees (no
  cross-branch references, no merge in V1 — keep the fork or delete it),
  branch naming rules, and the branch error codes.
license: MIT
metadata:
  strata-core-rev: "2556b6be18dd2a7c297c3d37e7831df4436c6df5"
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
2. **There is no merge in V1.** No merge, revert, or cherry-pick. Work on a
   fork is either kept by continuing on that branch, promoted by re-applying
   the writes yourself (or via arrow export/import), or discarded by deleting
   the branch. Never assume git semantics.
3. **A new branch is empty or a fork.** `branch_create` makes an empty root
   branch sharing no history. Forks start from a source branch at its head, a
   version, or a timestamp.
4. **The `default` branch cannot be deleted.**

## Patterns

- **Branch-per-agent.** Give each concurrent agent its own fork; their writes
  cannot collide or leak. Read results from each branch afterwards and apply
  what you keep to the main line.
- **Experiment, then keep or delete.** Fork, try the risky change, evaluate.
  Keeping the branch *is* keeping the work — or delete it and nothing
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
| [`branch_fork_current`](https://stratadb.org/docs/branch/fork) | `strata_branch_fork` | Fork a new branch from the current head of a source branch. |
| [`branch_fork_at_timestamp`](https://stratadb.org/docs/branch/fork_at_timestamp) | `strata_branch_fork` (`timestamp`) | Fork a new branch from a retained source timestamp. |
| [`branch_fork_at_version`](https://stratadb.org/docs/branch/fork_at_version) | `strata_branch_fork` (`version`) | Fork a new branch from a retained source commit version. |
| [`branch_get`](https://stratadb.org/docs/branch/get) | `strata_command` | Read one branch summary by name. |
| [`branch_list`](https://stratadb.org/docs/branch/list) | `strata_branch_list` | List active branches with their lineage facts. |
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

## Errors

<!-- generated:begin branch-errors -->
- [`already_exists.engine.branch`](https://stratadb.org/e/already_exists.engine.branch)
- [`failed_precondition.engine.runtime_closed`](https://stratadb.org/e/failed_precondition.engine.runtime_closed)
- [`history_unavailable.engine.persistence_history`](https://stratadb.org/e/history_unavailable.engine.persistence_history)
- [`invalid_argument.engine.branch_delete`](https://stratadb.org/e/invalid_argument.engine.branch_delete)
- [`invalid_argument.engine.branch_name`](https://stratadb.org/e/invalid_argument.engine.branch_name)
- [`invalid_argument.engine.branch_name_reserved`](https://stratadb.org/e/invalid_argument.engine.branch_name_reserved)
- [`not_found.engine.branch`](https://stratadb.org/e/not_found.engine.branch)
<!-- generated:end branch-errors -->

Two to handle deliberately:

- `already_exists.engine.branch` — the name is taken. In idempotent setup,
  treat as success only after confirming (`branch_get`) it is the branch you
  meant.
- `not_found.engine.branch` — any command can return it when its `branch`
  argument names a branch that does not exist; check spelling against
  `strata_branch_list` before creating.
