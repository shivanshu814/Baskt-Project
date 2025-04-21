import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BaseClient } from '@baskt/sdk';
import { BasktV1 } from '../../target/types/baskt_v1';
import { AssetPermissions, AccessControlRole } from '@baskt/types';

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

let anchorProvider: anchor.AnchorProvider;
try {
  anchorProvider = anchor.AnchorProvider.env();
} catch (error) {
  console.error('Error loading anchor provider:', error);
}

export class TestClient extends BaseClient {
  private static instance: TestClient;

  // Set up test accounts
  public assetManager: Keypair;
  public oracleManager: Keypair;

  public publicKey: PublicKey;

  public storedAssets = new Map<
    string,
    {
      assetAddress: PublicKey;
      txSignature: string;
    }
  >();
  /**
   * Constructor for TestClient
   * @param program Optional program to use (defaults to workspace program)
   */
  public constructor(program?: Program<BasktV1>) {
    if (!program) {
      // Use the AnchorProvider.env() to get the provider from the environment
      anchor.setProvider(anchor.AnchorProvider.env());

      // Get the program from the workspace
      program = anchor.workspace.BasktV1 as Program<BasktV1>;
    }

    // Initialize the base client with the program and optional protocol PDA

    // Initialize the base client with the program and optional protocol PDA
    const provider = program.provider as anchor.AnchorProvider;
    super(provider.connection, {
      sendAndConfirmLegacy: (tx) => provider.sendAndConfirm(tx),
      sendAndConfirmV0: (tx) => provider.sendAndConfirm(tx),
    });

    this.publicKey = anchorProvider?.publicKey;

    this.assetManager = Keypair.generate();
    this.oracleManager = Keypair.generate();
  }

  public getPublicKey(): PublicKey {
    return this.publicKey;
  }

  public setPublicKey(publicKey: PublicKey): void {
    this.publicKey = publicKey;
    this.oracleHelper.publicKey = publicKey;
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
    const client = new TestClient(userProgram);
    client.setPublicKey(userKeypair.publicKey);
    return client;
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

  public async addAsset(
    ticker: string,
    permissions?: AssetPermissions,
  ): Promise<{ txSignature: string; assetAddress: PublicKey }> {
    if (this.storedAssets.has(ticker)) {
      return this.storedAssets.get(ticker) as { txSignature: string; assetAddress: PublicKey };
    }
    const assetInfo = await super.addAsset(ticker, permissions);
    this.storedAssets.set(ticker, {
      txSignature: assetInfo.txSignature,
      assetAddress: assetInfo.assetAddress,
    });
    return assetInfo;
  }

  public async waitForBlocks() {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
