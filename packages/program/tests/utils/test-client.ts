import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { BaseClient, AccessControlRole } from "@baskt/sdk";
import { BasktV1 } from "../../target/types/baskt_v1";

/**
 * Singleton test client for the Baskt protocol
 * Provides utility methods for interacting with the protocol in tests
 * This extends the BaseClient directly instead of wrapping BasktClient
 */
export class TestClient extends BaseClient {
  private static instance: TestClient;

  // Set up test accounts
  public assetManager: Keypair;
  public oracleManager: Keypair;

  /**
   * Private constructor - use getInstance() instead
   */
  public constructor() {
    // Use the AnchorProvider.env() to get the provider from the environment
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Get the program from the workspace
    const program = anchor.workspace.BasktV1 as Program<BasktV1>;

    // Initialize the base client
    super(program);

    this.assetManager = Keypair.generate();
    this.oracleManager = Keypair.generate();
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
   * Initialize test roles
   * This must be called before using the test client
   */
  public async initializeRoles(): Promise<void> {
    // Add roles to test accounts
    await this.addRole(
      this.assetManager.publicKey,
      AccessControlRole.AssetManager
    );
    await this.addRole(
      this.oracleManager.publicKey,
      AccessControlRole.OracleManager
    );
  }
  /**
   * Create and add a synthetic asset with a custom oracle in one step
   * If an asset with the given ticker already exists, returns its information
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
    try {
      // Try to get the asset by ticker
      const existingAsset = await this.getAssetByTicker(ticker);
      if (existingAsset) {
        // If asset exists, return its information
        return {
          assetAddress: existingAsset.assetAddress,
          ticker: existingAsset.ticker,
          oracle: existingAsset.oracle,
          txSignature: null, // No new transaction was created
        };
      }
    } catch (error) {
      // If the asset already exists, return its information
    }

    // Create new asset if it doesn't exist
    const result = await this.createAndAddAssetWithCustomOracle(
      ticker,
      price,
      exponent
    );

    // Format the result to match the expected return format of the TestClient
    return {
      assetAddress: result.assetAddress,
      ticker,
      oracle: result.oracle,
      txSignature: result.txSignature,
    };
  }

  /**
   * Add a role to an account
   * @param account Account to assign the role to
   * @param role AccessControlRole to assign
   */
  public async addRole(
    account: PublicKey,
    role: AccessControlRole | string
  ): Promise<string> {
    // Convert string to AccessControlRole enum if needed
    const roleEnum = typeof role === "string" ? this.stringToRole(role) : role;
    return await super.addRole(account, roleEnum);
  }

  /**
   * Remove a role from an account
   * @param account Account to remove the role from
   * @param role AccessControlRole to remove
   */
  public async removeRole(
    account: PublicKey,
    role: AccessControlRole | string
  ): Promise<string> {
    // Convert string to AccessControlRole enum if needed
    const roleEnum = typeof role === "string" ? this.stringToRole(role) : role;
    return await super.removeRole(account, roleEnum);
  }

  /**
   * Check if an account has a specific role
   * @param account Account to check
   * @param role AccessControlRole to check
   * @returns Boolean indicating if the account has the role
   */
  public async hasRole(
    account: PublicKey,
    role: AccessControlRole | string
  ): Promise<boolean> {
    // Convert string to AccessControlRole enum if needed
    const roleEnum = typeof role === "string" ? this.stringToRole(role) : role;
    return await super.hasRole(account, roleEnum);
  }

  /**
   * Check if an account has permission for a specific role (is owner or has the role)
   * @param account Account to check
   * @param role AccessControlRole to check
   * @returns Boolean indicating if the account has permission
   */
  public async hasPermission(
    account: PublicKey,
    role: AccessControlRole | string
  ): Promise<boolean> {
    // Convert string to AccessControlRole enum if needed
    const roleEnum = typeof role === "string" ? this.stringToRole(role) : role;
    return await super.hasPermission(account, roleEnum);
  }

  /**
   * Helper method to convert a string to a AccessControlRole enum
   * @param roleStr AccessControlRole as a string
   * @returns AccessControlRole enum
   */
  private stringToRole(roleStr: string): AccessControlRole {
    switch (roleStr) {
      case "AssetManager":
        return AccessControlRole.AssetManager;
      case "OracleManager":
        return AccessControlRole.OracleManager;
      case "Owner":
        // For Owner role, we can't actually add it as a role in the access control list
        // but we handle it specially in the hasPermission method
        throw new Error(
          `Cannot add ${AccessControlRole.Owner} as a role. Owner is set during protocol initialization.`
        );
      default:
        throw new Error(`Invalid role string: ${roleStr}`);
    }
  }

  /**
   * Create and add a synthetic asset with a Pyth oracle in one step
   * @param ticker Asset ticker symbol
   * @param price Oracle price (optional)
   * @param exponent Price exponent (optional)
   * @returns Object containing asset and oracle information
   */
  public async createAndAddAssetWithPythOracle(
    ticker: string,
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT
  ) {
    // Create a Pyth oracle
    const oracle = await this.createPythOracle(price, exponent);

    // Create oracle parameters
    const oracleParams = this.createOracleParams(
      oracle.address,
      "pyth",
      this.DEFAULT_PRICE_ERROR,
      this.DEFAULT_PRICE_AGE_SEC
    );

    // Add the asset
    const { assetAddress, txSignature } = await this.addAsset(
      ticker,
      oracleParams
    );

    return {
      assetAddress,
      oracle,
      txSignature,
    };
  }

  /**
   * Create a new baskt
   * @param basktName The name of the baskt
   * @param assetConfigs Array of asset configurations with weights
   * @param isPublic Whether the baskt is public or private
   * @returns Object containing the baskt keypair and transaction signature
   */
  public async createBaskt(
    basktName: string,
    assetConfigs: Array<{
      assetId: PublicKey;
      direction: boolean;
      weight: number;
    }>,
    isPublic: boolean
  ) {
    // Use the BaseClient's createBaskt method and return the full result
    return await super.createBaskt(basktName, assetConfigs, isPublic);
  }

  /**
   * Get a baskt account by its public key
   * @param basktPubkey The public key of the baskt account
   * @returns The baskt account data
   */
  public async getBaskt(basktPubkey: PublicKey) {
    // Use the BaseClient's getBaskt method
    return await super.getBaskt(basktPubkey);
  }
}
