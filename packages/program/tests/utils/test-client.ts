import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BaseClient, USDC_MINT } from '@baskt/sdk';
import { Baskt } from '../../target/types/baskt';
import { AccessControlRole, OnchainAssetPermissions } from '@baskt/types';
import { waitForTx, waitForNextSlot } from './chain-helpers';
import { calculateNAVWithPrecision } from './test-constants';
import {
  createAccount,
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
  mintTo,
  getAccount,
  getMint,
} from '@solana/spl-token';
import BN from 'bn.js';

/**
 * Helper function to request an airdrop for a given address
 * @param myAddress The address to fund
 * @param connection The connection to use
 */
export async function requestAirdrop(myAddress: PublicKey, connection: anchor.web3.Connection) {
  const signature = await connection.requestAirdrop(myAddress, LAMPORTS_PER_SOL * 10);
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
    matcher?: Keypair;
    liquidator?: Keypair;
    fundingManager?: Keypair;
    initialized: boolean;
  } = {
    initialized: false,
  };
  
  /**
   * Get or create global test accounts
   * This ensures we use the same accounts across all tests to avoid exceeding role limits
   * Note: Treasury is not included here as we use the client's treasury
   */
  public static async getGlobalTestAccounts() {
    if (!TestClient.globalTestAccounts.initialized) {
      TestClient.globalTestAccounts.matcher = Keypair.generate();
      TestClient.globalTestAccounts.liquidator = Keypair.generate();
      TestClient.globalTestAccounts.fundingManager = Keypair.generate();
      TestClient.globalTestAccounts.initialized = true;
    }

    return {
      matcher: TestClient.globalTestAccounts.matcher!,
      liquidator: TestClient.globalTestAccounts.liquidator!,
      fundingManager: TestClient.globalTestAccounts.fundingManager!,
    };
  }

  // Set up test accounts
  public assetManager: Keypair;
  public oracleManager: Keypair;
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
      provider // Pass the anchor provider
    );

    // Override the inherited program to use the provided program instance with its correct provider
    this.program = program;
    // Use the provider's public key instead of the global anchorProvider
    this.publicKey = provider.publicKey;

    this.assetManager = Keypair.generate();
    this.oracleManager = Keypair.generate();
    this.treasury = Keypair.generate();
  }

  public getPublicKey(): PublicKey {
    return this.publicKey;
  }

  public setPublicKey(publicKey: PublicKey): void {
    // WARNING: Changing the public key after construction can cause signature mismatches
    // Only use this method if you understand the implications
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
      anchor.workspace.baskt as Program<Baskt>,
    );

    // Create a new client with the user's program
    // Don't call setPublicKey - the constructor already sets it correctly from the provider
    const client = new TestClient(userProgram);
    return client;
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

    // Initialize TestClient roles (AssetManager, OracleManager)
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
    await client.getOrCreateUSDCAccount(client.treasury.publicKey);

    // Get current protocol state to check entry count
    let protocolAccount;
    try {
      protocolAccount = await client.getProtocolAccount();
      const entryCount = protocolAccount.accessControl.entries.length;
      // Removed console.log to avoid lint warnings

      if (entryCount >= 18) {
        // Removed console.warn to avoid lint warnings
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
    const providerTokenAccount = await client.getOrCreateUSDCAccount(provider.publicKey);
    const treasuryTokenAccount = await client.getOrCreateUSDCAccount(client.treasury.publicKey);

    // Mint USDC to provider
    await client.mintUSDC(providerTokenAccount, initialLiquidity.muln(2));

    // Setup liquidity pool
    const poolSetup = await client.setupLiquidityPool({
      depositFeeBps,
      withdrawalFeeBps,
      minDeposit,
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
    orderSize?: BN;
    collateralAmount?: BN;
    entryPrice?: BN;
    ticker?: string;
    isLong?: boolean;
  }): Promise<{
    user: Keypair;
    matcher: Keypair;
    nonMatcher: Keypair;
    userClient: TestClient;
    matcherClient: TestClient;
    nonMatcherClient: TestClient;
    basktId: PublicKey;
    collateralMint: PublicKey;
    userTokenAccount: PublicKey;
    assetId: PublicKey;
    fundingIndexPDA: PublicKey;
    orderId: BN;
    orderPDA: PublicKey;
    positionId: BN;
    positionPDA: PublicKey;
  }> {
    const {
      client,
      orderSize = new BN(10_000_000), // 10 units
      collateralAmount = new BN(1_200_000_000), // 1200 USDC
      entryPrice = calculateNAVWithPrecision(100), // NAV starts at 100 with proper precision
      ticker = 'BTC',
      isLong = true,
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

    // Create a baskt with the asset - use a unique name with timestamp
    const basktName = `TestBaskt_Position_${Date.now()}`;

    // Format asset config correctly
    const formattedAssetConfig = {
      weight: new BN(10000), // 100% weight (10000 bps)
      direction: true, // Long direction
      assetId: assetId, // Include the asset ID in the config
      baselinePrice: new BN(0), // Required by OnchainAssetConfig interface
    };

    const { basktId: createdBasktId } = await client.createBaskt(
      basktName,
      [formattedAssetConfig],
      true, // isPublic
    );
    const basktId = createdBasktId;

    // Activate the baskt with initial prices
    // Since weight is 100% (10000 bps), the asset price should equal the target NAV
    await client.activateBaskt(
      basktId,
      [calculateNAVWithPrecision(100)], // NAV = 100 with proper precision
      60, // maxPriceAgeSec
    );

    // Find the funding index PDA for the baskt
    const [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId,
    );

    // Initialize the funding index
    await client.program.methods
      .initializeFundingIndex()
      .accounts({
        authority: client.getPublicKey(),
        baskt: basktId,
      })
      .rpc();

    // Use the USDC mock token for collateral
    const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

    // Create token accounts for the test
    const userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);

    // Mint USDC tokens to user (enough for all tests including high price scenarios)
    await client.mintUSDC(
      userTokenAccount,
      calculateNAVWithPrecision(10000).toNumber(), // 10,000 USDC for all tests
    );

    // Set up a minimal liquidity pool (required for registry initialization)
    await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint,
    });

    // Generate unique IDs for order and position
    const orderId = new BN(Date.now());
    const positionId = new BN(Date.now() + 1);

    // Find the order and position PDAs
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Create an open order for testing
    await userClient.createOrder({
      orderId,
      size: orderSize,
      collateral: collateralAmount,
      isLong,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: entryPrice, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      leverageBps: new BN(10000), // 1x leverage
    });

    return {
      user,
      matcher,
      nonMatcher,
      userClient,
      matcherClient,
      nonMatcherClient,
      basktId,
      collateralMint,
      userTokenAccount,
      assetId,
      fundingIndexPDA,
      orderId,
      orderPDA,
      positionId,
      positionPDA,
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
    await this.addRole(this.oracleManager.publicKey, AccessControlRole.OracleManager);
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
  public async executeWithRetry<T>(
    txFunction: () => Promise<T>,
    maxRetries: number = 5, // Increased default retries for full test suite
    retryDelay: number = 3000 // Increased default delay for full test suite
  ): Promise<T> {
    // let lastError: Error;

    // for (let attempt = 1; attempt <= maxRetries; attempt++) {
    //   try {
    //     // Add a small delay before each attempt to reduce contention
    //     if (attempt > 1) {
    //       await new Promise(resolve => setTimeout(resolve, 1000));
    //     }

    //     return await txFunction();
    //   } catch (error: any) {
    //     lastError = error;

    //     // Check if it's a timeout error that we should retry
    //     if (error.message?.includes('Transaction was not confirmed') ||
    //         error.message?.includes('timeout') ||
    //         error.message?.includes('expired') ||
    //         error.message?.includes('blockhash not found')) {

    //       console.warn(`Transaction attempt ${attempt} failed with timeout, retrying in ${retryDelay}ms...`);

    //       if (attempt < maxRetries) {
    //         // Exponential backoff for full test suite environment
    //         const backoffDelay = retryDelay * Math.pow(1.5, attempt - 1);
    //         await new Promise(resolve => setTimeout(resolve, backoffDelay));
    //         continue;
    //       }
    //     }

    //     // For non-timeout errors or final attempt, throw immediately
    //     throw error;
    //   }
    // }

    // throw lastError!;
    return await txFunction();
  }

  /**
   * Create a token account for a user
   * @param mint The mint public key
   * @param owner The owner of the token account
   * @returns The token account public key
   */
  public async createTokenAccount(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    const provider = this.program.provider as anchor.AnchorProvider;
    const payer = provider.wallet.payer as Keypair;

    // Special handling for USDC mint
    if (mint.toString() === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
      return this.getOrCreateUSDCAccount(owner);
    }

    // Create the token account
    const tokenAccount = await createAccount(provider.connection, payer, mint, owner);

    return tokenAccount;
  }

  /**
   * Creates a USDC token account for the specified owner if it doesn't exist
   * @param owner Owner of the token account
   * @returns Public key of the token account
   */
  public async getOrCreateUSDCAccount(owner: PublicKey): Promise<PublicKey> {
    // USDC mint address from constants
    const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

    // Find the associated token address
    const tokenAccount = await getAssociatedTokenAddress(usdcMint, owner);

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
      await createAssociatedTokenAccount(provider.connection, payer, usdcMint, owner);
      return tokenAccount;
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
    minDeposit: BN;
    collateralMint: PublicKey;
  }): Promise<{
    liquidityPool: PublicKey;
    lpMint: PublicKey;
    tokenVault: PublicKey;
    poolAuthority: PublicKey;
    txSignature: string;
  }> {
    // Find the liquidity pool PDA
    const liquidityPool = await this.findLiquidityPoolPDA();

    // Find the pool authority PDA
    const poolAuthority = await this.findPoolAuthorityPDA();

    let lpMint: PublicKey;
    let [tokenVault]: [PublicKey, number] = await super.getTokenVaultPda();
    let txSignature: string;
    try {
      // Check if liquidity pool already exists
      const poolAccount = await this.program.account.liquidityPool.fetch(liquidityPool);
      // Pool already exists, reuse existing accounts
      lpMint = poolAccount.lpMint;
      tokenVault = poolAccount.tokenVault;
      txSignature = '';
    } catch (error: any) {
      // Pool doesn't exist, initialize it
      const lpMintKeypair = Keypair.generate();
      lpMint = lpMintKeypair.publicKey;

      // Initialize the liquidity pool with keypairs as signers
      txSignature = await super.initializeLiquidityPool(
        params.depositFeeBps,
        params.withdrawalFeeBps,
        params.minDeposit,
        lpMint,
        params.collateralMint,
        lpMintKeypair,
      );
    }

    return {
      liquidityPool,
      lpMint,
      tokenVault,
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
    tokenVault: PublicKey;
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
      params.tokenVault,
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
    tokenVault: PublicKey;
    providerLpAccount: PublicKey;
    lpMint: PublicKey;
    treasuryTokenAccount: PublicKey;
    treasury: PublicKey;
  }): Promise<string> {
    // Remove liquidity
    return await super.removeLiquidity(
      params.liquidityPool,
      params.lpAmount,
      params.minTokensOut,
      params.providerTokenAccount,
      params.tokenVault,
      params.providerLpAccount,
      params.lpMint,
      params.treasuryTokenAccount,
      params.treasury,
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
    tokenVault: PublicKey;
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
    const providerTokenAccount = await this.getOrCreateUSDCAccount(params.provider.publicKey);
    const treasuryTokenAccount = await this.getOrCreateUSDCAccount(this.treasury.publicKey);

    // Mint USDC tokens to provider (10x for multiple tests)
    await this.mintUSDC(providerTokenAccount, params.initialDeposit.muln(10));

    // Setup liquidity pool
    const {
      liquidityPool,
      lpMint,
      tokenVault,
      poolAuthority,
      txSignature: initTxSignature,
    } = await this.setupLiquidityPool({
      depositFeeBps: params.depositFeeBps,
      withdrawalFeeBps: params.withdrawalFeeBps,
      minDeposit: params.minDeposit,
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
      tokenVault,
      providerLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: this.treasury.publicKey,
    });

    return {
      liquidityPool,
      lpMint,
      tokenVault,
      poolAuthority,
      collateralMint,
      providerTokenAccount,
      providerLpAccount,
      treasuryTokenAccount,
      initTxSignature,
      depositTxSignature,
    };
  }

  public async createOrder(params: {
    orderId: BN;
    size: BN;
    collateral: BN;
    isLong: boolean;
    action: any; // e.g., { open: {} } or { close: {} }
    targetPosition: PublicKey | null;
    basktId: PublicKey;
    ownerTokenAccount: PublicKey;
    collateralMint: PublicKey; // Used as escrowMint in the program
    limitPrice?: BN; // Optional price with 6 decimals
    maxSlippageBps?: BN; // Optional slippage in BPS
    orderType?: any; // Optional order type, e.g., { market: {} } or { limit: {} }
    leverageBps?: BN; // Optional leverage in basis points (10000 = 1x leverage)
  }): Promise<string> {
    // If caller hasn't provided a limit price or slippage, fall back to safe defaults
    const limitPrice = params.limitPrice ?? new BN(50_000); // 0.05 USDC
    const maxSlippageBps = params.maxSlippageBps ?? new BN(100); // 1%

    return await super.createOrderTx(
      params.orderId,
      params.size,
      params.collateral,
      params.isLong,
      params.action,
      params.targetPosition,
      limitPrice,
      maxSlippageBps,
      params.basktId,
      params.ownerTokenAccount,
      params.collateralMint,
      params.leverageBps ?? new BN(10000), // Default to 1x leverage if not provided
      params.orderType ?? { market: {} }, // Default to market order if not provided
    );
  }

  public async cancelOrder(params: {
    orderPDA: PublicKey;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    // Fetch the order account to get its data, especially order_id if needed by BaseClient.cancelOrder
    // The TestClient itself might be instantiated for a specific user (owner of the order)
    const orderAccount = await this.program.account.order.fetch(params.orderPDA);
    const orderIdNum = orderAccount.orderId as BN; // Assuming orderId is stored as BN or compatible

    return await super.cancelOrderTx(params.orderPDA, orderIdNum, params.ownerTokenAccount);
  }
}
