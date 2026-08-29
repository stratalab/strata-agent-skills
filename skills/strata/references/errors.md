# Strata public error codes

Every public error code, grouped by class. Codes are stable
`class.area.detail` identifiers — branch on them and on the envelope's
`retryable` / `retry_policy` / `suggested_fix` fields, never on message
text. Each code has a reference page at `https://stratadb.org/e/<code>`.
This file is generated from the Strata IDL at the rev pinned in this
skill's frontmatter.

<!-- generated:begin error-catalog -->
## access_denied
- [`access_denied.executor.read_only_session`](https://stratadb.org/e/access_denied.executor.read_only_session)

## already_exists
- [`already_exists.engine.branch`](https://stratadb.org/e/already_exists.engine.branch)
- [`already_exists.engine.graph`](https://stratadb.org/e/already_exists.engine.graph)
- [`already_exists.engine.json_index`](https://stratadb.org/e/already_exists.engine.json_index)

## conflict
- [`conflict.engine.promotion`](https://stratadb.org/e/conflict.engine.promotion)

## failed_precondition
- [`failed_precondition.engine.graph_negative_weight`](https://stratadb.org/e/failed_precondition.engine.graph_negative_weight)
- [`failed_precondition.engine.graph_ontology_edge_type`](https://stratadb.org/e/failed_precondition.engine.graph_ontology_edge_type)
- [`failed_precondition.engine.graph_ontology_endpoint_type`](https://stratadb.org/e/failed_precondition.engine.graph_ontology_endpoint_type)
- [`failed_precondition.engine.graph_ontology_freeze`](https://stratadb.org/e/failed_precondition.engine.graph_ontology_freeze)
- [`failed_precondition.engine.graph_ontology_frozen`](https://stratadb.org/e/failed_precondition.engine.graph_ontology_frozen)
- [`failed_precondition.engine.graph_ontology_node_type`](https://stratadb.org/e/failed_precondition.engine.graph_ontology_node_type)
- [`failed_precondition.engine.graph_ontology_required_property`](https://stratadb.org/e/failed_precondition.engine.graph_ontology_required_property)
- [`failed_precondition.engine.runtime_closed`](https://stratadb.org/e/failed_precondition.engine.runtime_closed)
- [`failed_precondition.engine.space_not_empty`](https://stratadb.org/e/failed_precondition.engine.space_not_empty)
- [`failed_precondition.executor.hub_clone`](https://stratadb.org/e/failed_precondition.executor.hub_clone)

## history_unavailable
- [`history_unavailable.engine.persistence_history`](https://stratadb.org/e/history_unavailable.engine.persistence_history)

## inference
- [`inference.download_disabled`](https://stratadb.org/e/inference.download_disabled)
- [`inference.download_failed`](https://stratadb.org/e/inference.download_failed)
- [`inference.download_verification_failed`](https://stratadb.org/e/inference.download_verification_failed)
- [`inference.invalid_request`](https://stratadb.org/e/inference.invalid_request)
- [`inference.io_failure`](https://stratadb.org/e/inference.io_failure)
- [`inference.local_runtime_failed`](https://stratadb.org/e/inference.local_runtime_failed)
- [`inference.missing_api_key`](https://stratadb.org/e/inference.missing_api_key)
- [`inference.missing_model`](https://stratadb.org/e/inference.missing_model)
- [`inference.model_load_failed`](https://stratadb.org/e/inference.model_load_failed)
- [`inference.provider_auth_failed`](https://stratadb.org/e/inference.provider_auth_failed)
- [`inference.provider_malformed_response`](https://stratadb.org/e/inference.provider_malformed_response)
- [`inference.provider_rate_limited`](https://stratadb.org/e/inference.provider_rate_limited)
- [`inference.provider_timeout`](https://stratadb.org/e/inference.provider_timeout)
- [`inference.provider_unavailable`](https://stratadb.org/e/inference.provider_unavailable)
- [`inference.registry_corrupt`](https://stratadb.org/e/inference.registry_corrupt)
- [`inference.unsupported_operation`](https://stratadb.org/e/inference.unsupported_operation)
- [`inference.unsupported_parameter`](https://stratadb.org/e/inference.unsupported_parameter)
- [`inference.unsupported_provider`](https://stratadb.org/e/inference.unsupported_provider)

## internal
- [`internal.executor.arrow`](https://stratadb.org/e/internal.executor.arrow)
- [`internal.executor.wire_response`](https://stratadb.org/e/internal.executor.wire_response)

## invalid_argument
- [`invalid_argument.engine.branch_delete`](https://stratadb.org/e/invalid_argument.engine.branch_delete)
- [`invalid_argument.engine.branch_name`](https://stratadb.org/e/invalid_argument.engine.branch_name)
- [`invalid_argument.engine.branch_name_reserved`](https://stratadb.org/e/invalid_argument.engine.branch_name_reserved)
- [`invalid_argument.engine.branch_point`](https://stratadb.org/e/invalid_argument.engine.branch_point)
- [`invalid_argument.engine.config_key`](https://stratadb.org/e/invalid_argument.engine.config_key)
- [`invalid_argument.engine.event_batch`](https://stratadb.org/e/invalid_argument.engine.event_batch)
- [`invalid_argument.engine.event_payload`](https://stratadb.org/e/invalid_argument.engine.event_payload)
- [`invalid_argument.engine.event_payload_too_large`](https://stratadb.org/e/invalid_argument.engine.event_payload_too_large)
- [`invalid_argument.engine.event_type`](https://stratadb.org/e/invalid_argument.engine.event_type)
- [`invalid_argument.engine.graph_batch`](https://stratadb.org/e/invalid_argument.engine.graph_batch)
- [`invalid_argument.engine.graph_binding`](https://stratadb.org/e/invalid_argument.engine.graph_binding)
- [`invalid_argument.engine.graph_edge_endpoint`](https://stratadb.org/e/invalid_argument.engine.graph_edge_endpoint)
- [`invalid_argument.engine.graph_edge_type`](https://stratadb.org/e/invalid_argument.engine.graph_edge_type)
- [`invalid_argument.engine.graph_edge_type_reserved`](https://stratadb.org/e/invalid_argument.engine.graph_edge_type_reserved)
- [`invalid_argument.engine.graph_edge_weight`](https://stratadb.org/e/invalid_argument.engine.graph_edge_weight)
- [`invalid_argument.engine.graph_name`](https://stratadb.org/e/invalid_argument.engine.graph_name)
- [`invalid_argument.engine.graph_name_reserved`](https://stratadb.org/e/invalid_argument.engine.graph_name_reserved)
- [`invalid_argument.engine.graph_node_id`](https://stratadb.org/e/invalid_argument.engine.graph_node_id)
- [`invalid_argument.engine.graph_pagerank_options`](https://stratadb.org/e/invalid_argument.engine.graph_pagerank_options)
- [`invalid_argument.engine.graph_personalization`](https://stratadb.org/e/invalid_argument.engine.graph_personalization)
- [`invalid_argument.engine.graph_properties`](https://stratadb.org/e/invalid_argument.engine.graph_properties)
- [`invalid_argument.engine.graph_properties_too_large`](https://stratadb.org/e/invalid_argument.engine.graph_properties_too_large)
- [`invalid_argument.engine.graph_property_name`](https://stratadb.org/e/invalid_argument.engine.graph_property_name)
- [`invalid_argument.engine.graph_type_hint`](https://stratadb.org/e/invalid_argument.engine.graph_type_hint)
- [`invalid_argument.engine.graph_type_name`](https://stratadb.org/e/invalid_argument.engine.graph_type_name)
- [`invalid_argument.engine.graph_type_name_reserved`](https://stratadb.org/e/invalid_argument.engine.graph_type_name_reserved)
- [`invalid_argument.engine.json_array_too_large`](https://stratadb.org/e/invalid_argument.engine.json_array_too_large)
- [`invalid_argument.engine.json_document_id`](https://stratadb.org/e/invalid_argument.engine.json_document_id)
- [`invalid_argument.engine.json_document_too_deep`](https://stratadb.org/e/invalid_argument.engine.json_document_too_deep)
- [`invalid_argument.engine.json_document_too_large`](https://stratadb.org/e/invalid_argument.engine.json_document_too_large)
- [`invalid_argument.engine.json_index_name`](https://stratadb.org/e/invalid_argument.engine.json_index_name)
- [`invalid_argument.engine.json_index_name_reserved`](https://stratadb.org/e/invalid_argument.engine.json_index_name_reserved)
- [`invalid_argument.engine.json_path`](https://stratadb.org/e/invalid_argument.engine.json_path)
- [`invalid_argument.engine.json_path_not_found`](https://stratadb.org/e/invalid_argument.engine.json_path_not_found)
- [`invalid_argument.engine.json_path_too_long`](https://stratadb.org/e/invalid_argument.engine.json_path_too_long)
- [`invalid_argument.engine.json_path_type`](https://stratadb.org/e/invalid_argument.engine.json_path_type)
- [`invalid_argument.engine.json_value`](https://stratadb.org/e/invalid_argument.engine.json_value)
- [`invalid_argument.engine.kv_batch`](https://stratadb.org/e/invalid_argument.engine.kv_batch)
- [`invalid_argument.engine.kv_batch_duplicate_key`](https://stratadb.org/e/invalid_argument.engine.kv_batch_duplicate_key)
- [`invalid_argument.engine.kv_key`](https://stratadb.org/e/invalid_argument.engine.kv_key)
- [`invalid_argument.engine.product_space`](https://stratadb.org/e/invalid_argument.engine.product_space)
- [`invalid_argument.engine.product_space_reserved`](https://stratadb.org/e/invalid_argument.engine.product_space_reserved)
- [`invalid_argument.engine.space_delete_default`](https://stratadb.org/e/invalid_argument.engine.space_delete_default)
- [`invalid_argument.engine.space_delete_too_large`](https://stratadb.org/e/invalid_argument.engine.space_delete_too_large)
- [`invalid_argument.engine.vector_batch`](https://stratadb.org/e/invalid_argument.engine.vector_batch)
- [`invalid_argument.engine.vector_collection`](https://stratadb.org/e/invalid_argument.engine.vector_collection)
- [`invalid_argument.engine.vector_collection_reserved`](https://stratadb.org/e/invalid_argument.engine.vector_collection_reserved)
- [`invalid_argument.engine.vector_dimension`](https://stratadb.org/e/invalid_argument.engine.vector_dimension)
- [`invalid_argument.engine.vector_embedding`](https://stratadb.org/e/invalid_argument.engine.vector_embedding)
- [`invalid_argument.engine.vector_filter`](https://stratadb.org/e/invalid_argument.engine.vector_filter)
- [`invalid_argument.engine.vector_key`](https://stratadb.org/e/invalid_argument.engine.vector_key)
- [`invalid_argument.engine.vector_metadata`](https://stratadb.org/e/invalid_argument.engine.vector_metadata)
- [`invalid_argument.engine.vector_metadata_patch`](https://stratadb.org/e/invalid_argument.engine.vector_metadata_patch)
- [`invalid_argument.executor.arrow_base64`](https://stratadb.org/e/invalid_argument.executor.arrow_base64)
- [`invalid_argument.executor.arrow_collection`](https://stratadb.org/e/invalid_argument.executor.arrow_collection)
- [`invalid_argument.executor.arrow_embedding_type`](https://stratadb.org/e/invalid_argument.executor.arrow_embedding_type)
- [`invalid_argument.executor.arrow_empty_export`](https://stratadb.org/e/invalid_argument.executor.arrow_empty_export)
- [`invalid_argument.executor.arrow_event`](https://stratadb.org/e/invalid_argument.executor.arrow_event)
- [`invalid_argument.executor.arrow_feature_disabled`](https://stratadb.org/e/invalid_argument.executor.arrow_feature_disabled)
- [`invalid_argument.executor.arrow_format`](https://stratadb.org/e/invalid_argument.executor.arrow_format)
- [`invalid_argument.executor.arrow_graph`](https://stratadb.org/e/invalid_argument.executor.arrow_graph)
- [`invalid_argument.executor.arrow_input_missing`](https://stratadb.org/e/invalid_argument.executor.arrow_input_missing)
- [`invalid_argument.executor.arrow_json_key`](https://stratadb.org/e/invalid_argument.executor.arrow_json_key)
- [`invalid_argument.executor.arrow_key_column`](https://stratadb.org/e/invalid_argument.executor.arrow_key_column)
- [`invalid_argument.executor.arrow_value_column`](https://stratadb.org/e/invalid_argument.executor.arrow_value_column)
- [`invalid_argument.executor.arrow_vector_dimension`](https://stratadb.org/e/invalid_argument.executor.arrow_vector_dimension)
- [`invalid_argument.executor.arrow_vector_key`](https://stratadb.org/e/invalid_argument.executor.arrow_vector_key)
- [`invalid_argument.executor.graph_analytics_budget`](https://stratadb.org/e/invalid_argument.executor.graph_analytics_budget)
- [`invalid_argument.executor.hub_branch`](https://stratadb.org/e/invalid_argument.executor.hub_branch)
- [`invalid_argument.executor.hub_dataset`](https://stratadb.org/e/invalid_argument.executor.hub_dataset)
- [`invalid_argument.executor.hub_feature_disabled`](https://stratadb.org/e/invalid_argument.executor.hub_feature_disabled)
- [`invalid_argument.executor.hub_url`](https://stratadb.org/e/invalid_argument.executor.hub_url)
- [`invalid_argument.executor.ipc_hello`](https://stratadb.org/e/invalid_argument.executor.ipc_hello)
- [`invalid_argument.executor.json_batch_duplicate_key`](https://stratadb.org/e/invalid_argument.executor.json_batch_duplicate_key)
- [`invalid_argument.executor.json_number`](https://stratadb.org/e/invalid_argument.executor.json_number)
- [`invalid_argument.executor.kv_batch_duplicate_key`](https://stratadb.org/e/invalid_argument.executor.kv_batch_duplicate_key)
- [`invalid_argument.executor.limit`](https://stratadb.org/e/invalid_argument.executor.limit)
- [`invalid_argument.executor.vector_batch_duplicate_key`](https://stratadb.org/e/invalid_argument.executor.vector_batch_duplicate_key)
- [`invalid_argument.executor.vector_dimension`](https://stratadb.org/e/invalid_argument.executor.vector_dimension)
- [`invalid_argument.executor.vector_limit`](https://stratadb.org/e/invalid_argument.executor.vector_limit)
- [`invalid_argument.executor.wire_request`](https://stratadb.org/e/invalid_argument.executor.wire_request)

## not_found
- [`not_found.engine.branch`](https://stratadb.org/e/not_found.engine.branch)
- [`not_found.engine.graph`](https://stratadb.org/e/not_found.engine.graph)
- [`not_found.engine.graph_node`](https://stratadb.org/e/not_found.engine.graph_node)
- [`not_found.engine.vector_collection`](https://stratadb.org/e/not_found.engine.vector_collection)

## resource_exhausted
- [`resource_exhausted.engine.graph_analytics_budget`](https://stratadb.org/e/resource_exhausted.engine.graph_analytics_budget)
- [`resource_exhausted.executor.ipc_connections`](https://stratadb.org/e/resource_exhausted.executor.ipc_connections)

## unavailable
- [`unavailable.executor.arrow_io`](https://stratadb.org/e/unavailable.executor.arrow_io)
- [`unavailable.executor.hub_transport`](https://stratadb.org/e/unavailable.executor.hub_transport)
- [`unavailable.executor.ipc_deadline`](https://stratadb.org/e/unavailable.executor.ipc_deadline)
- [`unavailable.executor.ipc_transport`](https://stratadb.org/e/unavailable.executor.ipc_transport)

## unsupported
- [`unsupported.engine.graph_binding_cross_branch`](https://stratadb.org/e/unsupported.engine.graph_binding_cross_branch)
<!-- generated:end error-catalog -->
