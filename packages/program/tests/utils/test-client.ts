import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import { BaseClient } from '@baskt/sdk';
import { BasktV1 } from '../../target/types/baskt_v1';
import { AccessControlRole, OnchainAssetPermissions } from '@baskt/types';
import {
  createMint,
  createAccount,
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import BN from 'bn.js';
import * as fs from 'fs';
import path from 'path';

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
    const provider = program.provider as anchor.AnchorProvider;
    super(provider.connection, {
      sendAndConfirmLegacy: (tx) => provider.sendAndConfirm(tx),
      sendAndConfirmV0: (tx) => provider.sendAndConfirm(tx),
    });

    // Override the inherited program to use the provided program instance with its correct provider
    this.program = program;
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
   * Create a token account for a user
   * @param mint The mint public key
   * @param owner The owner of the token account
   * @returns The token account public key
   */
  public async createTokenAccount(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    const provider = this.program.provider as anchor.AnchorProvider;
    const payer = provider.wallet.payer as Keypair;

    // Special handling for USDC mint
    if (mint.toString() === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") {
      return this.getOrCreateUSDCAccount(owner);
    }

    // Create the token account
    const tokenAccount = await createAccount(
      provider.connection,
      payer,
      mint,
      owner
    );

    return tokenAccount;
  }
  
  /**
   * Creates a USDC token account for the specified owner if it doesn't exist
   * @param owner Owner of the token account
   * @returns Public key of the token account
   */
  public async getOrCreateUSDCAccount(owner: PublicKey): Promise<PublicKey> {
    // USDC mint address from constants
    const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    
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
      await createAssociatedTokenAccount(
        provider.connection,
        payer,
        usdcMint,
        owner
      );
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
    const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
    // Load mint authority from test-wallet.json
    const walletPath = path.resolve(process.cwd(), 'tests/utils/test-wallet.json');
    const secretKeyText = fs.readFileSync(walletPath, 'utf-8');
    const secretKey = Uint8Array.from(JSON.parse(secretKeyText));
    const mintAuthority = Keypair.fromSecretKey(secretKey);
    // Convert amount for minting
    const mintAmount = typeof amount === 'number' ? amount : BigInt(amount.toString());
    // Mint USDC tokens to the destination account
    const signature = await mintTo(
      provider.connection,
      payer, // Payer for transaction fees
      usdcMint,
      destination,
      mintAuthority, // Use our controlled mint authority
      mintAmount
    );
    await provider.connection.confirmTransaction(signature, 'confirmed');
    return signature;
  }

  /**
   * Find the liquidity pool PDA
   * @returns The liquidity pool PDA
   */
  public async findLiquidityPoolPDA(): Promise<PublicKey> {
    const [liquidityPool] = PublicKey.findProgramAddressSync(
      [Buffer.from('liquidity_pool'), this.protocolPDA.toBuffer()],
      this.program.programId,
    );
    return liquidityPool;
  }

  /**
   * Find the pool authority PDA
   * @param liquidityPool The liquidity pool PDA
   * @returns The pool authority PDA
   */
  public async findPoolAuthorityPDA(liquidityPool: PublicKey): Promise<PublicKey> {
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_authority'), liquidityPool.toBuffer(), this.protocolPDA.toBuffer()],
      this.program.programId,
    );
    return poolAuthority;
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
    const provider = this.program.provider as anchor.AnchorProvider;
    const payer = provider.wallet.payer as Keypair;

    // Find the liquidity pool PDA
    const liquidityPool = await this.findLiquidityPoolPDA();

    // Find the pool authority PDA
    const poolAuthority = await this.findPoolAuthorityPDA(liquidityPool);

    let lpMint: PublicKey;
    let tokenVault: PublicKey;
    let txSignature: string;
    try {
      // Generate keypairs for the LP mint and token vault
      const lpMintKeypair = Keypair.generate();
      const tokenVaultKeypair = Keypair.generate();
      lpMint = lpMintKeypair.publicKey;
      tokenVault = tokenVaultKeypair.publicKey;

      // Initialize the liquidity pool with keypairs as signers
      txSignature = await super.initializeLiquidityPool(
        params.depositFeeBps,
        params.withdrawalFeeBps,
        params.minDeposit,
        lpMint,
        tokenVault,
        params.collateralMint,
        lpMintKeypair,
        tokenVaultKeypair
      );
    } catch (error: any) {
      // If the liquidity pool has already been initialized, reuse existing accounts
      const poolAccount = await this.program.account.liquidityPool.fetch(liquidityPool);
      lpMint = poolAccount.lpMint;
      tokenVault = poolAccount.tokenVault;
      txSignature = '';
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
      params.treasury
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
      params.treasury
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
    treasury: Keypair;
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
    const collateralMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

    // Create or fetch USDC token accounts for provider and treasury
    const providerTokenAccount = await this.getOrCreateUSDCAccount(params.provider.publicKey);
    const treasuryTokenAccount = await this.getOrCreateUSDCAccount(params.treasury.publicKey);

    // Mint USDC tokens to provider (10x for multiple tests)
    await this.mintUSDC(
      providerTokenAccount,
      params.initialDeposit.muln(10)
    );

    // Setup liquidity pool
    const {
      liquidityPool,
      lpMint,
      tokenVault,
      poolAuthority,
      txSignature: initTxSignature
    } = await this.setupLiquidityPool({
      depositFeeBps: params.depositFeeBps,
      withdrawalFeeBps: params.withdrawalFeeBps,
      minDeposit: params.minDeposit,
      collateralMint
    });

    // Create provider LP token account
    const providerLpAccount = await createAssociatedTokenAccount(
      this.program.provider.connection,
      (this.program.provider as anchor.AnchorProvider).wallet.payer as Keypair,
      lpMint,
      params.provider.publicKey
    );

    // Calculate expected fee and shares
    const expectedFeeAmount = params.initialDeposit.muln(params.depositFeeBps).divn(10000);
    const expectedNetDeposit = params.initialDeposit.sub(expectedFeeAmount);

    // Note: The treasury role should be added before calling this method
    // The test already adds the Treasury role to the treasury account

    // Create a client for the provider to ensure proper transaction signing
    const providerClient = await TestClient.forUser(params.provider);
    
    // Double check the treasury token account ownership
    try {
      const treasuryTokenInfo = await getAccount(
        this.program.provider.connection,
        treasuryTokenAccount
      );
    } catch (error) {
      console.error("Error checking token account:", error);
    }
    
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
      treasury: params.treasury.publicKey
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
      depositTxSignature
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
  }): Promise<string> {
    // Ensure the TestClient's publicKey is set for this user context if it's different from the default
    // This is typically handled by TestClient.forUser(), which sets this.publicKey correctly.
    // The owner for the transaction will be this.getPublicKey() as called by super.createOrder()

    return await super.createOrderTx(
      params.orderId,
      params.size,
      params.collateral,
      params.isLong,
      params.action,
      params.targetPosition,
      params.basktId,
      params.ownerTokenAccount,
      params.collateralMint
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

    return await super.cancelOrderTx(
      params.orderPDA,
      orderIdNum,
      params.ownerTokenAccount
    );
  }

  /**
   * Open a position; wraps the program openPosition with all required account PDAs
   */
  public async openPosition(params: {
    positionId: BN;
    entryPrice: BN;
    order: PublicKey;
    position: PublicKey;
    fundingIndex: PublicKey;
    baskt: PublicKey;
  }): Promise<string> {
    // Fetch the order account to get the owner
    const orderAccount = await this.program.account.order.fetch(params.order);
    
    // Derive program authority PDA
    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      this.program.programId
    );
    // Use USDC escrow mint
    const escrowMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    // Derive user escrow account PDA using the order owner's key
    const [orderEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_escrow'), orderAccount.owner.toBuffer()],
      this.program.programId
    );
    // Derive position escrow PDA
    const [escrowToken] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.position.toBuffer()],
      this.program.programId
    );
    // Call openPosition with full account context
    return await this.program.methods
      .openPosition({ positionId: params.positionId, entryPrice: params.entryPrice })
      .accounts({
        matcher: this.getPublicKey(),
        order: params.order,
        position: params.position,
        fundingIndex: params.fundingIndex,
        baskt: params.baskt,
        protocol: this.protocolPDA,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        escrowMint: escrowMint,
        orderEscrow: orderEscrow,
        escrowToken: escrowToken,
        programAuthority: programAuthority,
        rent: SYSVAR_RENT_PUBKEY,
      } as any)
      .rpc();
  }

  /**
   * Add collateral to a position using the on-chain instruction
   */
  public async addCollateral(params: {
    position: PublicKey;
    additionalCollateral: BN;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    // Derive PDAs
    const [programAuthority] = PublicKey.findProgramAddressSync([
      Buffer.from('authority')
    ], this.program.programId);
    const [escrowToken] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.position.toBuffer()],
      this.program.programId
    );
    return await this.program.methods
      .addCollateral({ additionalCollateral: params.additionalCollateral })
      .accounts({
        owner: this.getPublicKey(),
        position: params.position,
        ownerToken: params.ownerTokenAccount,
        escrowToken: escrowToken,
        programAuthority: programAuthority,
        protocol: this.protocolPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .rpc();
  }

  /**
   * Close a position using the on-chain instruction
   */
  public async closePosition(params: {
    order: PublicKey;
    position: PublicKey;
    exitPrice: BN;
    fundingIndex: PublicKey;
    baskt: PublicKey;
    ownerTokenAccount: PublicKey;
    treasury: PublicKey;
    treasuryTokenAccount: PublicKey;
  }): Promise<string> {
    // Derive program authority and escrow token PDAs
    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      this.program.programId
    );
    const [escrowToken] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.position.toBuffer()],
      this.program.programId
    );
    // Derive liquidity pool PDAs and fetch token vault
    const liquidityPool = await this.findLiquidityPoolPDA();
    const poolAuthority = await this.findPoolAuthorityPDA(liquidityPool);
    const poolAccount = await this.program.account.liquidityPool.fetch(liquidityPool);
    const tokenVault = poolAccount.tokenVault;
    return await this.program.methods
      .closePosition({ exitPrice: params.exitPrice })
      .accounts({
        matcher: this.getPublicKey(),
        order: params.order,
        position: params.position,
        fundingIndex: params.fundingIndex,
        baskt: params.baskt,
        ownerToken: params.ownerTokenAccount,
        escrowToken: escrowToken,
        treasury: params.treasury,
        treasuryToken: params.treasuryTokenAccount,
        programAuthority: programAuthority,
        protocol: this.protocolPDA,
        // liquidity pool accounts for settlement
        liquidityPool: liquidityPool,
        tokenVault: tokenVault,
        poolAuthority: poolAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .rpc();
  }

  /**
   * Liquidate a position using the on-chain instruction
   */
  public async liquidatePosition(params: {
    position: PublicKey;
    exitPrice: BN;
    fundingIndex: PublicKey;
    baskt: PublicKey;
    ownerTokenAccount: PublicKey;
    treasury: PublicKey;
    treasuryTokenAccount: PublicKey;
  }): Promise<string> {
    // Derive program authority and escrow token PDAs
    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      this.program.programId
    );
    const [escrowToken] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.position.toBuffer()],
      this.program.programId
    );
    // Derive liquidity pool PDAs and fetch token vault
    const liquidityPool = await this.findLiquidityPoolPDA();
    const poolAuthority = await this.findPoolAuthorityPDA(liquidityPool);
    const poolAccount = await this.program.account.liquidityPool.fetch(liquidityPool);
    const tokenVault = poolAccount.tokenVault;
    return await this.program.methods
      .liquidatePosition({ exitPrice: params.exitPrice })
      .accounts({
        liquidator: this.getPublicKey(),
        position: params.position,
        fundingIndex: params.fundingIndex,
        baskt: params.baskt,
        ownerToken: params.ownerTokenAccount,
        escrowToken: escrowToken,
        treasury: params.treasury,
        treasuryToken: params.treasuryTokenAccount,
        programAuthority: programAuthority,
        protocol: this.protocolPDA,
        // liquidity pool accounts for settlement
        liquidityPool: liquidityPool,
        tokenVault: tokenVault,
        poolAuthority: poolAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      } as any)
      .rpc();
  }
}
