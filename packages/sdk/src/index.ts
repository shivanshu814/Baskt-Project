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
export * from "./types";
export * from "./utils/oracle-helper";
