/**
 * Baskt SDK
 *
 * This SDK provides a client for interacting with the Baskt protocol on Solana.
 * It imports the IDL and types from the program package and exposes helper functions.
 */

// Export the clients
export { BasktClient } from "./client";
export { BaseClient } from "./base-client";

// Export utility modules
export { AccessControlRole } from "./types";
export { OracleHelper, OracleType } from "./utils/oracle-helper";
export type { OraclePrice } from "./utils/oracle-helper";
