import * as anchor from '@coral-xyz/anchor';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { OracleHelper } from './utils/oracle-helper';
import BN from 'bn.js';
import { keccak256 } from 'js-sha3';

// Import the types from our local files
import type { BasktV1 } from './program/types';
import { stringToRole, toRoleString } from './utils/acl-helper';
import { createLookupTableInstructions, extendLookupTable } from './utils/lookup-table-helper';
import { BasktV1Idl } from './program/idl';
import {
  OnchainLightweightProvider,
  OnchainAssetPermissions,
  OnchainProtocolInterface,
  OnchainAsset,
  OnchainAssetConfig,
  AccessControlRole,
  OnchainOrder,
  OnchainPosition,
  OrderAction,
  OrderStatus,
  PositionStatus,
} from '@baskt/types';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { toU64LeBytes } from './utils';
import { USDC_MINT } from './utils/const';

/**
 * Abstract base client for Solana programs
 * Provides common functionality for program interaction
 */
export abstract class BaseClient {
  // Program and provider
  public program: anchor.Program<BasktV1>;
  public provider: OnchainLightweightProvider;
  public connection: Connection;
  // Protocol PDA
  public protocolPDA: PublicKey;

  // Helpers
  public oracleHelper: OracleHelper;

  // Default values
  protected readonly DEFAULT_PRICE = new BN(50000); // $50,000
  protected readonly DEFAULT_PRICE_EXPONENT = -6; // 6 decimal places
  protected readonly DEFAULT_PRICE_ERROR = new BN(100); // 1% (100 BPS)
  protected readonly DEFAULT_PRICE_AGE_SEC = 60; // 1 minute

  // Lookup table
  public lookupTable: PublicKey | undefined;

  constructor(
    connection: Connection,
    provider: OnchainLightweightProvider,
    userPublicKey?: PublicKey,
    anchorProvider?: anchor.AnchorProvider,
  ) {
    this.program = new anchor.Program<BasktV1>(BasktV1Idl, anchorProvider);
    this.connection = connection;
    this.provider = provider;

    // Initialize helpers
    this.oracleHelper = new OracleHelper(
      this.program,
      userPublicKey || this.getPublicKey(),
      this.provider,
    );

    // Derive protocol PDA
    [this.protocolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol')],
      this.program.programId,
    );
  }

  abstract getPublicKey(): PublicKey;

  /**
   * Update the price of a custom oracle
   * @param oracleAddress Address of the oracle to update
   * @param price New price value
   * @param ema EMA value
   * @param confidence Confidence interval (optional)
   */
  public async updateOraclePrice(oracleAddress: PublicKey, price: anchor.BN) {
    await this.oracleHelper.updateCustomOraclePrice(oracleAddress, price);
  }

  /**
   * Add a synthetic asset
   * @param assetId Asset ID (can be any unique PublicKey)
   * @param ticker Asset ticker symbol
   * @returns Transaction signature
   */
  /**
   * Helper method for creating asset parameters
   */
  public createAssetParams(
    ticker: string,
    oracleParams: Record<string, unknown>,
    permissions: OnchainAssetPermissions = { allowLongs: true, allowShorts: true },
  ) {
    // Create the asset parameters object
    return {
      ticker: ticker,
      oracle: oracleParams,
      permissions: permissions,
    };
  }

  /**
   * Initialize the protocol
   * @returns Transaction signature
   */
  public async initializeProtocol(): Promise<{
    initializeProtocolSignature: string;
    initializeLookupTableSignature: string | undefined;
  }> {
    // Derive program authority PDA
    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      this.program.programId,
    );

    const tx = await this.program.methods
      .initializeProtocol()
      .accountsPartial({
        authority: this.getPublicKey(),
        programAuthority: programAuthority,
      })
      .transaction();

    return {
      initializeProtocolSignature: await this.provider.sendAndConfirmLegacy(tx),
      initializeLookupTableSignature: await this.initializeLookupTable(),
    };
  }

  public async initializeLookupTable(): Promise<string | undefined> {
    if (this.lookupTable) {
      return undefined;
    }

    const { lookupTableAddress, createInstruction } = await createLookupTableInstructions(
      this.connection,
      this.getPublicKey(),
      this.getPublicKey(),
    );

    const transaction = new Transaction();

    transaction.add(createInstruction);

    if (!this.program.provider.sendAndConfirm) {
      return undefined;
    }

    const signature = await this.program.provider.sendAndConfirm(transaction);

    this.lookupTable = lookupTableAddress;

    return signature;
  }

  /**
   * Fetch the protocol account
   * @returns Protocol account data in a standardized format
   */
  public async getProtocolAccount(): Promise<OnchainProtocolInterface> {
    // Fetch the raw protocol account data
    const rawProtocol = await this.program.account.protocol.fetch(this.protocolPDA);

    // Convert the raw protocol account to our standardized ProtocolInterface
    return {
      isInitialized: rawProtocol.isInitialized,
      owner: rawProtocol.owner.toString(),
      accessControl: {
        entries: rawProtocol.accessControl.entries.map((entry) => ({
          account: entry.account.toString(),
          // Extract the role name from the enum object
          role: Object.keys(entry.role)[0],
        })),
      },
      featureFlags: {
        allowAddLiquidity: rawProtocol.featureFlags.allowAddLiquidity,
        allowRemoveLiquidity: rawProtocol.featureFlags.allowRemoveLiquidity,
        allowOpenPosition: rawProtocol.featureFlags.allowOpenPosition,
        allowClosePosition: rawProtocol.featureFlags.allowClosePosition,
        allowPnlWithdrawal: rawProtocol.featureFlags.allowPnlWithdrawal,
        allowCollateralWithdrawal: rawProtocol.featureFlags.allowCollateralWithdrawal,
        allowAddCollateral: rawProtocol.featureFlags.allowAddCollateral,
        allowBasktCreation: rawProtocol.featureFlags.allowBasktCreation,
        allowBasktUpdate: rawProtocol.featureFlags.allowBasktUpdate,
        allowTrading: rawProtocol.featureFlags.allowTrading,
        allowLiquidations: rawProtocol.featureFlags.allowLiquidations,
      },
    };
  }

  /**
   * Add a role to an account in the protocol
   * @param account Public key of the account to assign the role to
   * @param role AccessControlRole to assign
   * @returns Transaction signature
   */
  public async addRole(account: PublicKey, role: AccessControlRole): Promise<string> {
    // Submit the transaction to add the role
    const tx = await this.program.methods
      .addRole(role)
      .accounts({
        owner: this.getPublicKey(),
        account: account,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
  }

  /**
   * Remove a role from an account in the protocol
   * @param account Public key of the account to remove the role from
   * @param role AccessControlRole to remove
   * @returns Transaction signature
   */
  public async removeRole(account: PublicKey, role: AccessControlRole): Promise<string> {
    const roleEnum = typeof role === 'string' ? stringToRole(role) : role;
    // Submit the transaction to remove the role
    const tx = await this.program.methods
      .removeRole(parseInt(roleEnum.toString()))
      .accounts({
        owner: this.getPublicKey(),
        account: account,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
  }

  /**
   * Check if an account has a specific role
   * @param account Public key of the account to check
   * @param role AccessControlRole to check
   * @returns Boolean indicating if the account has the role
   */
  public async hasRole(account: PublicKey, role: AccessControlRole | string): Promise<boolean> {
    const protocol = await this.getProtocolAccount();
    const roleEnum = typeof role === 'string' ? stringToRole(role) : role;
    // Check if the account has the role
    if (!protocol.accessControl || !protocol.accessControl.entries) {
      return false;
    }
    // Convert role enum to string representation that matches Rust enum variant
    const roleString = toRoleString(roleEnum);

    return protocol.accessControl.entries.some(
      (entry) =>
        entry.account.toString() === account.toString() &&
        JSON.stringify(entry.role).toLowerCase().includes(roleString.toLowerCase()),
    );
  }

  /**
   * Check if an account has permission for a specific role (is owner or has the role)
   * @param account Public key of the account to check
   * @param role AccessControlRole to check
   * @returns Boolean indicating if the account has permission
   */
  public async hasPermission(
    account: PublicKey,
    role: AccessControlRole | string,
  ): Promise<boolean> {
    const protocol = await this.getProtocolAccount();
    // Check if account is the owner
    if (protocol.owner.toString() === account.toString()) {
      return true;
    }

    // Check if account has the specific role
    return await this.hasRole(account, role);
  }

  /**
   * Add a synthetic asset
   * @param ticker Asset ticker symbol
   * @param permissions Permissions for the asset
   * @returns Transaction signature and asset PDA
   */
  public async addAsset(
    ticker: string,
    permissions: OnchainAssetPermissions = {
      allowLongs: true,
      allowShorts: true,
    },
  ): Promise<{ txSignature: string; assetAddress: PublicKey }> {
    // Find the asset PDA
    const [assetAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('asset'), Buffer.from(ticker)],
      this.program.programId,
    );
    const postInstructions: TransactionInstruction[] = [];

    // Add the asset to the lookup table
    if (this.lookupTable) {
      postInstructions.push(
        await extendLookupTable(
          this.connection,
          this.lookupTable,
          this.getPublicKey(),
          this.getPublicKey(),
          [assetAddress],
        ),
      );
    }

    // Submit the transaction to add the asset
    const tx = await this.program.methods
      .addAsset({
        ticker,
        permissions: permissions,
      })
      .accounts({
        admin: this.getPublicKey(),
      })
      .postInstructions(postInstructions)
      .transaction();

    return { txSignature: await this.provider.sendAndConfirmLegacy(tx), assetAddress };
  }

  /**
   * Implementation of the abstract getProtocolAddress method from BaseClient
   * @returns The protocol PDA public key
   */
  protected getProtocolAddress(): PublicKey {
    return this.protocolPDA;
  }

  /**
   * Get an asset account by its public key
   * @param assetPublicKey Public key of the asset account
   * @returns Asset account data
   */
  public async getAssetRaw(assetPublicKey: PublicKey) {
    return await this.program.account.syntheticAsset.fetch(assetPublicKey);
  }

  /**
   * Get an asset account by its public key
   * @param assetPublicKey Public key of the asset account
   * @returns Asset account data
   */
  public async getAsset(assetPublicKey: PublicKey) {
    const asset = await this.getAssetRaw(assetPublicKey);
    return this.convertAsset(asset);
  }

  /**
   * Get all assets in the protocol
   * @returns Array of asset accounts with their public keys
   */
  public async getAllAssetsRaw() {
    return await this.program.account.syntheticAsset.all();
  }

  public async getAllOrdersRaw() {
    return await this.program.account.order.all();
  }

  public async getAllPositionsRaw() {
    return await this.program.account.position.all();
  }

  public async getAllBasktsRaw() {
    return await this.program.account.basktV1.all();
  }

  public async getOrder(orderPublicKey: PublicKey) {
    const order = await this.program.account.order.fetch(orderPublicKey);
    return this.convertOrder(order, orderPublicKey);
  }

  public async getPosition(positionPublicKey: PublicKey) {
    const position = await this.program.account.position.fetch(positionPublicKey);
    return this.convertPosition(position, positionPublicKey);
  }

  public async getAllOrders() {
    const orders = await this.getAllOrdersRaw();
    return orders.map((order) => this.convertOrder(order.account, order.publicKey));
  }

  public async getAllPositions() {
    const positions = await this.getAllPositionsRaw();
    return positions.map((position) => this.convertPosition(position.account, position.publicKey));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertAsset(account: any) {
    const newAccount = account.permissions ? account : account.account;
    return {
      address: newAccount.publicKey || account.publicKey || account.assetId,
      ticker: newAccount.ticker,
      permissions: {
        allowLongs: Boolean(newAccount.permissions.allowLongs),
        allowShorts: Boolean(newAccount.permissions.allowShorts),
      } as OnchainAssetPermissions,
      isActive: Boolean(newAccount.isActive),
      listingTime: new Date(newAccount.listingTime.toNumber() * 1000),
    } as OnchainAsset;
  }

  private convertOrder(order: any, orderAddress: PublicKey) {
    return {
      address: orderAddress,
      action: order.action?.open ? OrderAction.Open : OrderAction.Close,
      basktId: order.basktId,
      bump: order.bump,
      collateral: order.collateral,
      isLong: order.isLong,
      orderId: order.orderId,
      owner: order.owner,
      price: order.price,
      size: order.size,
      status: order.status?.pending
        ? OrderStatus.PENDING
        : order.status?.filled
        ? OrderStatus.FILLED
        : OrderStatus.CANCELLED,
      timestamp: order.timestamp,
      targetPosition: order.targetPosition,
      userPublicKey: order.userPublicKey,
    } as OnchainOrder;
  }

  private convertPosition(position: any, positionAddress: PublicKey) {
    return {
      address: positionAddress,
      positionId: position.positionId,
      basktId: position.basktId,
      bump: position.bump,
      owner: position.owner,
      size: position.size,
      collateral: position.collateral,
      isLong: position.isLong,
      timestamp: position.timestamp,
      targetOrder: position.targetOrder,
      userPublicKey: position.userPublicKey,
      entryPrice: position.entryPrice,
      entryPriceExponent: position.entryPriceExponent,
      status: position.status?.open
        ? PositionStatus.OPEN
        : position.status?.closed
        ? PositionStatus.CLOSED
        : PositionStatus.LIQUIDATED,
      timestampOpen: position.timestampOpen,
      timestampClose: position.timestampClose,
    } as OnchainPosition;
  }

  /**
   * Get all assets in the protocol in a structured format
   * @returns Array of Asset objects with standardized properties
   */
  public async getAllAssets() {
    const assetAccounts = await this.getAllAssetsRaw();
    return assetAccounts.map((account) => this.convertAsset(account));
  }

  /**
   * Get a baskt name seed buffer
   * @param basktName The name of the baskt
   * @returns A 32-byte Buffer containing the keccak256 hash of the baskt name
   */
  public getBasktNameSeedBuffer(basktName: string): Buffer {
    // Use keccak256 to hash the basktName, then convert the hex string to a Buffer.
    const hash = keccak256(basktName); // Hashes the UTF-8 representation by default
    return Buffer.from(hash, 'hex');
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
    assetConfigs: Array<OnchainAssetConfig>,
    isPublic: boolean,
  ) {
    const basktNameSeed = this.getBasktNameSeedBuffer(basktName);

    const [basktId] = PublicKey.findProgramAddressSync(
      [Buffer.from('baskt'), basktNameSeed],
      this.program.programId,
    );

    const txBuilder = this.program.methods
      .createBaskt({
        basktName,
        assetParams: assetConfigs.map((config) => ({
          weight: new BN(config.weight), // Convert weight to BN
          direction: config.direction,
        })),
        isPublic,
      })
      .accounts({
        creator: this.getPublicKey(),
        baskt: basktId,
      });

    const assetAccounts = assetConfigs.map((config) => {
      return {
        pubkey: config.assetId,
        isSigner: false,
        isWritable: false,
      };
    });

    txBuilder.remainingAccounts([...assetAccounts]);

    // Send transaction using Anchor's RPC to avoid versioned address lookup issues
    const txSignature = await txBuilder.rpc();
    return {
      basktId,
      txSignature,
    };
  }

  /**
   * Activate a baskt with the provided prices
   * @param basktId The public key of the baskt to activate
   * @param prices Array of prices for each asset in the baskt
   * @param maxPriceAgeSec The maximum price age in seconds
   * @returns Transaction signature
   */
  public async activateBaskt(
    basktId: PublicKey,
    prices: anchor.BN[],
    maxPriceAgeSec: number = 60,
  ): Promise<string> {
    const txBuilder = this.program.methods.activateBaskt({ prices, maxPriceAgeSec }).accounts({
      // Let's try using the original ID
      baskt: basktId,
      authority: this.getPublicKey(),
    });

    // Send transaction using Anchor's RPC to avoid versioned address lookup issues
    return await txBuilder.rpc();
  }

  public async sendAndConfirm(instructions: TransactionInstruction[]) {
    // Send the signed transaction to the network
    const transaction = await this.getVersionTransaction(instructions);
    return await this.provider.sendAndConfirmV0(transaction);
  }

  public async getVersionTransaction(
    instructions: TransactionInstruction[],
  ): Promise<VersionedTransaction> {
    // Get the latest blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();

    const lookupTables = [];

    if (this.lookupTable) {
      const lookupTableAccount = (
        await this.connection.getAddressLookupTable(new PublicKey(this.lookupTable))
      ).value;

      if (lookupTableAccount) {
        lookupTables.push(lookupTableAccount);
      }
    }
    // Create the transaction message
    const message = new TransactionMessage({
      payerKey: this.getPublicKey(), // Account paying for the transaction,
      recentBlockhash: blockhash, // Latest blockhash
      instructions, // Instructions to be included in the transaction
    }).compileToV0Message(lookupTables);

    // Create the versioned transaction from the message
    const transaction = new VersionedTransaction(message);
    return transaction;
  }

  /**
   * Get a baskt account by its public key
   * @param basktPubkey The public key of the baskt account
   * @returns The baskt account data
   */
  public async getBaskt(basktPubkey: PublicKey) {
    return await this.program.account.basktV1.fetch(basktPubkey);
  }

  /**
   * Get all baskt accounts in the protocol
   * @returns Array of baskt accounts with their public keys
   */
  public async getAllBaskts() {
    return await this.program.account.basktV1.all();
  }

  /**
   * Get an asset by its ticker symbol
   * @param ticker Asset ticker symbol
   * @returns Asset information if found, null otherwise
   */
  public async getAssetByTicker(ticker: string) {
    try {
      // Get all assets and find the one with matching ticker
      const allAssets = await this.getAllAssetsRaw();
      const assetInfo = allAssets.find((asset) => asset.account.ticker === ticker);

      if (!assetInfo) {
        return null;
      }

      return {
        assetAddress: assetInfo.publicKey,
        ticker: assetInfo.account.ticker,
      };
    } catch (error) {
      console.error(`Error getting asset by ticker ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Update feature flags for the protocol
   * @param featureFlags Object containing boolean values for each feature flag
   * @returns Transaction signature
   */
  public async updateFeatureFlags(featureFlags: {
    allowAddLiquidity: boolean;
    allowRemoveLiquidity: boolean;
    allowOpenPosition: boolean;
    allowClosePosition: boolean;
    allowPnlWithdrawal: boolean;
    allowCollateralWithdrawal: boolean;
    allowBasktCreation: boolean;
    allowBasktUpdate: boolean;
    allowTrading: boolean;
    allowLiquidations: boolean;
    allowAddCollateral: boolean;
  }): Promise<string> {
    try {
      const tx = await this.program.methods
        .updateFeatureFlags({
          allowAddLiquidity: featureFlags.allowAddLiquidity,
          allowRemoveLiquidity: featureFlags.allowRemoveLiquidity,
          allowOpenPosition: featureFlags.allowOpenPosition,
          allowClosePosition: featureFlags.allowClosePosition,
          allowPnlWithdrawal: featureFlags.allowPnlWithdrawal,
          allowCollateralWithdrawal: featureFlags.allowCollateralWithdrawal,
          allowAddCollateral: featureFlags.allowAddCollateral,
          allowBasktCreation: featureFlags.allowBasktCreation,
          allowBasktUpdate: featureFlags.allowBasktUpdate,
          allowTrading: featureFlags.allowTrading,
          allowLiquidations: featureFlags.allowLiquidations,
        })
        .accounts({
          owner: this.getPublicKey(),
        })
        .transaction();

      return await this.provider.sendAndConfirmLegacy(tx);
    } catch (error) {
      console.error('Error updating feature flags:', error);
      throw error;
    }
  }

  /**
   * Rebalance a baskt with new asset weights
   * @param basktId The public key of the baskt to rebalance
   * @param assetConfigs Array of asset configurations with new weights
   * @returns Transaction signature
   */
  public async rebalanceBaskt(
    basktId: PublicKey,
    assetConfigs: Array<OnchainAssetConfig>,
  ): Promise<string> {
    // Prepare the transaction builder
    const txBuilder = this.program.methods.rebalance(assetConfigs).accounts({
      baskt: basktId,
      payer: this.getPublicKey(),
    });

    const itx = await txBuilder.instruction();

    // Execute the transaction
    const txSignature = await this.sendAndConfirm([itx]);
    return txSignature;
  }

  public async getRebalanceHistory(basktId: PublicKey, index: number): Promise<any> {
    return await this.program.account.rebalanceHistory.fetch(
      PublicKey.findProgramAddressSync(
        [Buffer.from('rebalance_history'), basktId.toBuffer(), toU64LeBytes(index)],
        this.program.programId,
      )[0],
    );
  }
  /**
   * Check if a baskt name already exists
   * @param basktName The name to check
   * @returns Boolean indicating if the baskt name exists
   */
  public async doesBasktNameExist(basktName: string): Promise<boolean> {
    const basktAccountAddress = PublicKey.findProgramAddressSync(
      [Buffer.from('baskt'), Buffer.from(basktName)],
      this.program.programId,
    );
    try {
      const account = await this.connection.getAccountInfo(basktAccountAddress[0]);
      if (!account) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize a liquidity pool
   * @param depositFeeBps Deposit fee in basis points (e.g., 50 = 0.5%)
   * @param withdrawalFeeBps Withdrawal fee in basis points
   * @param minDeposit Minimum deposit amount in token units
   * @returns Transaction signature
   */
  public async initializeLiquidityPool(
    depositFeeBps: number,
    withdrawalFeeBps: number,
    minDeposit: anchor.BN,
    lpMint: PublicKey,
    tokenMint: PublicKey,
    lpMintKeypair: anchor.web3.Keypair,
  ): Promise<string> {
    // Build the transaction
    const tx = await this.program.methods
      .initializeLiquidityPool(depositFeeBps, withdrawalFeeBps, minDeposit)
      .signers([lpMintKeypair])
      .accounts({
        admin: this.getPublicKey(),
        payer: this.getPublicKey(),
        lpMint,
        tokenMint,
      })
      .rpc();

    // const transaction = new Transaction().add(tx);
    // transaction.feePayer = this.getPublicKey();

    // const { blockhash } = await this.connection.getLatestBlockhash();
    // transaction.recentBlockhash = blockhash;

    // transaction.sign(lpMintKeypair);

    return tx;
  }

  /**
   * Add liquidity to the pool
   * @param liquidityPool The public key of the liquidity pool
   * @param amount The amount of tokens to add
   * @param minSharesOut The minimum number of LP tokens to receive
   * @param providerTokenAccount The provider's token account
   * @param tokenVault The token vault account
   * @param providerLpAccount The provider's LP token account
   * @param lpMint The LP token mint
   * @param treasuryTokenAccount The treasury token account
   * @param treasury The treasury account
   * @returns Transaction signature
   */
  public async addLiquidity(
    liquidityPool: PublicKey,
    amount: anchor.BN,
    minSharesOut: anchor.BN,
    providerTokenAccount: PublicKey,
    tokenVault: PublicKey,
    providerLpAccount: PublicKey,
    lpMint: PublicKey,
    treasuryTokenAccount: PublicKey,
    treasury: PublicKey,
  ): Promise<string> {
    // Build the transaction
    const tx = await this.program.methods
      .addLiquidity(amount, minSharesOut)
      .accounts({
        provider: this.getPublicKey(),
        lpMint,
        providerTokenAccount,
        providerLpAccount,
        treasury,
        treasuryTokenAccount,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
  }

  /**
   * Remove liquidity from the pool
   * @param liquidityPool The public key of the liquidity pool
   * @param lpAmount The amount of LP tokens to burn
   * @param minTokensOut The minimum number of tokens to receive
   * @param providerTokenAccount The provider's token account
   * @param tokenVault The token vault account
   * @param providerLpAccount The provider's LP token account
   * @param lpMint The LP token mint
   * @param treasuryTokenAccount The treasury token account
   * @param treasury The treasury account
   * @returns Transaction signature
   */
  public async removeLiquidity(
    liquidityPool: PublicKey,
    lpAmount: anchor.BN,
    minTokensOut: anchor.BN,
    providerTokenAccount: PublicKey,
    tokenVault: PublicKey,
    providerLpAccount: PublicKey,
    lpMint: PublicKey,
    treasuryTokenAccount: PublicKey,
    treasury: PublicKey,
  ): Promise<string> {
    // Build the transaction
    const tx = await this.program.methods
      .removeLiquidity(lpAmount, minTokensOut)
      .accounts({
        provider: this.getPublicKey(),
        providerTokenAccount,
        providerLpAccount,
        lpMint,
        treasuryTokenAccount,
        treasury,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
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
   * @returns The pool authority PDA
   */
  public async findPoolAuthorityPDA(): Promise<PublicKey> {
    const liquidityPool = await this.findLiquidityPoolPDA();
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_authority'), liquidityPool.toBuffer(), this.protocolPDA.toBuffer()],
      this.program.programId,
    );
    return poolAuthority;
  }

  /**
   * Get a liquidity pool account by its public key
   * @param liquidityPoolPubkey The public key of the liquidity pool account
   * @returns The liquidity pool account data
   */
  public async getLiquidityPool(liquidityPoolPubkey: PublicKey) {
    return await this.program.account.liquidityPool.fetch(liquidityPoolPubkey);
  }

  public async createOrderTx(
    orderId: BN,
    size: BN,
    collateral: BN,
    isLong: boolean,
    action: any, // e.g., { open: {} } or { close: {} }
    targetPosition: PublicKey | null,
    basktId: PublicKey,
    ownerTokenAccount: PublicKey,
    collateralMint: PublicKey, // This is the escrowMint for the program
  ): Promise<string> {
    const owner = this.getPublicKey();

    const tx = await this.program.methods
      .createOrder(orderId, size, collateral, isLong, action, targetPosition)
      .accounts({
        owner: owner,
        baskt: basktId,
        ownerToken: ownerTokenAccount,
        escrowMint: collateralMint,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
  }

  public async cancelOrderTx(
    orderPDA: PublicKey,
    orderIdNum: BN, // The order_id, needed for PDA resolution if IDL implies it
    ownerTokenAccount: PublicKey,
  ): Promise<string> {
    const owner = this.getPublicKey();

    const tx = await this.program.methods
      .cancelOrder()
      .accountsPartial({
        owner: owner,
        ownerToken: ownerTokenAccount,
        order: orderPDA,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
  }

  public async getUSDCAccount(userPublicKey: PublicKey, isPDA: boolean = false) {
    return await this.getUserTokenAccount(userPublicKey, USDC_MINT, isPDA);
  }

  public async getUserTokenAccount(
    userPublicKey: PublicKey,
    mintAccount: PublicKey,
    isPDA: boolean = false,
  ) {
    const ata = await getAssociatedTokenAddressSync(mintAccount, userPublicKey, isPDA);
    const account = await getAccount(this.connection, ata);
    return account;
  }

  /**
   * Get the PDA for the token vault associated with a liquidity pool (static)
   * @returns [PDA, bump]
   */
  async getTokenVaultPda(): Promise<[PublicKey, number]> {
    const liquidityPool = await this.findLiquidityPoolPDA();
    return PublicKey.findProgramAddressSync(
      [Buffer.from('token_vault'), liquidityPool.toBuffer()],
      this.program.programId,
    );
  }

  /**
   * Get the PDA for a funding index associated with a baskt
   * @param basktId The public key of the baskt
   * @returns [PDA, bump]
   */
  public getFundingIndexPda(basktId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      this.program.programId,
    );
  }

  /**
   * Initialize a funding index for a baskt
   * @param basktId The public key of the baskt
   * @returns Transaction signature
   */
  public async initializeFundingIndex(basktId: PublicKey): Promise<string> {
    // Build the transaction
    const tx = await this.program.methods
      .initializeFundingIndex()
      .accounts({
        authority: this.getPublicKey(),
        baskt: basktId,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
  }

  /**
   * Update the funding index rate for a baskt
   * @param basktId The public key of the baskt
   * @param newRate The new funding rate in BPS (basis points)
   * @returns Transaction signature
   */
  public async updateFundingIndex(basktId: PublicKey, newRate: BN): Promise<string> {
    // Build the transaction
    const tx = await this.program.methods
      .updateFundingIndex(newRate)
      .accountsPartial({
        authority: this.getPublicKey(),
        baskt: basktId,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
  }

  /**
   * Get a funding index account by its baskt public key
   * @param basktId The public key of the baskt
   * @returns The funding index account data
   */
  public async getFundingIndex(basktId: PublicKey) {
    const [fundingIndexPda] = this.getFundingIndexPda(basktId);
    try {
      return await this.program.account.fundingIndex.fetch(fundingIndexPda);
    } catch (error) {
      // Return null if the account doesn't exist
      return null;
    }
  }

  /**
   * Get all funding indexes for a specific baskt
   * @param basktId The public key of the baskt
   * @returns Array of funding index accounts with their public keys
   */
  public async getAllFundingIndexes(basktId: PublicKey) {
    const [fundingIndexPda] = this.getFundingIndexPda(basktId);
    try {
      const fundingIndex = await this.program.account.fundingIndex.fetch(fundingIndexPda);
      return [{ publicKey: fundingIndexPda, account: fundingIndex }];
    } catch (error) {
      return [];
    }
  }

  public async findProgramAuthorityPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('program_authority')],
      this.program.programId,
    );
  }

  /**
   * Find the protocol registry PDA
   * @returns The protocol registry PDA
   */
  public async findProtocolRegistryPDA(): Promise<PublicKey> {
    const [registry] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol_registry')],
      this.program.programId,
    );
    return registry;
  }

  /**
   * Get the protocol registry account
   * @returns Protocol registry account data or null if not initialized
   */
  public async getProtocolRegistry(): Promise<any | null> {
    const registry = await this.findProtocolRegistryPDA();
    try {
      return await this.program.account.protocolRegistry.fetch(registry);
    } catch (error) {
      return null;
    }
  }

  public async initProtocolRegistry(treasury: PublicKey, escrowMint: PublicKey): Promise<void> {
    const treasuryTokenAccount = await getAssociatedTokenAddressSync(escrowMint, treasury);
    // Initialize registry
    try {
      await this.program.methods
        .initializeRegistry()
        .accounts({
          owner: this.getPublicKey(),
          escrowMint: escrowMint,
          treasury: treasury,
          treasuryToken: treasuryTokenAccount,
        })
        .rpc();
    } catch (error: any) {
      console.log(error);
    }
  }

  public async getOrderEscrowPDA(owner: PublicKey): Promise<PublicKey> {
    const [orderEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_escrow'), owner.toBuffer()],
      this.program.programId,
    );
    return orderEscrowPDA;
  }

  public async getPositionPDA(owner: PublicKey, positionId: BN): Promise<PublicKey> {
    const [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), owner.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      this.program.programId,
    );
    return positionPDA;
  }

  /**
   * Open a position using the registry pattern
   */
  public async openPosition(params: {
    order: PublicKey;
    positionId: BN;
    entryPrice: BN;
    baskt: PublicKey;
  }): Promise<string> {
    const registry = await this.getProtocolRegistry();

    const [fundinIndexPDA] = await this.getFundingIndexPda(params.baskt);
    const orderEscrow = await this.getOrderEscrowPDA(this.getPublicKey());
    const position = await this.getPositionPDA(this.getPublicKey(), params.positionId);

    // Call openPosition with registry
    return await this.program.methods
      .openPosition({ positionId: params.positionId, entryPrice: params.entryPrice })
      .accountsPartial({
        matcher: this.getPublicKey(),
        baskt: params.baskt,
        escrowMint: registry.escrowMint,
        order: params.order,
        fundingIndex: fundinIndexPDA,
        orderEscrow: orderEscrow,
        position: position,
      })
      .rpc();
  }

  public async getOrderPDA(orderId: BN, owner: PublicKey): Promise<PublicKey> {
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), owner.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      this.program.programId,
    );
    return orderPDA;
  }

  /**
   * Add collateral to a position using the registry pattern
   */
  public async addCollateral(params: {
    position: PublicKey;
    additionalCollateral: BN;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    return await this.program.methods
      .addCollateral({ additionalCollateral: params.additionalCollateral })
      .accountsPartial({
        owner: this.getPublicKey(),
        ownerToken: params.ownerTokenAccount,
        position: params.position,
      })
      .rpc();
  }

  public async closePosition(params: {
    orderPDA: PublicKey;
    position: PublicKey;
    exitPrice: BN;
    fundingIndex: PublicKey;
    baskt: PublicKey;
    ownerTokenAccount: PublicKey;
    treasury: PublicKey;
    treasuryTokenAccount: PublicKey;
  }): Promise<string> {
    // Ensure registry is initialized
    const registry = await this.getProtocolRegistry();

    // Fetch the position to get the owner
    const positionAccount = await this.program.account.position.fetch(params.position);

    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      this.program.programId,
    );

    // Find liquidity pool and get token vault
    const liquidityPoolPDA = await this.findLiquidityPoolPDA();
    const liquidityPool = await this.program.account.liquidityPool.fetch(liquidityPoolPDA);
    const tokenVault = liquidityPool.tokenVault;

    // Prepare remaining accounts in the correct order
    const remainingAccounts = [
      {
        pubkey: params.ownerTokenAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: params.treasuryTokenAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: tokenVault,
        isSigner: false,
        isWritable: true,
      },
    ];

    return await this.program.methods
      .closePosition({ exitPrice: params.exitPrice })
      .accountsPartial({
        matcher: this.getPublicKey(),
        order: params.orderPDA,
        position: params.position,
        positionOwner: positionAccount.owner,
        baskt: params.baskt,
        liquidityPool: liquidityPoolPDA,
        programAuthority: programAuthority,
        poolAuthority: registry.poolAuthority,
        treasury: params.treasury,
      })
      .remainingAccounts(remainingAccounts)
      .rpc();
  }
}
