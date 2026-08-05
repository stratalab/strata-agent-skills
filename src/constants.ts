// The one module that knows names (requirements AR-6). The npm package name is
// the single unsettled name (dispute pending; `strata-db` fallback) and lives in
// package.json; everything user-facing below is final.

/** The CLI binary this package resolves and execs — never bundles. */
export const CLI_BIN = "strata";

/** The MCP entry name written into every agent config. */
export const ENTRY_NAME = "strata";

/** The conventional database directory when a workspace has none yet. */
export const DEFAULT_DB_DIRNAME = ".strata";

/** Printed after a successful init — the moment of handoff to the agent. */
export const HANDOFF_LINE = 'Tell your agent: "get started with Strata"';

/** Install guidance when no CLI is found and no installer can run. */
export const INSTALL_HINT =
  "install the Strata CLI first: brew install stratalab/tap/strata " +
  "(or see https://github.com/stratalab/strata-core)";
