import * as anchor from '@coral-xyz/anchor';
import {
  Commitment,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { OracleHelper } from './utils/oracle-helper';
import BN from 'bn.js';
import { keccak256 } from 'js-sha3';
import { Baskt } from './program/types';

import { stringToRole, toRoleString } from './utils/acl-helper';
import { createLookupTableInstructions, extendLookupTable } from './utils/lookup-table-helper';
import { BasktIdl } from './program/idl';
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
  OnchainRebalanceHistory,
  OrderType,
} from '@baskt/types';
import { getAccount, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { toU64LeBytes } from './utils';
import { USDC_MINT } from './constants';

/**
 * Abstract base client for Solana programs
 * Provides common functionality for program interaction
 */
export abstract class BaseClient {
  // Program and provider
  public program: anchor.Program<Baskt>;
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
    this.program = new anchor.Program<Baskt>(BasktIdl, anchorProvider);
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
   * Wrapper for provider.sendAndConfirmLegacy that adds priority fee instructions
   * @param transaction The transaction to send and confirm
   * @param priorityFeeLamports Optional priority fee in lamports (default: 10000)
   * @returns Transaction signature
   */
  public async sendAndConfirmLegacy(
    transaction: Transaction,
    priorityFeeLamports: number = 10000,
  ): Promise<string> {
    // Add priority fee instruction at the beginning
    const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFeeLamports,
    });

    // Insert the priority fee instruction at the beginning of the transaction
    transaction.instructions.unshift(priorityFeeIx);

    // Call the provider's sendAndConfirmLegacy method
    return await this.provider.sendAndConfirmLegacy(transaction);
  }

  /**
   * Wrapper for Anchor .rpc() calls that builds a transaction and sends it with priority fees
   * @param transactionBuilder The Anchor transaction builder (e.g., this.program.methods.someMethod().accounts())
   * @param priorityFeeLamports Optional priority fee in lamports (default: 10000)
   * @returns Transaction signature
   */
  public async sendAndConfirmRpc(
    transactionBuilder: any,
    priorityFeeLamports: number = 10000,
  ): Promise<string> {
    // Build the transaction
    const transaction = await transactionBuilder.transaction();

    // Get the latest blockhash and set fee payer
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.getPublicKey();

    // Send and confirm with priority fees
    return await this.sendAndConfirmLegacy(transaction, priorityFeeLamports);
  }

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

  public async updateOraclePriceWithItx(basktAddress: PublicKey, price: anchor.BN) {
    return await this.oracleHelper.updateCustomOraclePriceItx(basktAddress, price);
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
  public async initializeProtocol(treasury: PublicKey): Promise<{
    initializeProtocolSignature: string;
    initializeLookupTableSignature: string | undefined;
  }> {
    // Derive program authority PDA
    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      this.program.programId,
    );

    const tx = await this.program.methods
      .initializeProtocol(treasury)
      .accountsPartial({
        authority: this.getPublicKey(),
        programAuthority: programAuthority,
        escrowMint: USDC_MINT,
      })
      .transaction();

    return {
      initializeProtocolSignature: await this.sendAndConfirmLegacy(tx),
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
  public async getProtocolAccount(
    commitment: Commitment = 'confirmed',
  ): Promise<OnchainProtocolInterface> {
    // Fetch the raw protocol account data
    const rawProtocol = await this.program.account.protocol.fetch(this.protocolPDA, commitment);

    // Convert the raw protocol account to our standardized ProtocolInterface
    return {
      isInitialized: rawProtocol.isInitialized,
      owner: rawProtocol.owner.toString(),
      accessControl: {
        entries: rawProtocol.accessControl.entries.map((entry: any) => ({
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
      config: {
        openingFeeBps: rawProtocol.config.openingFeeBps,
        closingFeeBps: rawProtocol.config.closingFeeBps,
        liquidationFeeBps: rawProtocol.config.liquidationFeeBps,
        maxFundingRateBps: rawProtocol.config.maxFundingRateBps,
        fundingIntervalSeconds: rawProtocol.config.fundingIntervalSeconds,
        minCollateralRatioBps: rawProtocol.config.minCollateralRatioBps,
        liquidationThresholdBps: rawProtocol.config.liquidationThresholdBps,
        maxPriceAgeSec: rawProtocol.config.maxPriceAgeSec,
        maxPriceDeviationBps: rawProtocol.config.maxPriceDeviationBps,
        liquidationPriceDeviationBps: rawProtocol.config.liquidationPriceDeviationBps,
        minLiquidity: rawProtocol.config.minLiquidity,
        decommissionGracePeriod: rawProtocol.config.decommissionGracePeriod,
        lastUpdated: rawProtocol.config.lastUpdated,
        lastUpdatedBy: rawProtocol.config.lastUpdatedBy.toString(),
      },
      escrowMint: rawProtocol.escrowMint,
      treasury: rawProtocol.treasury,
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

    return await this.sendAndConfirmLegacy(tx);
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

    return await this.sendAndConfirmLegacy(tx);
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

  public newIdForPosition(): BN {
    return new BN(Date.now());
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

    return { txSignature: await this.sendAndConfirmLegacy(tx), assetAddress };
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
  public async getAssetRaw(assetPublicKey: PublicKey, commitment: Commitment = 'confirmed') {
    return await this.program.account.syntheticAsset.fetch(assetPublicKey, commitment);
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
    return await this.program.account.baskt.all();
  }

  public async getOrder(orderPublicKey: PublicKey, commitment: Commitment = 'confirmed') {
    const order = await this.program.account.order.fetch(orderPublicKey, commitment);
    return this.convertOrder(order, orderPublicKey);
  }

  public async getOrderById(orderId: BN, owner: PublicKey, commitment: Commitment = 'confirmed') {
    const orderPublicKey = await this.getOrderPDA(orderId, owner);
    return this.getOrder(orderPublicKey, commitment);
  }

  public async getPosition(positionPublicKey: PublicKey, commitment: Commitment = 'confirmed') {
    const position = await this.program.account.position.fetch(positionPublicKey, commitment);
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
      limitPrice: order.limitPrice,
      maxSlippage: order.maxSlippageBps,
      orderType: order.orderType?.market ? OrderType.Market : OrderType.Limit,
    } as OnchainOrder;
  }

  private convertPosition(position: any, positionAddress: PublicKey) {
    return {
      positionPDA: positionAddress,
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

    // Build transaction and send using provider like other methods
    const tx = await txBuilder.transaction();
    const txSignature = await this.sendAndConfirmLegacy(tx);
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

    // Build transaction and send using provider like other methods
    const tx = await txBuilder.transaction();
    return await this.sendAndConfirmLegacy(tx);
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
  public async getBaskt(basktPubkey: PublicKey | string, commitment: Commitment = 'confirmed') {
    // If a string is passed, treat it as a baskt name and derive the PDA
    if (typeof basktPubkey === 'string') {
      const basktNameSeed = this.getBasktNameSeedBuffer(basktPubkey);
      const [basktPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('baskt'), basktNameSeed],
        this.program.programId,
      );
      return await this.program.account.baskt.fetch(basktPDA, commitment);
    }

    // Otherwise, use the provided PublicKey directly
    return await this.program.account.baskt.fetch(basktPubkey, commitment);
  }

  /**
   * Get all baskt accounts in the protocol
   * @returns Array of baskt accounts with their public keys
   */
  public async getAllBaskts() {
    return await this.program.account.baskt.all();
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

      const sig = await this.sendAndConfirmLegacy(tx);

      // ––– NEW: re-query the protocol and assert the flip took effect –––
      const protocol = await this.getProtocolAccount();
      const actualFlags = protocol.featureFlags;

      // Validate all critical flags that commonly cause test failures
      const flagsToValidate = [
        {
          name: 'allowTrading',
          expected: featureFlags.allowTrading,
          actual: actualFlags.allowTrading,
        },
        {
          name: 'allowOpenPosition',
          expected: featureFlags.allowOpenPosition,
          actual: actualFlags.allowOpenPosition,
        },
        {
          name: 'allowClosePosition',
          expected: featureFlags.allowClosePosition,
          actual: actualFlags.allowClosePosition,
        },
        {
          name: 'allowLiquidations',
          expected: featureFlags.allowLiquidations,
          actual: actualFlags.allowLiquidations,
        },
        {
          name: 'allowBasktCreation',
          expected: featureFlags.allowBasktCreation,
          actual: actualFlags.allowBasktCreation,
        },
      ];

      for (const flag of flagsToValidate) {
        if (flag.actual !== flag.expected) {
          throw new Error(
            `updateFeatureFlags failed: ${flag.name} is still ${flag.actual}, expected ${flag.expected} (tx ${sig})`,
          );
        }
      }

      return sig;
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

  public async getRebalanceHistoryPDA(
    basktId: PublicKey,
    index: number,
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('rebalance_history'), basktId.toBuffer(), toU64LeBytes(index)],
      this.program.programId,
    );
  }

  public async getRebalanceHistory(
    basktId: PublicKey,
    index: number,
    commitment: Commitment = 'confirmed',
  ): Promise<OnchainRebalanceHistory> {
    const [pda] = await this.getRebalanceHistoryPDA(basktId, index);
    return await this.program.account.rebalanceHistory.fetch(pda, commitment);
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
    // Build the transaction with signers
    const txBuilder = this.program.methods
      .initializeLiquidityPool(depositFeeBps, withdrawalFeeBps, minDeposit)
      .accounts({
        admin: this.getPublicKey(),
        lpMint,
        tokenMint,
      });

    // Get the transaction and add signers
    const tx = await txBuilder.transaction();

    // Get recent blockhash and set fee payer
    const { blockhash } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = this.getPublicKey();

    // Sign with the LP mint keypair
    tx.partialSign(lpMintKeypair);

    return await this.sendAndConfirmLegacy(tx);
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

    return await this.sendAndConfirmLegacy(tx);
  }

  public async addLiquidityWithItx(
    liquidityPool: PublicKey,
    amount: anchor.BN,
    minSharesOut: anchor.BN,
    providerTokenAccount: PublicKey,
    tokenVault: PublicKey,
    providerLpAccount: PublicKey,
    lpMint: PublicKey,
    treasuryTokenAccount: PublicKey,
    treasury: PublicKey,
    itx: TransactionInstruction[],
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
      .preInstructions(itx)
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
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

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Find the liquidity pool PDA
   * @returns The liquidity pool PDA
   */
  public async findLiquidityPoolPDA(): Promise<PublicKey> {
    const [liquidityPool] = PublicKey.findProgramAddressSync(
      [Buffer.from('liquidity_pool')],
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
   * @returns The liquidity pool account data
   */
  public async getLiquidityPool(commitment: Commitment = 'confirmed') {
    const liquidityPool = await this.findLiquidityPoolPDA();
    return await this.program.account.liquidityPool.fetch(liquidityPool, commitment);
  }

  public async createOrderTx(
    orderId: BN,
    size: BN,
    collateral: BN,
    isLong: boolean,
    action: any, // e.g., { open: {} } or { close: {} }
    targetPosition: PublicKey | null,
    limitPrice: BN,
    maxSlippageBps: BN,
    basktId: PublicKey,
    ownerTokenAccount: PublicKey,
    collateralMint: PublicKey, // This is the escrowMint for the program
    leverageBps: BN = new BN(10000), // Desired leverage in basis points (10000 = 1x leverage)
    orderType: any = { market: {} }, // e.g., { market: {} } or { limit: {} } - defaults to market
  ): Promise<string> {
    const owner = this.getPublicKey();

    // Derive addresses that Anchor cannot infer automatically
    const escrowToken = await this.getOrderEscrowPDA(owner);
    const [programAuthority] = await this.findProgramAuthorityPDA();

    const tx = await this.program.methods
      .createOrder(
        orderId,
        size,
        collateral,
        isLong,
        action,
        targetPosition,
        limitPrice,
        maxSlippageBps,
        leverageBps,
        orderType,
      )
      .accountsPartial({
        owner,
        baskt: basktId,
        ownerToken: ownerTokenAccount,
        escrowMint: collateralMint,
        escrowToken,
        programAuthority,
        protocol: this.protocolPDA,
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  public async cancelOrderTx(
    orderPDA: PublicKey,
    orderIdNum: BN, // The order_id, needed for PDA resolution if IDL implies it
    ownerTokenAccount: PublicKey,
  ): Promise<string> {
    const owner = this.getPublicKey();

    // Derive addresses Anchor cannot infer automatically
    const escrowToken = await this.getOrderEscrowPDA(owner);
    const [programAuthority] = await this.findProgramAuthorityPDA();

    const tx = await this.program.methods
      .cancelOrder()
      .accountsPartial({
        owner,
        order: orderPDA,
        ownerToken: ownerTokenAccount,
        escrowToken,
        programAuthority,
        protocol: this.protocolPDA,
      })
      .transaction();

    return await this.sendAndConfirm(tx.instructions);
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

    return await this.sendAndConfirmLegacy(tx);
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

    return await this.sendAndConfirmLegacy(tx);
  }

  // Protocol Configuration Setters

  /**
   * Set the opening fee in basis points
   * @param newOpeningFeeBps New opening fee in basis points (0-500)
   * @returns Transaction signature
   */
  public async setOpeningFeeBps(newOpeningFeeBps: number): Promise<string> {
    const tx = await this.program.methods
      .setOpeningFeeBps(new BN(newOpeningFeeBps))
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Set the closing fee in basis points
   * @param newClosingFeeBps New closing fee in basis points (0-500)
   * @returns Transaction signature
   */
  public async setClosingFeeBps(newClosingFeeBps: number): Promise<string> {
    const tx = await this.program.methods
      .setClosingFeeBps(new BN(newClosingFeeBps))
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Set the liquidation fee in basis points
   * @param newLiquidationFeeBps New liquidation fee in basis points (0-500)
   * @returns Transaction signature
   */
  public async setLiquidationFeeBps(newLiquidationFeeBps: number): Promise<string> {
    const tx = await this.program.methods
      .setLiquidationFeeBps(new BN(newLiquidationFeeBps))
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Set the minimum collateral ratio in basis points
   * @param newMinCollateralRatioBps New minimum collateral ratio in basis points (>=11000)
   * @returns Transaction signature
   */
  public async setMinCollateralRatioBps(newMinCollateralRatioBps: number): Promise<string> {
    const tx = await this.program.methods
      .setMinCollateralRatioBps(new BN(newMinCollateralRatioBps))
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Set the liquidation threshold in basis points
   * @param newLiquidationThresholdBps New liquidation threshold in basis points
   * @returns Transaction signature
   */
  public async setLiquidationThresholdBps(newLiquidationThresholdBps: number): Promise<string> {
    const tx = await this.program.methods
      .setLiquidationThresholdBps(new BN(newLiquidationThresholdBps))
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Update the treasury address
   * @param newTreasury New treasury public key
   * @returns Transaction signature
   */
  public async updateTreasury(newTreasury: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .updateTreasury(newTreasury)
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Set the maximum price age in seconds
   * @param newMaxPriceAgeSec New maximum price age in seconds (>0)
   * @returns Transaction signature
   */
  public async setMaxPriceAgeSec(newMaxPriceAgeSec: number): Promise<string> {
    const tx = await this.program.methods
      .setMaxPriceAgeSec(newMaxPriceAgeSec)
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Set the maximum price deviation in basis points
   * @param newMaxPriceDeviationBps New maximum price deviation in basis points (<=2500)
   * @returns Transaction signature
   */
  public async setMaxPriceDeviationBps(newMaxPriceDeviationBps: number): Promise<string> {
    const tx = await this.program.methods
      .setMaxPriceDeviationBps(new BN(newMaxPriceDeviationBps))
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Set the liquidation price deviation in basis points
   * @param newLiquidationPriceDeviationBps New liquidation price deviation in basis points (<=2000)
   * @returns Transaction signature
   */
  public async setLiquidationPriceDeviationBps(
    newLiquidationPriceDeviationBps: number,
  ): Promise<string> {
    const tx = await this.program.methods
      .setLiquidationPriceDeviationBps(new BN(newLiquidationPriceDeviationBps))
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Set the minimum liquidity
   * @param newMinLiquidity New minimum liquidity (>0)
   * @returns Transaction signature
   */
  public async setMinLiquidity(newMinLiquidity: number): Promise<string> {
    const tx = await this.program.methods
      .setMinLiquidity(new BN(newMinLiquidity))
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Set the decommission grace period in seconds
   * @param newGracePeriod New grace period in seconds (3600-604800)
   * @returns Transaction signature
   */
  public async setDecommissionGracePeriod(newGracePeriod: number): Promise<string> {
    const tx = await this.program.methods
      .setDecommissionGracePeriod(new BN(newGracePeriod))
      .accountsPartial({
        authority: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  // ====== Baskt Lifecycle Operations ======

  /**
   * Decommission a baskt - enters decommissioning phase
   * @param basktId The public key of the baskt to decommission
   * @returns Transaction signature
   */
  public async decommissionBaskt(basktId: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .decommissionBaskt()
      .accountsPartial({
        authority: this.getPublicKey(),
        baskt: basktId,
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Settle a baskt - freeze price and funding after grace period
   * @param basktId The public key of the baskt to settle
   * @returns Transaction signature
   */
  public async settleBaskt(basktId: PublicKey): Promise<string> {
    const [fundingIndexPDA] = await this.getFundingIndexPda(basktId);

    const tx = await this.program.methods
      .settleBaskt()
      .accountsPartial({
        authority: this.getPublicKey(),
        baskt: basktId,
        fundingIndex: fundingIndexPDA,
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Close a baskt - final state when all positions are closed
   * @param basktId The public key of the baskt to close
   * @returns Transaction signature
   */
  public async closeBaskt(basktId: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .closeBaskt()
      .accountsPartial({
        authority: this.getPublicKey(),
        baskt: basktId,
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Get a funding index account by its baskt public key
   * @param basktId The public key of the baskt
   * @returns The funding index account data
   */
  public async getFundingIndex(basktId: PublicKey, commitment: Commitment = 'confirmed') {
    const [fundingIndexPda] = this.getFundingIndexPda(basktId);
    try {
      return await this.program.account.fundingIndex.fetch(fundingIndexPda, commitment);
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
  public async getAllFundingIndexes(basktId: PublicKey, commitment: Commitment = 'confirmed') {
    const [fundingIndexPda] = this.getFundingIndexPda(basktId);
    try {
      const fundingIndex = await this.program.account.fundingIndex.fetch(
        fundingIndexPda,
        commitment,
      );
      return [{ publicKey: fundingIndexPda, account: fundingIndex }];
    } catch (error) {
      return [];
    }
  }

  public async findProgramAuthorityPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync([Buffer.from('authority')], this.program.programId);
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
   * Open a position
   */
  public async openPosition(params: {
    order: PublicKey;
    positionId: BN;
    entryPrice: BN;
    baskt: PublicKey;
    orderOwner?: PublicKey;
    preInstructions?: TransactionInstruction[];
  }): Promise<string> {
    const [fundinIndexPDA] = await this.getFundingIndexPda(params.baskt);
    const position = await this.getPositionPDA(
      params.orderOwner || this.getPublicKey(),
      params.positionId,
    );

    // Get protocol to find treasury address
    const protocol = await this.getProtocolAccount();
    const treasuryTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      new PublicKey(protocol.treasury),
    );

    // Get token vault for validation
    const tokenVault = (await this.getTokenVaultPda())[0];

    const orderEscrow = await this.getOrderEscrowPDA(params.orderOwner || this.getPublicKey());

    return await this.sendAndConfirmRpc(
      this.program.methods
        .openPosition({ positionId: params.positionId, entryPrice: params.entryPrice })
        .accountsPartial({
          matcher: this.getPublicKey(),
          baskt: params.baskt,
          escrowMint: USDC_MINT,
          order: params.order,
          fundingIndex: fundinIndexPDA,
          position: position,
          orderEscrow: orderEscrow,
        })
        .preInstructions(params.preInstructions || [])
        .remainingAccounts([
          {
            pubkey: treasuryTokenAccount,
            isWritable: true,
            isSigner: false,
          },
          {
            pubkey: tokenVault,
            isWritable: true,
            isSigner: false,
          },
        ]),
    );
  }

  public async getOrderPDA(orderId: BN, owner: PublicKey): Promise<PublicKey> {
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), owner.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      this.program.programId,
    );
    return orderPDA;
  }

  public async addCollateral(params: {
    position: PublicKey;
    additionalCollateral: BN;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    // Derive the protocol PDA explicitly to ensure it's available for constraint checking
    const [protocol] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol')],
      this.program.programId,
    );

    return await this.sendAndConfirmRpc(
      this.program.methods
        .addCollateral({ additionalCollateral: params.additionalCollateral })
        .accountsPartial({
          owner: this.getPublicKey(),
          ownerToken: params.ownerTokenAccount,
          position: params.position,
          protocol: protocol, // Explicitly provide protocol for constraint checking
        }),
    );
  }

  public async closePosition(params: {
    orderPDA: PublicKey;
    position: PublicKey;
    exitPrice: BN;
    baskt: PublicKey;
    ownerTokenAccount: PublicKey;
    treasury: PublicKey;
    treasuryTokenAccount: PublicKey;
    orderOwner?: PublicKey;
  }): Promise<string> {
    const [fundingIndex] = await this.getFundingIndexPda(params.baskt);

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
        pubkey: (await this.getTokenVaultPda())[0],
        isSigner: false,
        isWritable: true,
      },
    ];

    return await this.sendAndConfirmRpc(
      this.program.methods
        .closePosition({ exitPrice: params.exitPrice })
        .accountsPartial({
          matcher: this.getPublicKey(),
          order: params.orderPDA,
          position: params.position,
          baskt: params.baskt,
          treasury: params.treasury,
          fundingIndex: fundingIndex,
        })
        .remainingAccounts(remainingAccounts),
    );
  }
  public async liquidatePosition(params: {
    position: PublicKey;
    exitPrice: BN;
    baskt: PublicKey;
    ownerTokenAccount: PublicKey;
    treasury: PublicKey;
    treasuryTokenAccount: PublicKey;
  }): Promise<string> {
    // Fetch the position to get the owner
    const positionAccount = await this.getPosition(params.position);
    const [escrowToken] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.position.toBuffer()],
      this.program.programId,
    );

    // Find liquidity pool and get token vault
    const liquidityPool = await this.getLiquidityPool();
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

    return await this.sendAndConfirmRpc(
      this.program.methods
        .liquidatePosition({ exitPrice: params.exitPrice })
        .accountsPartial({
          liquidator: this.getPublicKey(),
          position: params.position,
          positionOwner: positionAccount.owner,
          baskt: params.baskt,
          treasury: params.treasury,
          escrowToken: escrowToken,
        })
        .remainingAccounts(remainingAccounts),
    );
  }

  // Baskt Config Methods
  public async setBasktOpeningFeeBps(
    baskt: PublicKey,
    newOpeningFeeBps: number | null,
  ): Promise<string> {
    return await this.sendAndConfirmRpc(
      this.program.methods
        .setBasktOpeningFeeBps(newOpeningFeeBps !== null ? new BN(newOpeningFeeBps) : null)
        .accountsPartial({
          authority: this.getPublicKey(),
          baskt: baskt,
        }),
    );
  }

  public async setBasktClosingFeeBps(
    baskt: PublicKey,
    newClosingFeeBps: number | null,
  ): Promise<string> {
    return await this.sendAndConfirmRpc(
      this.program.methods
        .setBasktClosingFeeBps(newClosingFeeBps !== null ? new BN(newClosingFeeBps) : null)
        .accountsPartial({
          authority: this.getPublicKey(),
          baskt: baskt,
        }),
    );
  }

  public async setBasktLiquidationFeeBps(
    baskt: PublicKey,
    newLiquidationFeeBps: number | null,
  ): Promise<string> {
    return await this.sendAndConfirmRpc(
      this.program.methods
        .setBasktLiquidationFeeBps(
          newLiquidationFeeBps !== null ? new BN(newLiquidationFeeBps) : null,
        )
        .accountsPartial({
          authority: this.getPublicKey(),
          baskt: baskt,
        }),
    );
  }

  public async setBasktMinCollateralRatioBps(
    baskt: PublicKey,
    newMinCollateralRatioBps: number | null,
  ): Promise<string> {
    return await this.sendAndConfirmRpc(
      this.program.methods
        .setBasktMinCollateralRatioBps(
          newMinCollateralRatioBps !== null ? new BN(newMinCollateralRatioBps) : null,
        )
        .accountsPartial({
          authority: this.getPublicKey(),
          baskt: baskt,
        }),
    );
  }

  public async setBasktLiquidationThresholdBps(
    baskt: PublicKey,
    newLiquidationThresholdBps: number | null,
  ): Promise<string> {
    return await this.sendAndConfirmRpc(
      this.program.methods
        .setBasktLiquidationThresholdBps(
          newLiquidationThresholdBps !== null ? new BN(newLiquidationThresholdBps) : null,
        )
        .accountsPartial({
          authority: this.getPublicKey(),
          baskt: baskt,
        }),
    );
  }

  public async updateBasktConfig(
    baskt: PublicKey,
    params: {
      openingFeeBps?: number | null;
      closingFeeBps?: number | null;
      liquidationFeeBps?: number | null;
      minCollateralRatioBps?: number | null;
      liquidationThresholdBps?: number | null;
    },
  ): Promise<string> {
    // First, get the current config to preserve unspecified fields
    const currentBaskt = await this.getBaskt(baskt, 'confirmed');
    const currentConfig = currentBaskt.config;

    // Build the update parameters, preserving existing values for unspecified fields
    const updateParams = {
      openingFeeBps:
        params.openingFeeBps !== undefined
          ? params.openingFeeBps !== null
            ? new BN(params.openingFeeBps)
            : null
          : currentConfig.openingFeeBps,
      closingFeeBps:
        params.closingFeeBps !== undefined
          ? params.closingFeeBps !== null
            ? new BN(params.closingFeeBps)
            : null
          : currentConfig.closingFeeBps,
      liquidationFeeBps:
        params.liquidationFeeBps !== undefined
          ? params.liquidationFeeBps !== null
            ? new BN(params.liquidationFeeBps)
            : null
          : currentConfig.liquidationFeeBps,
      minCollateralRatioBps:
        params.minCollateralRatioBps !== undefined
          ? params.minCollateralRatioBps !== null
            ? new BN(params.minCollateralRatioBps)
            : null
          : currentConfig.minCollateralRatioBps,
      liquidationThresholdBps:
        params.liquidationThresholdBps !== undefined
          ? params.liquidationThresholdBps !== null
            ? new BN(params.liquidationThresholdBps)
            : null
          : currentConfig.liquidationThresholdBps,
    };

    return await this.sendAndConfirmRpc(
      this.program.methods.updateBasktConfig(updateParams).accountsPartial({
        authority: this.getPublicKey(),
        baskt: baskt,
      }),
    );
  }

  public async readWithRetry(fn: () => Promise<any>, retries: number = 3, delay: number = 1000) {
    let lastError: Error | null = null;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }
}
