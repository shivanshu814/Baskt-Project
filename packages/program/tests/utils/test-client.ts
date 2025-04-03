import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import BN from 'bn.js';
import { BaseClient, AccessControlRole } from '@baskt/sdk';
import { BasktV1 } from '../../target/types/baskt_v1';
import { AssetPermissions } from 'packages/sdk/src/types';

/**
 * Helper function to request an airdrop for a given address
 * @param myAddress The address to fund
 * @param connection The connection to use
 */
export async function requestAirdrop(myAddress: PublicKey, connection: anchor.web3.Connection) {
  const signature = await connection.requestAirdrop(myAddress, LAMPORTS_PER_SOL * 10);
  await connection.confirmTransaction(signature);
}

/**
 * Helper function to create a program instance for a specific user
 * @param signer The keypair to use as the signer
 * @param program The original program instance
 * @returns A new program instance with the specified signer
 */
export async function programForUser(
  signer: Keypair,
  program: Program<BasktV1>,
): Promise<Program<BasktV1>> {
  const newProvider = new anchor.AnchorProvider(
    program.provider.connection,
    new anchor.Wallet(signer),
    {},
  );
  return new anchor.Program(program.idl, newProvider) as Program<BasktV1>;
}

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
   * Constructor for TestClient
   * @param program Optional program to use (defaults to workspace program)
   * @param protocolPDA Optional protocol PDA to use (defaults to finding it)
   */
  public constructor(program?: Program<BasktV1>) {
    if (!program) {
      // Use the AnchorProvider.env() to get the provider from the environment
      const provider = anchor.AnchorProvider.env();
      anchor.setProvider(provider);

      // Get the program from the workspace
      program = anchor.workspace.BasktV1 as Program<BasktV1>;
    }

    // Initialize the base client with the program and optional protocol PDA
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
   * Create a new test client for a specific user
   * @param userKeypair The keypair to use for the client
   * @returns A new test client with the specified user
   */
  public static async forUser(userKeypair: Keypair): Promise<TestClient> {
    // Ensure the user has enough SOL
    await requestAirdrop(userKeypair.publicKey, anchor.AnchorProvider.env().connection);

    // Create a new program instance for the user
    const userProgram = await programForUser(
      userKeypair,
      anchor.workspace.BasktV1 as Program<BasktV1>,
    );

    // Create a new client with the user's program
    return new TestClient(userProgram);
  }

  /**
   * Initialize test roles
   * This must be called before using the test client
   */
  public async initializeRoles(): Promise<void> {
    // Add roles to test accounts
    await this.addRole(this.assetManager.publicKey, AccessControlRole.AssetManager);
    await this.addRole(this.oracleManager.publicKey, AccessControlRole.OracleManager);
  }

  public async createAssetWithCustomOracle(
    ticker: string,
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
    permissions?: AssetPermissions,
  ) {
    try {
      // Try to get the asset by ticker
      const existingAsset = await this.getAssetByTicker(ticker);
      if (existingAsset) {
        // If asset exists, return its information
        await this.updateOraclePrice(ticker, existingAsset.oracle.oracleAccount, price, exponent);
        return {
          assetAddress: existingAsset.assetAddress,
          ticker: existingAsset.ticker,
          oracle: existingAsset.oracle.oracleAccount, // Just return the oracle account address
          txSignature: null, // No new transaction was created
        };
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    // Create new asset if it doesn't exist
    return await this.createAndAddAssetWithCustomOracle(ticker, price, exponent, permissions);
  }

  /**
   * Create a stale oracle for testing
   * @param staleTimeSeconds How many seconds in the past
   * @param price Oracle price
   * @param exponent Price exponent
   * @returns Oracle information
   */
  public async createStaleOracle(
    ticker: string,
    staleTimeSeconds: number = 7200, // 2 hours by default
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
  ) {
    const currentTime = Math.floor(Date.now() / 1000);
    const staleTime = currentTime - staleTimeSeconds;

    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === 'number' ? price * Math.pow(10, -exponent) : price;

    return await this.oracleHelper.createCustomOracle(
      this.protocolPDA,
      ticker,
      rawPrice,
      exponent,
      undefined, // Default confidence
      staleTime, // Use stale timestamp
    );
  }

  /**
   * Create and add a synthetic asset with a Pyth oracle in one step
   * @param ticker Asset ticker symbol
   * @param price Price value (optional, defaults to 50,000)
   * @param exponent Price exponent (optional, defaults to -6)
   * @returns Object containing asset and oracle information
   */
  public async createAndAddAssetWithMockPythOracle(
    ticker: string,
    price?: number | BN,
    exponent?: number,
    permissions?: AssetPermissions,
  ) {
    // Create a Pyth oracle
    const oracle = await this.createCustomOracle(this.protocolPDA, ticker, price, exponent);

    // Create oracle parameters
    const oracleParams = this.createOracleParams(
      oracle.address,
      'pyth',
      this.DEFAULT_PRICE_ERROR,
      this.DEFAULT_PRICE_AGE_SEC,
    );

    // Add the asset
    const { txSignature, assetAddress } = await this.addAsset({
      ticker,
      oracle: oracleParams,
      permissions: permissions || { allowLongs: true, allowShorts: true },
    });

    return {
      assetAddress,
      oracle: oracle.address, // Just return the oracle address directly
      ticker,
      txSignature,
    };
  }

  public async createMockBaskt(
    basktName: string,
    assets: Array<{
      asset: PublicKey;
      oracle: PublicKey;
      direction: boolean;
      weight: number;
    }>,
    isPublic: boolean,
  ) {
    // Extract asset configs and asset/oracle pairs
    const assetConfigs = assets.map((item) => ({
      assetId: item.asset,
      direction: item.direction,
      weight: item.weight,
    }));

    const assetOraclePairs = assets.map((item) => ({
      asset: item.asset,
      oracle: item.oracle,
    }));

    // Create the baskt with current prices
    return await super.createBaskt(basktName, assetConfigs, isPublic, assetOraclePairs);
  }
}
