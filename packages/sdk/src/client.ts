import * as anchor from "@coral-xyz/anchor";
import { Program, Idl } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { BaseClient } from "./base-client";

import type { BasktV1 } from "./program/types";
import { BasktV1Idl } from "./program/idl";

/**
 * Baskt SDK client for interacting with the Baskt protocol
 */
export class BasktClient extends BaseClient {
  /**
   * Create a new BasktClient instance
   * @param connection A Solana connection
   * @param wallet An Anchor wallet
   */
  constructor(connection: Connection, wallet?: anchor.Wallet) {
    const provider = new anchor.AnchorProvider(
      connection,
      wallet as anchor.Wallet,
      { commitment: "confirmed" }
    );

    const program = new Program<BasktV1>(BasktV1Idl, provider);

    // Initialize the base client
    super(program);
  }
}
