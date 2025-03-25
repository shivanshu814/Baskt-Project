import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { BaseClient } from "@baskt/sdk";
import { BasktV1 } from "../../target/types/baskt_v1";

/**
 * Singleton test client for the Baskt protocol
 * Provides utility methods for interacting with the protocol in tests
 * This extends the BaseClient directly instead of wrapping BasktClient
 */
export class TestClient extends BaseClient {
  private static instance: TestClient;

  /**
   * Private constructor - use getInstance() instead
   */
  private constructor() {
    // Use the AnchorProvider.env() to get the provider from the environment
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Get the program from the workspace
    const program = anchor.workspace.BasktV1 as Program<BasktV1>;

    // Initialize the base client
    super(program);
  }

  /**
   * Get the singleton instance of the test client
   */
  public static getInstance(): TestClient {
    if (!TestClient.instance) {
      TestClient.instance = new TestClient();
    }
    return TestClient.instance;
  }

  /**
   * Create and add a synthetic asset with a custom oracle in one step
   * @param ticker Asset ticker symbol
   * @param price Oracle price (optional)
   * @param exponent Price exponent (optional)
   * @returns Object containing asset and oracle information
   */
  public async createAssetWithCustomOracle(
    ticker: string,
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT
  ) {
    // We inherit createAndAddAssetWithCustomOracle from BaseClient
    const result = await this.createAndAddAssetWithCustomOracle(
      ticker,
      price,
      exponent
    );

    // Format the result to match the expected return format of the TestClient
    return {
      assetKeypair: result.assetKeypair,
      assetId: result.assetId,
      ticker,
      oracle: result.oracle,
      oracleParams: this.createOracleParams(result.oracle.address, "custom"),
    };
  }
}
