import * as anchor from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { BaseClient } from "./base-client";
/**
 * Baskt SDK client for interacting with the Baskt protocol
 */
export declare class BasktClient extends BaseClient {
    /**
     * Create a new BasktClient instance
     * @param connection A Solana connection
     * @param wallet An Anchor wallet
     */
    constructor(connection: Connection, wallet?: anchor.Wallet);
}
