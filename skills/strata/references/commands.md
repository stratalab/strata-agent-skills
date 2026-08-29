# Strata command catalog

Every command the engine speaks, by family. Run any of them from MCP with
`strata_command`: `{ "command": { "type": "<wire type>", … } }` — KV keys and
values are base64 on the wire. Each wire type links to its reference page
(append `.md` to any page URL for raw Markdown). This file is generated from
the Strata IDL at the rev pinned in this skill's frontmatter.

<!-- generated:begin command-catalog -->
## admin (11 commands)
| Command | Access | Summary |
|---|---|---|
| [`config_get`](https://stratadb.org/docs/admin/config) | read | Read sanitized configuration facts. |
| [`configure_get_key`](https://stratadb.org/docs/admin/config_key) | read | Read one sanitized configuration value by key. |
| [`describe`](https://stratadb.org/docs/admin/describe) | read | Read a compact description of the database. |
| [`health`](https://stratadb.org/docs/admin/health) | read | Read control-plane health facts. |
| [`hub_clone`](https://stratadb.org/docs/admin/hub_clone) | write | Clone a dataset from a hub into a new local database. |
| [`info`](https://stratadb.org/docs/admin/info) | read | Read database identity and a catalog summary. |
| [`ipc_status`](https://stratadb.org/docs/admin/ipc_status) | read | Report this process's multi-process IPC state. |
| [`ipc_stop`](https://stratadb.org/docs/admin/ipc_stop) | write | Stop hosting the multi-process broker socket. |
| [`metrics`](https://stratadb.org/docs/admin/metrics) | read | Read lightweight database metrics. |
| [`ping`](https://stratadb.org/docs/admin/ping) | read | Check that the database handle is live. |
| [`remote_get`](https://stratadb.org/docs/admin/remote) | read | Read where this database was cloned from. |

## arrow (2 commands)
| Command | Access | Summary |
|---|---|---|
| [`arrow_export`](https://stratadb.org/docs/arrow/export) | read | Export a product primitive to an Arrow-compatible file. |
| [`arrow_import`](https://stratadb.org/docs/arrow/import) | write | Import an Arrow-compatible file into a product primitive. |

## branch (10 commands)
| Command | Access | Summary |
|---|---|---|
| [`branch_create`](https://stratadb.org/docs/branch/create) | write | Create a new empty root branch. |
| [`branch_delete`](https://stratadb.org/docs/branch/delete) | write | Delete an active branch and release its storage claims. |
| [`branch_diff`](https://stratadb.org/docs/branch/diff) | read | Compare two branches and report the entities that differ across every primitive. |
| [`branch_fork_current`](https://stratadb.org/docs/branch/fork) | write | Fork a new branch from the current head of a source branch. |
| [`branch_fork_at_timestamp`](https://stratadb.org/docs/branch/fork_at_timestamp) | write | Fork a new branch from a retained source timestamp. |
| [`branch_fork_at_version`](https://stratadb.org/docs/branch/fork_at_version) | write | Fork a new branch from a retained source commit version. |
| [`branch_get`](https://stratadb.org/docs/branch/get) | read | Read one branch summary by name. |
| [`branch_list`](https://stratadb.org/docs/branch/list) | read | List active branches with their lineage facts. |
| [`branch_merge`](https://stratadb.org/docs/branch/merge) | write | Promote one branch's changes into another as a single atomic commit. |
| [`branch_preview`](https://stratadb.org/docs/branch/preview) | read | Preview promoting one branch into another, reporting conflicts without mutating either branch. |

## event (10 commands)
| Command | Access | Summary |
|---|---|---|
| [`event_append`](https://stratadb.org/docs/event/append) | write | Append one event to the branch event log. |
| [`event_batch_append`](https://stratadb.org/docs/event/batch_append) | write | Append multiple events in one commit. |
| [`event_count`](https://stratadb.org/docs/event/count) | read | Count visible events in the log. |
| [`event_exists`](https://stratadb.org/docs/event/exists) | read | Check whether an event sequence exists. |
| [`event_get`](https://stratadb.org/docs/event/get) | read | Read one event by sequence number. |
| [`event_list`](https://stratadb.org/docs/event/list) | read | List events with optional type filter and cursor. |
| [`event_range`](https://stratadb.org/docs/event/range) | read | Read a range of events by sequence number. |
| [`event_range_by_time`](https://stratadb.org/docs/event/range_time) | read | Read a range of events by occurrence time. |
| [`event_list_types`](https://stratadb.org/docs/event/types) | read | List distinct event types in the log. |
| [`event_verify_chain`](https://stratadb.org/docs/event/verify_chain) | read | Verify event log density and hash linkage. |

## graph (31 commands)
| Command | Access | Summary |
|---|---|---|
| [`graph_bfs`](https://stratadb.org/docs/graph/analytics/bfs) | read | Run a bounded breadth-first traversal. |
| [`graph_cdlp`](https://stratadb.org/docs/graph/analytics/cdlp) | read | Detect communities via label propagation. |
| [`graph_lcc`](https://stratadb.org/docs/graph/analytics/lcc) | read | Compute local clustering coefficients. |
| [`graph_pagerank`](https://stratadb.org/docs/graph/analytics/pagerank) | read | Compute PageRank importance scores. |
| [`graph_sssp`](https://stratadb.org/docs/graph/analytics/sssp) | read | Compute shortest-path distances from a source. |
| [`graph_wcc`](https://stratadb.org/docs/graph/analytics/wcc) | read | Compute weakly connected components. |
| [`graph_apply_delete_policy`](https://stratadb.org/docs/graph/apply_delete_policy) | write | Apply a delete policy to bound graph facts. |
| [`graph_batch_write`](https://stratadb.org/docs/graph/batch_write) | write | Apply graph mutations atomically. |
| [`graph_bindings_for_entity`](https://stratadb.org/docs/graph/bindings) | read | Find graph nodes bound to an entity. |
| [`graph_bulk_insert`](https://stratadb.org/docs/graph/bulk_insert) | write | Bulk-load nodes and edges in chunks. |
| [`graph_create`](https://stratadb.org/docs/graph/create) | write | Create a named graph. |
| [`graph_delete`](https://stratadb.org/docs/graph/delete) | write | Delete a graph and its visible data. |
| [`graph_add_edge`](https://stratadb.org/docs/graph/edge/add) | write | Add or replace a graph edge. |
| [`graph_get_edge`](https://stratadb.org/docs/graph/edge/get) | read | Read one graph edge. |
| [`graph_remove_edge`](https://stratadb.org/docs/graph/edge/remove) | write | Remove a graph edge. |
| [`graph_list`](https://stratadb.org/docs/graph/list) | read | List graph names. |
| [`graph_get_meta`](https://stratadb.org/docs/graph/meta) | read | Read graph metadata and counts. |
| [`graph_neighbors`](https://stratadb.org/docs/graph/neighbors) | read | List a node's neighbors. |
| [`graph_add_node`](https://stratadb.org/docs/graph/node/add) | write | Add or replace a graph node. |
| [`graph_get_node`](https://stratadb.org/docs/graph/node/get) | read | Read one graph node. |
| [`graph_list_nodes`](https://stratadb.org/docs/graph/node/list) | read | List graph nodes. |
| [`graph_remove_node`](https://stratadb.org/docs/graph/node/remove) | write | Remove a graph node and its edges. |
| [`graph_nodes_by_type`](https://stratadb.org/docs/graph/nodes_by_type) | read | List nodes declaring an object type. |
| [`graph_define_link_type`](https://stratadb.org/docs/graph/ontology/define_link_type) | write | Define a graph link type. |
| [`graph_define_object_type`](https://stratadb.org/docs/graph/ontology/define_object_type) | write | Define a graph object type. |
| [`graph_delete_link_type`](https://stratadb.org/docs/graph/ontology/delete_link_type) | write | Delete a draft link type. |
| [`graph_delete_object_type`](https://stratadb.org/docs/graph/ontology/delete_object_type) | write | Delete a draft object type. |
| [`graph_freeze_ontology`](https://stratadb.org/docs/graph/ontology/freeze) | write | Freeze the graph ontology. |
| [`graph_get_ontology`](https://stratadb.org/docs/graph/ontology/get) | read | Read the graph ontology. |
| [`graph_ontology_summary`](https://stratadb.org/docs/graph/ontology/summary) | read | Read the ontology with usage counts. |
| [`graph_sample`](https://stratadb.org/docs/graph/sample) | read | Sample graph nodes. |

## inference (11 commands)
| Command | Access | Summary |
|---|---|---|
| [`inference_cache_status`](https://stratadb.org/docs/inference/cache_status) | read | Report loaded model cache state. |
| [`inference_model_capability`](https://stratadb.org/docs/inference/capability) | read | Report capabilities for a model spec. |
| [`inference_detokenize`](https://stratadb.org/docs/inference/detokenize) | read | Detokenize token ids with a local model. |
| [`inference_embed`](https://stratadb.org/docs/inference/embed) | read | Embed one or more texts into vectors. |
| [`inference_generate`](https://stratadb.org/docs/inference/generate) | read | Generate text with an inference model. |
| [`inference_models_list`](https://stratadb.org/docs/inference/models/list) | read | List catalog inference models. |
| [`inference_models_local`](https://stratadb.org/docs/inference/models/local) | read | List locally downloaded inference models. |
| [`inference_models_pull`](https://stratadb.org/docs/inference/models/pull) | read | Download an inference model locally. |
| [`inference_rank`](https://stratadb.org/docs/inference/rank) | read | Rank passages against a query. |
| [`inference_tokenize`](https://stratadb.org/docs/inference/tokenize) | read | Tokenize text with a local model. |
| [`inference_unload`](https://stratadb.org/docs/inference/unload) | read | Unload cached inference models. |

## json (16 commands)
| Command | Access | Summary |
|---|---|---|
| [`json_batch_delete`](https://stratadb.org/docs/json/batch_delete) | write | Delete multiple JSON documents or paths in one itemwise batch. |
| [`json_batch_exists`](https://stratadb.org/docs/json/batch_exists) | read | Check existence for multiple JSON documents. |
| [`json_batch_get`](https://stratadb.org/docs/json/batch_get) | read | Read multiple JSON values by document and path. |
| [`json_batch_set`](https://stratadb.org/docs/json/batch_set) | write | Set multiple JSON values in one itemwise batch. |
| [`json_count`](https://stratadb.org/docs/json/count) | read | Count visible JSON documents. |
| [`json_delete`](https://stratadb.org/docs/json/delete) | write | Delete a whole JSON document or one path inside it. |
| [`json_exists`](https://stratadb.org/docs/json/exists) | read | Check whether one JSON document exists. |
| [`json_get`](https://stratadb.org/docs/json/get) | read | Read the current or historical JSON value at a document path. |
| [`json_history`](https://stratadb.org/docs/json/history) | read | Read retained version history for one JSON document. |
| [`json_create_index`](https://stratadb.org/docs/json/index/create) | write | Create a JSON secondary index on a field path. |
| [`json_drop_index`](https://stratadb.org/docs/json/index/drop) | write | Drop a JSON secondary index by name. |
| [`json_list_indexes`](https://stratadb.org/docs/json/index/list) | read | List JSON secondary indexes. |
| [`json_list`](https://stratadb.org/docs/json/list) | read | List JSON document keys with optional prefix filtering. |
| [`json_sample`](https://stratadb.org/docs/json/sample) | read | Sample visible JSON documents. |
| [`json_scan`](https://stratadb.org/docs/json/scan) | read | Scan JSON documents with values and version facts. |
| [`json_set`](https://stratadb.org/docs/json/set) | write | Set a JSON value at a document path, creating the document when missing. |

## kv (13 commands)
| Command | Access | Summary |
|---|---|---|
| [`kv_batch_delete`](https://stratadb.org/docs/kv/batch_delete) | write | Delete multiple KV keys in one itemwise batch. |
| [`kv_batch_exists`](https://stratadb.org/docs/kv/batch_exists) | read | Check existence for multiple KV keys. |
| [`kv_batch_get`](https://stratadb.org/docs/kv/batch_get) | read | Read multiple KV values by key. |
| [`kv_batch_put`](https://stratadb.org/docs/kv/batch_put) | write | Store multiple KV values in one itemwise batch. |
| [`kv_count`](https://stratadb.org/docs/kv/count) | read | Count visible KV keys. |
| [`kv_delete`](https://stratadb.org/docs/kv/delete) | write | Delete one visible KV key. |
| [`kv_exists`](https://stratadb.org/docs/kv/exists) | read | Check whether one KV key exists. |
| [`kv_get`](https://stratadb.org/docs/kv/get) | read | Read the current or historical value for one KV key. |
| [`kv_history`](https://stratadb.org/docs/kv/history) | read | Read retained version history for one KV key. |
| [`kv_list`](https://stratadb.org/docs/kv/list) | read | List KV keys with optional prefix filtering. |
| [`kv_put`](https://stratadb.org/docs/kv/put) | write | Store or replace a KV value by key. |
| [`kv_sample`](https://stratadb.org/docs/kv/sample) | read | Sample visible KV rows. |
| [`kv_scan`](https://stratadb.org/docs/kv/scan) | read | Scan KV rows with values and version facts. |

## space (4 commands)
| Command | Access | Summary |
|---|---|---|
| [`space_create`](https://stratadb.org/docs/space/create) | write | Create a product space on a branch. |
| [`space_delete`](https://stratadb.org/docs/space/delete) | write | Delete a product space from a branch. |
| [`space_exists`](https://stratadb.org/docs/space/exists) | read | Check whether a product space exists on a branch. |
| [`space_list`](https://stratadb.org/docs/space/list) | read | List product spaces on a branch. |

## vector (22 commands)
| Command | Access | Summary |
|---|---|---|
| [`vector_batch_delete`](https://stratadb.org/docs/vector/batch_delete) | write | Delete multiple vectors by key. |
| [`vector_batch_exists`](https://stratadb.org/docs/vector/batch_exists) | read | Check existence for multiple vector keys. |
| [`vector_batch_get`](https://stratadb.org/docs/vector/batch_get) | read | Read multiple vectors by key. |
| [`vector_batch_upsert`](https://stratadb.org/docs/vector/batch_upsert) | write | Upsert multiple vectors in one itemwise batch. |
| [`vector_create_collection`](https://stratadb.org/docs/vector/collection/create) | write | Create a vector collection with a dimension and metric. |
| [`vector_delete_collection`](https://stratadb.org/docs/vector/collection/delete) | write | Delete a vector collection. |
| [`vector_list_collections`](https://stratadb.org/docs/vector/collection/list) | read | List vector collections. |
| [`vector_collection_stats`](https://stratadb.org/docs/vector/collection/stats) | read | Read facts for one vector collection. |
| [`vector_count`](https://stratadb.org/docs/vector/count) | read | Count visible vectors in a collection. |
| [`vector_delete`](https://stratadb.org/docs/vector/delete) | write | Delete one vector key. |
| [`vector_delete_all`](https://stratadb.org/docs/vector/delete_all) | write | Delete all vectors in a collection. |
| [`vector_delete_by_filter`](https://stratadb.org/docs/vector/delete_by_filter) | write | Delete vectors matching a metadata filter. |
| [`vector_exists`](https://stratadb.org/docs/vector/exists) | read | Check whether one vector key exists. |
| [`vector_get`](https://stratadb.org/docs/vector/get) | read | Read one vector by key. |
| [`vector_history`](https://stratadb.org/docs/vector/history) | read | Read retained vector history for one key. |
| [`vector_index_query`](https://stratadb.org/docs/vector/index/query) | read | Search vectors and return index diagnostics. |
| [`vector_list_keys`](https://stratadb.org/docs/vector/keys) | read | List vector keys in a collection. |
| [`vector_update_metadata`](https://stratadb.org/docs/vector/metadata/update) | write | Patch metadata for one vector. |
| [`vector_query`](https://stratadb.org/docs/vector/query) | read | Search a vector collection. |
| [`vector_sample`](https://stratadb.org/docs/vector/sample) | read | Sample vectors with values and version facts. |
| [`vector_scan`](https://stratadb.org/docs/vector/scan) | read | Scan vectors with values and version facts. |
| [`vector_upsert`](https://stratadb.org/docs/vector/upsert) | write | Insert or replace one vector. |
<!-- generated:end command-catalog -->
