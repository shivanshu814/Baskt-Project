import { BaseClient, BPS_DIVISOR, PRICE_PRECISION, USDC_MINT } from '@baskt/sdk';
import { AccessControlRole, OnchainAssetPermissions, OnchainBasktAccount, OnchainPosition } from '@baskt/types';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  createAssociatedTokenAccount,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Baskt } from '../../target/types/baskt';
import { waitForNextSlot, waitForTx } from './chain-helpers';
import { calculateNAVWithPrecision } from './test-constants';
import { expect } from 'chai';
import { calculateSettlementDetails } from './fee-utils';
import { set } from 'mongoose';
import { expectAccountNotFound } from './expects';

/**
 * Helper function to request an airdrop for a given address
 * @param myAddress The address to fund
 * @param connection The connection to use
 */
export async function requestAirdrop(myAddress: PublicKey, connection: anchor.web3.Connection, amount: number = 10) {
  const signature = await connection.requestAirdrop(myAddress, LAMPORTS_PER_SOL * amount);
  await connection.confirmTransaction(signature, 'confirmed');
}

/**
 * Helper function to create a program instance for a specific user
 * @param signer The keypair to use as the signer
 * @param program The original program instance
 * @returns A new program instance with the specified signer
 */
export async function programForUser(
  signer: Keypair,
  program: Program<Baskt>,
): Promise<Program<Baskt>> {
  const newProvider = new anchor.AnchorProvider(
    program.provider.connection,
    new anchor.Wallet(signer),
    {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
      skipPreflight: false,
      maxRetries: 8,
    },
  );
  return new anchor.Program(program.idl, newProvider) as Program<Baskt>;
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

  // Global test accounts that persist across test files
  private static globalTestAccounts: {
    matcher: Keypair;
    liquidator: Keypair;
    fundingManager: Keypair;
    treasury: Keypair;
  } = {
    matcher: Keypair.generate(),
    liquidator: Keypair.generate(),
    fundingManager: Keypair.generate(),
    treasury: Keypair.generate(),
  };

  /**
   * Get or create global test accounts
   * This ensures we use the same accounts across all tests to avoid exceeding role limits
   * Note: Treasury is not included here as we use the client's treasury
   */
  public static async getGlobalTestAccounts() {
    return TestClient.globalTestAccounts;
  }

  // Set up test accounts
  public assetManager: Keypair;
  public basktManager: Keypair;
  public treasury: Keypair;

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
  public constructor(program?: Program<Baskt>) {
    if (!program) {
      // Use the AnchorProvider.env() to get the provider from the environment
      const envProvider = anchor.AnchorProvider.env();

      // Create a new provider with aggressive timeout settings for full test suite
      const enhancedProvider = new anchor.AnchorProvider(
        envProvider.connection,
        envProvider.wallet,
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed',
          skipPreflight: false,
          maxRetries: 8,
        },
      );

      anchor.setProvider(enhancedProvider);

      // Get the program from the workspace
      program = anchor.workspace.baskt as Program<Baskt>;
    }

    // Initialize the base client with the program and optional protocol PDA
    const provider = program.provider as anchor.AnchorProvider;
    super(
      provider.connection,
      {
        sendAndConfirmLegacy: (tx) => provider.sendAndConfirm(tx),
        sendAndConfirmV0: (tx) => provider.sendAndConfirm(tx),
      },
      provider.publicKey, // Pass the public key to avoid circular dependency
      provider, // Pass the anchor provider
    );

    // Override the inherited program to use the provided program instance with its correct provider
    this.program = program;
    // Use the provider's public key instead of the global anchorProvider
    this.publicKey = provider.publicKey;

    this.assetManager = Keypair.generate();
    this.basktManager = Keypair.generate();
    this.treasury = TestClient.globalTestAccounts.treasury;
  }

  public getPublicKey(): PublicKey {
    return this.publicKey;
  }

  public setPublicKey(publicKey: PublicKey): void {
    // WARNING: Changing the public key after construction can cause signature mismatches
    // Only use this method if you understand the implications
    this.publicKey = publicKey;
    // this.oracleHelper.publicKey = publicKey; // TODO: Fix oracleHelper property
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
    const userProgram = await programForUser(userKeypair, anchor.workspace.baskt as Program<Baskt>);

    await requestAirdrop(userKeypair.publicKey, userProgram.provider.connection);

    // Create a new client with the user's program
    // Don't call setPublicKey - the constructor already sets it correctly from the provider
    const client = new TestClient(userProgram);
    return client;
  }

  public static async forUserNoAirdrop(userKeypair: Keypair): Promise<TestClient> {
    // Create a new program instance for the user
    const userProgram = await programForUser(userKeypair, anchor.workspace.baskt as Program<Baskt>);
    return new TestClient(userProgram);
  }

  /**
   * Initialize protocol and roles if not already done
   * This prevents duplicate role assignments
   */
  public static async initializeProtocolAndRoles(client: TestClient) {
    // Check if protocol is initialized, if not initialize it
    try {
      const protocol = await client.getProtocolAccount();
      if (!protocol.isInitialized) {
        await client.initializeProtocol(client.treasury.publicKey);
      }
    } catch (error) {
      // Protocol doesn't exist, initialize it
      await client.initializeProtocol(client.treasury.publicKey);
    }

    // Initialize TestClient roles (AssetManager, BasktManager)
    await client.initializeRoles();

    // Get global test accounts
    const { matcher, liquidator, fundingManager } = await TestClient.getGlobalTestAccounts();

    // Fund accounts if needed - only fund the global role accounts and client.treasury
    const accounts = [client.treasury, matcher, liquidator, fundingManager];
    for (const account of accounts) {
      try {
        const balance = await client.connection.getBalance(account.publicKey);
        if (balance < 1000000) {
          // Less than 0.001 SOL
          await requestAirdrop(account.publicKey, client.connection);
        }
      } catch (error) {
        await requestAirdrop(account.publicKey, client.connection);
      }
    }

    // Add roles only if they don't exist
    const rolesToAdd = [
      { account: matcher.publicKey, role: AccessControlRole.Matcher },
      { account: liquidator.publicKey, role: AccessControlRole.Liquidator },
      { account: fundingManager.publicKey, role: AccessControlRole.FundingManager },
    ];

    // Ensure the treasury has an associated USDC token account for fee transfers
    await client.getOrCreateUSDCAccountKey(client.treasury.publicKey);

    // Get current protocol state to check entry count
    let protocolAccount;
    try {
      protocolAccount = await client.getProtocolAccount();
      const entryCount = protocolAccount.accessControl.entries.length;

      if (entryCount >= 18) {
      }
    } catch (error) {
      // Keeping error logging for critical errors
      console.error('Failed to fetch protocol account:', error);
    }

    for (const { account, role } of rolesToAdd) {
      try {
        const hasRole = await client.hasRole(account, role);
        if (!hasRole) {
          await client.addRole(account, role);

          // Verify role was added
          const roleAdded = await client.hasRole(account, role);
          if (!roleAdded) {
            throw new Error(`Failed to add role ${role} to ${account.toString()}`);
          }
        }
      } catch (error) {
        // Check if it's the serialization error
        if (
          error instanceof Error &&
          (error.toString().includes('AccountDidNotSerialize') ||
            error.toString().includes('0xbbc'))
        ) {
          throw new Error(
            `Protocol account is full (20 entry limit reached). Please restart the test validator.`,
          );
        }

        // If hasRole fails for another reason, try to add the role
        try {
          // Removed console.log to avoid lint warnings
          await client.addRole(account, role);
        } catch (addError) {
          // Keeping error logging for critical errors
          console.error(`ERROR: Could not add role ${role} to ${account.toString()}: ${addError}`);
          if (
            addError instanceof Error &&
            (addError.toString().includes('AccountDidNotSerialize') ||
              addError.toString().includes('0xbbc'))
          ) {
            throw new Error(
              `Protocol account is full (20 entry limit reached). Please restart the test validator.`,
            );
          }
          throw addError;
        }
      }
    }

    return { matcher, liquidator, fundingManager };
  }

  /**
   * Standard test setup for liquidity pool tests
   */
  public static async setupLiquidityPoolTest(params: {
    client: TestClient;
    initialLiquidity?: BN;
    depositFeeBps?: number;
    withdrawalFeeBps?: number;
    minDeposit?: BN;
  }) {
    const {
      client,
      initialLiquidity = new BN(1000_000_000), // 1000 USDC default
      depositFeeBps = 0,
      withdrawalFeeBps = 0,
      minDeposit = new BN(0),
    } = params;

    // Initialize protocol and roles
    await TestClient.initializeProtocolAndRoles(client);

    // Create a provider for liquidity
    const provider = Keypair.generate();
    await requestAirdrop(provider.publicKey, client.connection);
    const providerClient = await TestClient.forUser(provider);

    // Create token accounts
    const providerTokenAccount = await client.getOrCreateUSDCAccountKey(provider.publicKey);
    const treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(client.treasury.publicKey);

    // Mint USDC to provider
    await client.mintUSDC(providerTokenAccount, initialLiquidity.muln(2));

    // Setup liquidity pool
    const poolSetup = await client.setupLiquidityPool({
      depositFeeBps,
      withdrawalFeeBps,
      collateralMint: USDC_MINT,
    });

    return {
      ...poolSetup,
      provider,
      providerClient,
      providerTokenAccount,
      treasury: client.treasury,
      treasuryTokenAccount,
      collateralMint: USDC_MINT,
    };
  }

  /**
   * Set up a test environment for position-related tests
   * This centralizes common setup logic for position tests
   * @param params Parameters for setting up the position test
   * @returns Object containing all necessary accounts and IDs for position tests
   */
  public static async setupPositionTest(params: {
    client: TestClient;
    ticker?: string;
  }): Promise<{
    user: Keypair;
    matcher: Keypair;
    nonMatcher: Keypair;
    userClient: TestClient;
    matcherClient: TestClient;
    nonMatcherClient: TestClient;
    liquidator: Keypair;
    liquidatorClient: TestClient;
    basktId: PublicKey;
    collateralMint: PublicKey;
    userTokenAccount: PublicKey;
    assetId: PublicKey;
    lpMint: PublicKey;
    liquidityPool: PublicKey;
    usdcVault: PublicKey;
  }> {
    const {
      client,
      ticker = 'BTC',
    } = params;

    // Initialize protocol and roles
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);
    const matcher = globalAccounts.matcher;

    // Create test-specific accounts
    const user = Keypair.generate();
    const nonMatcher = Keypair.generate();

    // Fund the test-specific accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(nonMatcher.publicKey, client.connection);

    // Create user clients
    const userClient = await TestClient.forUser(user);
    const matcherClient = await TestClient.forUser(matcher);
    const nonMatcherClient = await TestClient.forUser(nonMatcher);

    // Enable features for testing
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: true,
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });

    // Create a synthetic asset
    const assetResult = await client.addAsset(ticker, {
      allowLongs: true,
      allowShorts: true,
    });
    const assetId = assetResult.assetAddress;

    // Format asset config correctly
    const formattedAssetConfig = {
      weight: new BN(10000), // 100% weight (10000 bps)
      direction: true, // Long direction
      assetId: assetId, // Include the asset ID in the config
      baselinePrice: new BN(0), // Required by OnchainAssetConfig interface
    };

    const { basktId: createdBasktId } = await client.createBaskt(
      [formattedAssetConfig], 
      true, // isPublic
    );
    const basktId = createdBasktId;


    // Activate the baskt with initial prices
    // Since weight is 100% (10000 bps), the asset price should equal the target NAV
    await client.activateBaskt(
      basktId,
      [calculateNAVWithPrecision(100)], // NAV = 100 with proper precision
    );

    // Use the USDC mock token for collateral
    const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

    // Create token accounts for the test
    const userTokenAccount = await client.getOrCreateUSDCAccountKey(user.publicKey);

    // Mint USDC tokens to user (enough for all tests including high price scenarios)
    await client.mintUSDC(
      userTokenAccount,
      calculateNAVWithPrecision(10000).toNumber(), // 10,000 USDC for all tests
    );

    // Set up a minimal liquidity pool (required for registry initialization)
    const { lpMint, liquidityPool, usdcVault } = await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      collateralMint,
    });

    // Get global test accounts



    return {
      user,
      matcher,
      nonMatcher,
      userClient,
      liquidator: globalAccounts.liquidator,
      liquidatorClient: await TestClient.forUser(globalAccounts.liquidator),
      matcherClient,
      nonMatcherClient,
      basktId,
      collateralMint,
      userTokenAccount,
      assetId,
      lpMint,
      liquidityPool,
      usdcVault,
    };
  }

  /**
   * Set up standard test assets with various permissions
   * This centralizes common asset creation logic used across test files
   * @param client The test client to use
   * @returns Object containing all created asset IDs
   */
  public static async setupTestAssets(client: TestClient): Promise<{
    btcAssetId: { assetAddress: PublicKey; txSignature: string | null };
    ethAssetId: { assetAddress: PublicKey; txSignature: string | null };
    dogeAssetId: { assetAddress: PublicKey; txSignature: string | null };
    longOnlyAssetId: { assetAddress: PublicKey; txSignature: string | null };
    shortOnlyAssetId: { assetAddress: PublicKey; txSignature: string | null };
  }> {
    // Create standard assets
    const btcAssetId = await client.addAsset('BTC');
    const ethAssetId = await client.addAsset('ETH');
    const dogeAssetId = await client.addAsset('DOGE');

    // Create assets with specific permissions
    const longOnlyPermissions = {
      allowLongs: true,
      allowShorts: false,
    };
    const longOnlyAssetId = await client.addAsset('LONG_ONLY', longOnlyPermissions);

    const shortOnlyPermissions = {
      allowLongs: false,
      allowShorts: true,
    };
    const shortOnlyAssetId = await client.addAsset('SHORT_ONLY', shortOnlyPermissions);

    return {
      btcAssetId,
      ethAssetId,
      dogeAssetId,
      longOnlyAssetId,
      shortOnlyAssetId,
    };
  }

  /**
   * Reset feature flags to enabled state
   * This centralizes the feature flag reset logic that was previously duplicated across test files
   * @param client The test client to use
   * @returns The transaction signature
   */
  public static async resetFeatureFlags(client: TestClient): Promise<string> {
    try {
      const resetSig = await client.updateFeatureFlags({
        allowAddLiquidity: true,
        allowRemoveLiquidity: true,
        allowOpenPosition: true,
        allowClosePosition: true,
        allowPnlWithdrawal: true,
        allowCollateralWithdrawal: true,
        allowAddCollateral: true,
        allowBasktCreation: true,
        allowBasktUpdate: true,
        allowTrading: true,
        allowLiquidations: true,
      });

      // Wait for transaction confirmation
      await waitForTx(client.connection, resetSig);
      await waitForNextSlot(client.connection);

      return resetSig;
    } catch (error) {
      // Log error but don't throw to avoid masking test failures
      console.warn('Error resetting feature flags:', error);
      return '';
    }
  }

  /**
   * Initialize test roles
   * This must be called before using the test client
   */
  public async initializeRoles(): Promise<void> {
    // Add roles to test accounts
    await this.addRole(this.assetManager.publicKey, AccessControlRole.AssetManager);
    await this.addRole(this.basktManager.publicKey, AccessControlRole.BasktManager);
  }

  public async addAsset(
    ticker: string,
    permissions?: OnchainAssetPermissions,
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

  /**
   * Wait for a specified amount of time (useful for grace period testing)
   * @param seconds Number of seconds to wait
   */
  public async waitForSeconds(seconds: number) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  /**
   * Execute a transaction with enhanced retry logic for test environment
   * @param txFunction Function that returns a transaction promise
   * @param maxRetries Maximum number of retries
   * @param retryDelay Delay between retries in milliseconds
   */
  public async executeWithRetry<T>(txFunction: () => Promise<T>): Promise<T> {
    return await txFunction();
  }

  /**
   * Create a token account for a user
   * @param mint The mint public key
   * @param owner The owner of the token account
   * @returns The token account public key
   */
  public async createTokenAccount(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      this.program.provider?.connection,
      this.program.provider?.wallet?.payer as Keypair,
      mint,
      owner,
    );
    return tokenAccount.address;
  }

  /**
   * Creates a USDC token account for the specified owner if it doesn't exist
   * @param owner Owner of the token account
   * @returns Public key of the token account
   */
  public async getOrCreateUSDCAccountKey(owner: PublicKey): Promise<PublicKey> {
    // Find the associated token address
    const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner);

    try {
      // Check if account exists
      await getAccount(this.program.provider.connection, tokenAccount);
      return tokenAccount;
    } catch (error) {
      // If account doesn't exist, create it
      const provider = this.program.provider as anchor.AnchorProvider | undefined;
      if (!provider) {
        throw new Error('Provider is undefined');
      }
      const payer = provider.wallet.payer as Keypair;
      await createAssociatedTokenAccount(provider.connection, payer, USDC_MINT, owner);
      return tokenAccount;
    }
  }
  public async getOrCreateUSDCAccount(owner: PublicKey, ownerOffCurve: boolean = false){
    // USDC mint address from constants

    // Find the associated token address
    const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, owner, ownerOffCurve);

    try {
      // Check if account exists
      return await getAccount(this.program.provider.connection, tokenAccount);
    } catch (error) {
      // If account doesn't exist, create it
      const provider = this.program.provider as anchor.AnchorProvider | undefined;
      if (!provider) {
        throw new Error('Provider is undefined');
      }
      const payer = provider.wallet.payer as Keypair;
      await createAssociatedTokenAccount(provider.connection, payer, USDC_MINT, owner, undefined, undefined, undefined, ownerOffCurve);
      return await getAccount(this.program.provider.connection, tokenAccount);
    }
  }

  /**
   * Mints USDC tokens to a specified token account
   * Uses our mock USDC with controlled mint authority
   * @param destination Token account to receive the tokens
   * @param amount Amount to mint (in native units)
   * @returns Transaction signature
   */
  public async mintUSDC(destination: PublicKey, amount: number | BN): Promise<string> {
    const provider = this.program.provider as anchor.AnchorProvider;
    const payer = provider.wallet.payer as Keypair;
    const usdcMint = USDC_MINT;
    // Convert amount for minting
    const mintAmount = typeof amount === 'number' ? amount : BigInt(amount.toString());

    const usdcMintAccount = await getMint(provider.connection, usdcMint);
    if (!usdcMintAccount) {
      throw new Error('USDC mint account not found');
    }

    // Mint USDC tokens to the destination account
    const signature = await mintTo(
      provider.connection,
      payer, // Payer for transaction fees
      usdcMint,
      destination,
      payer, // Use our controlled mint authority
      mintAmount,
    );
    await provider.connection.confirmTransaction(signature, 'confirmed');
    return signature;
  }

  /**
   * Initialize a liquidity pool for testing
   * @param params Parameters for initializing the liquidity pool
   * @returns The liquidity pool public key and transaction signature
   */
  public async setupLiquidityPool(params: {
    depositFeeBps: number;
    withdrawalFeeBps: number;
    collateralMint: PublicKey;
  }): Promise<{
    liquidityPool: PublicKey;
    lpMint: PublicKey;
    usdcVault: PublicKey;
    poolAuthority: PublicKey;
    txSignature: string;
  }> {
    // Find the liquidity pool PDA
    const liquidityPool = this.liquidityPoolPDA;

    // Find the pool authority PDA
    const poolAuthority = this.poolAuthorityPDA;

    let lpMint: PublicKey;
    let [usdcVault]: [PublicKey, number] = await super.getUsdcVaultPda();
    let txSignature: string;
    try {
      // Check if liquidity pool already exists
      const poolAccount = await this.program.account.liquidityPool.fetch(liquidityPool);
      // Pool already exists, reuse existing accounts
      lpMint = poolAccount.lpMint;
      usdcVault = poolAccount.usdcVault;
      txSignature = '';
    } catch (error: any) {
      // Pool doesn't exist, initialize it
      const lpMintKeypair = Keypair.generate();
      lpMint = lpMintKeypair.publicKey;

      // Initialize the liquidity pool with keypairs as signers
      txSignature = await super.initializeLiquidityPool(
        params.depositFeeBps,
        params.withdrawalFeeBps,
        lpMint,
        params.collateralMint,
        lpMintKeypair,
      );
    }

    return {
      liquidityPool,
      lpMint,
      usdcVault,
      poolAuthority,
      txSignature,
    };
  }

  /**
   * Add liquidity to the pool
   * @param params Parameters for adding liquidity
   * @returns Transaction signature
   */
  public async addLiquidityToPool(params: {
    liquidityPool: PublicKey;
    amount: BN;
    minSharesOut: BN;
    providerTokenAccount: PublicKey;
    usdcVault: PublicKey;
    providerLpAccount: PublicKey;
    lpMint: PublicKey;
    treasuryTokenAccount: PublicKey;
    treasury: PublicKey;
  }): Promise<string> {
    // Add liquidity
    return await super.addLiquidity(
      params.liquidityPool,
      params.amount,
      params.minSharesOut,
      params.providerTokenAccount,
      params.usdcVault,
      params.providerLpAccount,
      params.lpMint,
      params.treasuryTokenAccount,
      params.treasury,
    );
  }

  /**
   * Remove liquidity from the pool
   * @param params Parameters for removing liquidity
   * @returns Transaction signature
   */
  public async removeLiquidityFromPool(params: {
    liquidityPool: PublicKey;
    lpAmount: BN;
    minTokensOut: BN;
    providerTokenAccount: PublicKey;
    usdcVault: PublicKey;
    providerLpAccount: PublicKey;
    lpMint: PublicKey;
    treasuryTokenAccount: PublicKey;
    treasury: PublicKey;
  }): Promise<string> {
    // Remove liquidity
    // return await super.removeLiquidity(
    //   params.liquidityPool,
    //   params.lpAmount,
    //   params.minTokensOut,
    //   params.providerTokenAccount,
    //   params.usdcVault,
    //   params.providerLpAccount,
    //   params.lpMint,
    //   params.treasuryTokenAccount,
    //   params.treasury,
    // );
    return '';
  }

  /**
   * Queue a withdrawal request
   * @param lpAmount Amount of LP tokens to queue for withdrawal
   * @param providerTokenAccount Provider's token account for receiving funds
   * @param providerLpAccount Provider's LP token account
   * @param lpMint LP token mint
   * @returns Transaction signature
   */
  public async queueWithdrawLiquidityFromPool(
    lpAmount: BN,
    providerTokenAccount: PublicKey,
    providerLpAccount: PublicKey,
    lpMint: PublicKey,
  ): Promise<string> {
    return await super.queueWithdrawLiquidity(
      lpAmount,
      providerTokenAccount,
      providerLpAccount,
      lpMint,
    );
  }

  /**
   * Process withdrawal queue from pool
   * @param withdrawRequest Withdraw request account address
   * @param providerTokenAccount Provider token account address
   * @returns Transaction signature
   */
  public async processWithdrawQueueFromPool(
    provider: PublicKey,
    withdrawRequest: PublicKey,
    providerTokenAccount: PublicKey,
  ): Promise<string> {
    // Get the provider from the withdraw request account
    
    return await super.processWithdrawQueue(
      provider,
      withdrawRequest,
      providerTokenAccount,
    );
  }

 

  /**
   * Setup a complete liquidity pool with initial liquidity
   * @param params Parameters for setting up the liquidity pool
   * @returns All the accounts and transaction signatures
   */
  public async setupLiquidityPoolWithLiquidity(params: {
    depositFeeBps: number;
    withdrawalFeeBps: number;
    minDeposit: BN;
    initialDeposit: BN;
    provider: Keypair;
  }): Promise<{
    liquidityPool: PublicKey;
    lpMint: PublicKey;
    usdcVault: PublicKey;
    poolAuthority: PublicKey;
    collateralMint: PublicKey;
    providerTokenAccount: PublicKey;
    providerLpAccount: PublicKey;
    treasuryTokenAccount: PublicKey;
    initTxSignature: string;
    depositTxSignature: string;
  }> {
    // Use the USDC mint for pool collateral
    const collateralMint = USDC_MINT;

    // Create or fetch USDC token accounts for provider and treasury
    const providerTokenAccount = await this.getOrCreateUSDCAccountKey(params.provider.publicKey);
    const treasuryTokenAccount = await this.getOrCreateUSDCAccountKey(this.treasury.publicKey);

    // Mint USDC tokens to provider (10x for multiple tests)
    await this.mintUSDC(providerTokenAccount, params.initialDeposit.muln(10));

    // Setup liquidity pool
    const {
      liquidityPool,
      lpMint,
      usdcVault,
      poolAuthority,
      txSignature: initTxSignature,
    } = await this.setupLiquidityPool({
      depositFeeBps: params.depositFeeBps,
      withdrawalFeeBps: params.withdrawalFeeBps,
      collateralMint,
    });

    // Create provider LP token account
    const providerLpAccount = await createAssociatedTokenAccount(
      this.program.provider.connection,
      (this.program.provider as anchor.AnchorProvider).wallet.payer as Keypair,
      lpMint,
      params.provider.publicKey,
    );

    // Calculate expected fee and shares
    const expectedFeeAmount = params.initialDeposit.muln(params.depositFeeBps).divn(10000);
    const expectedNetDeposit = params.initialDeposit.sub(expectedFeeAmount);

    // Note: The treasury role should be added before calling this method
    // The test already adds the Treasury role to the treasury account

    // Create a client for the provider to ensure proper transaction signing
    const providerClient = await TestClient.forUser(params.provider);

    // Add initial liquidity using the provider's client
    const depositTxSignature = await providerClient.addLiquidityToPool({
      liquidityPool,
      amount: params.initialDeposit,
      minSharesOut: expectedNetDeposit, // For first deposit, LP tokens = net deposit
      providerTokenAccount,
      usdcVault,
      providerLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: this.treasury.publicKey,
    });

    return {
      liquidityPool,
      lpMint,
      usdcVault,
      poolAuthority,
      collateralMint,
      providerTokenAccount,
      providerLpAccount,
      treasuryTokenAccount,
      initTxSignature,
      depositTxSignature,
    };
  }

  public async createAndOpenMarketPosition(params: {
    userClient: TestClient;
    orderId: number;
    positionId: number;
    basktId: PublicKey;
    notionalValue: BN;
    collateral: BN;
    isLong: boolean;
    entryPrice: BN;
    ownerTokenAccount: PublicKey;
    leverageBps: BN;
  }): Promise<{
    orderTx: string;
    openPositionTx: string;
  }> { 

    const orderPDA = await params.userClient.getOrderPDA(params.orderId, params.userClient.publicKey);
    const orderTx = await params.userClient.createMarketOpenOrder({
      orderId: params.orderId,
      basktId: params.basktId,
      notionalValue: params.notionalValue,
      collateral: params.collateral,
      isLong: params.isLong,
      leverageBps: params.leverageBps,
      ownerTokenAccount: params.ownerTokenAccount,
    });

    const openPositionTx = await this.openPosition({
      positionId: params.positionId,
      entryPrice: params.entryPrice,
      order: orderPDA,
      baskt: params.basktId,
      orderOwner: params.userClient.publicKey,
    });

    return {
      orderTx,
      openPositionTx,
    };
  }

  public async createAndOpenLimitPosition(params: {
    userClient: TestClient;
    orderId: number;
    positionId: number;
    basktId: PublicKey;
    notionalValue: BN;
    collateral: BN;
    isLong: boolean;
    entryPrice: BN;
    limitPrice: BN;
    maxSlippageBps: BN;
    ownerTokenAccount: PublicKey;
    leverageBps: BN;
  }): Promise<{
    orderTx: string;
    openPositionTx: string;
  }> { 

    const orderPDA = await params.userClient.getOrderPDA(params.orderId, params.userClient.publicKey);
    const orderTx = await params.userClient.createLimitOpenOrder({
      orderId: params.orderId,
      basktId: params.basktId,
      notionalValue: params.notionalValue,
      collateral: params.collateral,
      isLong: params.isLong,
      leverageBps: params.leverageBps,
      limitPrice: params.limitPrice,
      maxSlippageBps: params.maxSlippageBps,
      ownerTokenAccount: params.ownerTokenAccount,
    });

    const openPositionTx = await this.openPosition({
      positionId: params.positionId,
      entryPrice: params.entryPrice,
      order: orderPDA,
      baskt: params.basktId,
      orderOwner: params.userClient.publicKey,
    });

    return {
      orderTx,
      openPositionTx,
    };
  }

  public async createAndCloseMarketPosition(params: {
    position: PublicKey;
    userClient: TestClient;
    orderId: number;
    positionId: number;
    basktId: PublicKey;
    exitPrice: BN;
    sizeAsContracts: BN;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {

    const treasury = (await this.getProtocolAccount()).treasury;
    const treasuryTokenAccount = await this.getOrCreateUSDCAccountKey(treasury);

    await params.userClient.createMarketCloseOrder({
      orderId: params.orderId,
      basktId: params.basktId,
      sizeAsContracts: params.sizeAsContracts,
      targetPosition: params.position,
      ownerTokenAccount: params.ownerTokenAccount,
    });

    const closePositionTx = await this.closePosition({
      position: params.position,
      exitPrice: params.exitPrice,
      baskt: params.basktId,
      ownerTokenAccount: params.ownerTokenAccount,
      treasury: treasury,
      treasuryTokenAccount: treasuryTokenAccount,
      orderOwner: params.userClient.publicKey,
      sizeToClose: params.sizeAsContracts,
      orderPDA: await params.userClient.getOrderPDA(params.orderId, params.userClient.publicKey),
    });

    return closePositionTx;
  }

  public async cancelOrder(params: {
    orderPDA: PublicKey;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    // Fetch the order account to get its data, especially order_id if needed by BaseClient.cancelOrder
    // The TestClient itself might be instantiated for a specific user (owner of the order)
    const orderAccount = await this.program.account.order.fetch(params.orderPDA);
    const orderId = new BN(orderAccount.orderId);

    return await super.cancelOrderTx(params.orderPDA, orderId, params.ownerTokenAccount);
  }

  /**
   * Force close a position after baskt settlement (BasktManager only)
   * @param params Parameters for force closing a position
   * @returns Transaction signature
   */
  public async forceClosePosition(params: {
    position: PublicKey;
    closePrice: BN;
    baskt: PublicKey;
    ownerTokenAccount: PublicKey;
    sizeToClose?: BN; // Optional parameter for partial force close
  }): Promise<string> {
    // Use treasury accounts from the test client
    const treasury = (await this.getProtocolAccount()).treasury;
    const treasuryTokenAccount = await this.getOrCreateUSDCAccountKey(treasury);

    return await super.forceClosePosition({
      position: params.position,
      closePrice: params.closePrice,
      baskt: params.baskt,
      ownerTokenAccount: params.ownerTokenAccount,
      treasury: treasury,
      treasuryTokenAccount: treasuryTokenAccount,
      sizeToClose: params.sizeToClose,
    });
  }

  public async initializeProtocol(treasury: PublicKey) {
    // await requestAirdrop(this.publicKey, this.connection);
    return await super.initializeProtocol(treasury);
  }

  public async openAndClosePosition(params: {
    userClient: TestClient;
    basktId: PublicKey;
    notionalValue: BN;
    collateral: BN;
    isLong: boolean;
    entryPrice: BN;
    exitPrice: BN;
    leverageBps: BN;
    sizePercentageToClose: BN;
  }): Promise<{
    snapshotBefore: PositionSnapshot;
    snapshotAfter: PositionSnapshot;
    sizeClosed: BN;
    positionId: number;
  }> {

    const ownerTokenAccount = await params.userClient.getOrCreateUSDCAccountKey(params.userClient.publicKey);

    const positionId = this.newUID();
    const positionPDA = await this.getPositionPDA(params.userClient.publicKey, positionId);

    const orderId = this.newUID();

    await this.createAndOpenMarketPosition({
      userClient: params.userClient,
      orderId: orderId,
      positionId: positionId,
      basktId: params.basktId,
      notionalValue: params.notionalValue,
      collateral: params.collateral,  
      isLong: params.isLong,
      entryPrice: params.entryPrice,
      ownerTokenAccount: ownerTokenAccount,
      leverageBps: params.leverageBps,
    });

    await expectAccountNotFound(this.connection, await this.getOrderPDA(orderId, params.userClient.publicKey));

    const snapshotBefore = await this.snapshotPositionBalances(positionPDA, params.userClient.publicKey);

    const sizeToClose = snapshotBefore.positionAccount!.size.mul(params.sizePercentageToClose).div(new BN(10000));

    const closeOrderId = this.newUID();

    await this.createAndCloseMarketPosition({
      position: positionPDA,
      userClient: params.userClient,
      orderId: closeOrderId,
      positionId: positionId,
      basktId: params.basktId,
      exitPrice: params.exitPrice,
      sizeAsContracts: sizeToClose,
      ownerTokenAccount: ownerTokenAccount,
    });

    await expectAccountNotFound(this.connection, await this.getOrderPDA(closeOrderId, params.userClient.publicKey));

    const snapshotAfter = await this.snapshotPositionBalances(positionPDA, params.userClient.publicKey);

    return {
      snapshotBefore,
      snapshotAfter,
      sizeClosed: sizeToClose,
      positionId: positionId,
    }
  }

    


  public async snapshotPositionBalances(position: PublicKey, positionOwner: PublicKey, basktId?: PublicKey): Promise<PositionSnapshot> {
    const globalAccounts = await TestClient.getGlobalTestAccounts();
    const treasuryBalance = await this.getUSDCAccount(globalAccounts.treasury.publicKey);
    const userUSDCBalance = await this.getUSDCAccount(positionOwner);
    
    const liquidityPool = await this.getLiquidityPool();
    const poolUSDCBalance = await getAccount(this.connection, liquidityPool.usdcVault);

    const escrowAccount = await this.getPositionEscrow(position);
    let escrowBalance = new BN(0);
    try {
      escrowBalance = new BN((await getAccount(this.connection, escrowAccount)).amount);
    } catch (error) {
      escrowBalance = new BN(0);
    }

    let positionAccount 
    try {
      positionAccount = await this.getPosition(position);
    } catch (error) {
      positionAccount = undefined;
    }

    let basktState;
    if (basktId) {
      try {
        basktState = await this.getBasktRaw(basktId);
      } catch (error) {
        basktState = undefined;
      }
    } else if (positionAccount) {
      try {
        basktState = await this.getBasktRaw(positionAccount.basktId);
      } catch (error) {
        basktState = undefined;
      }
    }

    return {
      positionAccount,
      trasuryBalance: new BN(treasuryBalance.amount), 
      poolUSDCBalance: new BN(poolUSDCBalance.amount),
      userUSDCBalance: new BN(userUSDCBalance.amount), 
      escrowBalance: escrowBalance, 
      poolState: liquidityPool,
      basktState,
    }
  }

  public async verifyClose({
    entryPrice,
    exitPrice,
    sizeClosed,    
    snapshotBefore,
    snapshotAfter,
    basktId,
    isBadDebt = false,
    feeBps = new BN(0),
    rebalanceFeePerUnitDiff = new BN(0),
    isLiquidation = false,
  }: {
    collateralRatioBps: BN;
    entryPrice: BN;
    exitPrice: BN;
    sizeClosed: BN;
    snapshotBefore: PositionSnapshot;
    snapshotAfter: PositionSnapshot;
    basktId?: PublicKey;
    isBadDebt?: boolean;
    feeBps?: BN;
    rebalanceFeePerUnitDiff?: BN;
    isLiquidation?: boolean;
  }) {

   const fundingAccumulated = snapshotBefore.positionAccount?.fundingAccumulated || new BN(0);
   const closeFee = feeBps.gt(new BN(0)) ? feeBps : (await this.getProtocolAccount()).config.closingFeeBps;

   const sizePercentageClosed = sizeClosed.mul(new BN(10000)).div(snapshotBefore.positionAccount?.size || new BN(1));

   // Calculate rebalance fee owed: (position_size * rebalance_fee_per_unit) / PRICE_PRECISION
   // Note: We charge the FULL rebalance fee even for partial closes

   let totalExitNotional = snapshotBefore.positionAccount!.size.mul(exitPrice).div(PRICE_PRECISION);
   let rebalanceFeeOwed = rebalanceFeePerUnitDiff.mul(totalExitNotional).div(BPS_DIVISOR);


   const settlementDetails = calculateSettlementDetails(
    snapshotBefore.escrowBalance.mul(sizePercentageClosed).div(new BN(10000)), // Escrow balance is the total collateral, so we need to multiply by the size percentage closed
    sizeClosed,
    closeFee,
    fundingAccumulated,
    entryPrice,
    exitPrice,
    snapshotBefore.positionAccount?.isLong || false,
    new BN(1000), // 10%
    rebalanceFeeOwed,
    isLiquidation,
   )  

   expect(settlementDetails.isBadDebt).to.be.equal(isBadDebt);

   const isFullClose = snapshotBefore.positionAccount?.size.eq(sizeClosed);
   const isPartialClose = !isFullClose;

   // 1. Position size verification
   expect(snapshotBefore.positionAccount!.size.sub(sizeClosed).eq(snapshotAfter.positionAccount?.size || new BN(0))).to.be.true;

   // 2. Position collateral verification (proportional reduction)
  const expectedRemainingCollateral = snapshotBefore.positionAccount?.collateral.sub(
       snapshotBefore.positionAccount.collateral.mul(sizePercentageClosed).div(new BN(10000))
    );
  expect(new BN(snapshotAfter.positionAccount?.collateral.toString() || '0').eq(expectedRemainingCollateral || new BN(0))).to.be.true;

   // 3. Position status verification
   if (isPartialClose && snapshotAfter.positionAccount) {
     expect(snapshotAfter.positionAccount.status).to.equal('OPEN');
   }

   // 4. Treasury fee collection
   expect(settlementDetails.feeToTreasury.eq(snapshotAfter.trasuryBalance.sub(snapshotBefore.trasuryBalance))).to.be.true;
   
   // 5. Pool balance changes
   const netPoolDelta = settlementDetails.escrowToBLP.sub(settlementDetails.poolToUser);
   expect(netPoolDelta.eq(snapshotAfter.poolUSDCBalance.sub(snapshotBefore.poolUSDCBalance))).to.be.true;
  
   // 6. Pool state consistency
   const poolState = await this.getLiquidityPool();
   expect(poolState.totalLiquidity.eq(snapshotAfter.poolUSDCBalance)).to.be.true;

   // 7. User payout verification
   const userDelta = settlementDetails.expectedUserPayout;
   expect(userDelta.eq(snapshotAfter.userUSDCBalance.sub(snapshotBefore.userUSDCBalance))).to.be.true;

   // 8. Baskt open position count (for full closes)
   if (isFullClose && basktId) {
     const basktBefore = snapshotBefore.basktState;
     const basktAfter = await this.getBasktRaw(basktId);
     expect(new BN(basktAfter.openPositions).eq(new BN(basktBefore?.openPositions || 0).sub(new BN(1)))).to.be.true;
   }

   // 9. Account closures (for full closes)
   if (isFullClose) {
    await expectAccountNotFound(this.connection, snapshotBefore.positionAccount?.positionPDA || new PublicKey(0));
    await expectAccountNotFound(this.connection, await this.getPositionEscrow(snapshotBefore.positionAccount?.positionPDA || new PublicKey(0)));  
   }

   // 10. Funding accumulated verification (proportional reduction for partial closes)
   if (isPartialClose && snapshotAfter.positionAccount && snapshotBefore.positionAccount) {
     const expectedRemainingFunding = snapshotBefore.positionAccount.fundingAccumulated.sub(
       fundingAccumulated.mul(sizePercentageClosed).div(new BN(10000))
     );
     expect(snapshotAfter.positionAccount.fundingAccumulated.eq(expectedRemainingFunding)).to.be.true;
   }

  }

}


export interface PositionSnapshot {
  positionAccount?: OnchainPosition;
  trasuryBalance: BN;
  poolUSDCBalance: BN;
  userUSDCBalance: BN;
  escrowBalance: BN;
  poolState: any;
  basktState?: any;
}

export function toObjectString(object: any) {
  const keys = Object.keys(object);
  const values = keys.map(key => object[key]);
  const string = keys.map((key, index) => `${key}: ${values[index] ? values[index].toString() : 'undefined'}`).join(',\n  ');
  return `{\n  ${string}\n}`;
}