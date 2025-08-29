import * as anchor from '@coral-xyz/anchor';
import {
  Commitment,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import BN from 'bn.js';
import { keccak256 } from 'js-sha3';

import {
  AccessControlRole,
  OnchainAsset,
  OnchainAssetConfig,
  OnchainAssetPermissions,
  OnchainBasktAccount,
  OnchainLightweightProvider,
  OnchainOrder,
  OnchainPosition,
  OnchainProtocolInterface,
  OrderAction,
  OnchainOrderStatus,
  OrderType,
  PositionStatus,
  statusStringToEnum,
} from '@baskt/types';
import { getAccount, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { USDC_MINT } from './constants';
import { BasktIdl } from './program/idl';
import { Baskt } from './program/types';
import { stringToRole, toRoleString } from './utils/acl-helper';
import { createLookupTableInstructions, extendLookupTable } from './utils/lookup-table-helper';

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
  public poolAuthorityPDA: PublicKey;
  public programAuthorityPDA: PublicKey;
  public liquidityPoolPDA: PublicKey;

  // Helpers

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

    // Derive protocol PDA
    [this.protocolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol')],
      this.program.programId,
    );


    // Derive program authority PDA
    [this.programAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      this.program.programId,
    );

    // Derive liquidity pool PDA
    [this.liquidityPoolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('liquidity_pool')],
      this.program.programId,
    );

    // Derive pool authority PDA
    [this.poolAuthorityPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_authority'), this.liquidityPoolPDA.toBuffer(), this.protocolPDA.toBuffer()],
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
   * Initialize the protocol
   * @param treasury Treasury public key
   * @param collateralMint Collateral mint public key (defaults to USDC_MINT)
   * @returns Transaction signature
   */
  public async initializeProtocol(treasury: PublicKey): Promise<{
    initializeProtocolSignature: string;
    initializeLookupTableSignature: string | undefined;
  }> {
    // Derive program authority PDA
    const programAuthority = this.programAuthorityPDA;

    const tx = await this.program.methods
      .initializeProtocol(treasury)
      .accountsPartial({
        authority: this.getPublicKey(),
        programAuthority: programAuthority,
        collateralMint: USDC_MINT,
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
        rebalanceRequestFeeLamports: rawProtocol.config.rebalanceRequestFeeLamports,
        liquidationFeeBps: rawProtocol.config.liquidationFeeBps,
        maxFundingRateBps: rawProtocol.config.maxFundingRateBps,
        fundingIntervalSeconds: rawProtocol.config.fundingIntervalSeconds,
        minCollateralRatioBps: rawProtocol.config.minCollateralRatioBps,
        liquidationThresholdBps: rawProtocol.config.liquidationThresholdBps,
        minLiquidity: rawProtocol.config.minLiquidity,
        lastUpdated: rawProtocol.config.lastUpdated,
        lastUpdatedBy: rawProtocol.config.lastUpdatedBy.toString(),
        basktCreationFeeLamports: rawProtocol.config.basktCreationFeeLamports,
        treasuryCutBps: rawProtocol.config.treasuryCutBps,
        fundingCutBps: rawProtocol.config.fundingCutBps,
      },
      collateralMint: rawProtocol.collateralMint,
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

  public newUID(): number {
    // Random number between 0 and u32
    return Math.floor(Math.random() * 4294967296);
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
    const assetAddress = this.getAssetPDA(ticker);
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

    // Convert permissions to optimized format
    const optimizedPermissions = {
      flags: (permissions.allowLongs ? 0x01 : 0x00) | (permissions.allowShorts ? 0x02 : 0x00),
    };

    // Submit the transaction to add the asset
    const tx = await this.program.methods
      .addAsset({
        ticker,
        permissions: optimizedPermissions,
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

  public async getOrderById(orderId: number, owner: PublicKey, commitment: Commitment = 'confirmed') {
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
      address: newAccount.publicKey || account.publicKey,
      ticker: newAccount.ticker,
      permissions: {
        allowLongs: Boolean(newAccount.permissions.flags ? (newAccount.permissions.flags & 0x01) !== 0 : newAccount.permissions.allowLongs),
        allowShorts: Boolean(newAccount.permissions.flags ? (newAccount.permissions.flags & 0x02) !== 0 : newAccount.permissions.allowShorts),
      } as OnchainAssetPermissions,
      isActive: Boolean(newAccount.isActive),
      listingTime: new Date((newAccount.listingTime.toNumber ? newAccount.listingTime.toNumber() : newAccount.listingTime) * 1000),
    } as OnchainAsset;
  }

  private convertOrder(order: any, orderAddress: PublicKey) {
    // Extract action parameters based on the enum structure
    let openParams = undefined;
    let closeParams = undefined;
    
    // Check if action_params exists and has the correct structure
    if (order.actionParams && typeof order.actionParams === 'object') {
      // The enum structure in Rust creates an object with the variant name as a key
      // The data is nested under "0" key due to how Anchor serializes enums
      if ('open' in order.actionParams && order.actionParams.open['0']) {
        const openData = order.actionParams.open['0'];
        openParams = {
          notionalValue: openData.notionalValue,
          leverageBps: openData.leverageBps,
          collateral: openData.collateral,
          isLong: openData.isLong,
        };
      } else if ('close' in order.actionParams && order.actionParams.close['0']) {
        const closeData = order.actionParams.close['0'];
        closeParams = {
          sizeAsContracts: closeData.sizeAsContracts,
          targetPosition: closeData.targetPosition,
        };
      }
    }
    
    // Extract order type parameters based on the enum structure
    let marketParams = undefined;
    let limitParams = undefined;
    
    // Check if orderTypeParams exists and has the correct structure
    if (order.orderTypeParams && typeof order.orderTypeParams === 'object') {
      if ('market' in order.orderTypeParams) {
        marketParams = {};
      } else if ('limit' in order.orderTypeParams && order.orderTypeParams.limit['0']) {
        const limitData = order.orderTypeParams.limit['0'];
        limitParams = {
          limitPrice: limitData.limitPrice,
          maxSlippageBps: limitData.maxSlippageBps,
        };
      }
    }
    
    return {
      address: orderAddress,
      action: order.action?.open ? OrderAction.Open : OrderAction.Close,
      basktId: order.basktId,
      bump: order.bump,
      orderId: order.orderId,
      owner: order.owner,
      userPublicKey: order.owner, // Use owner as userPublicKey
      orderType: order.orderType?.market ? OrderType.Market : OrderType.Limit,
      
      // Action-specific parameters
      openParams,
      closeParams,
      
      // Order type-specific parameters
      marketParams,
      limitParams,
      
      status: order.status?.pending
        ? OnchainOrderStatus.PENDING
        : order.status?.filled
        ? OnchainOrderStatus.FILLED
        : OnchainOrderStatus.CANCELLED,
      timestamp: order.timestamp,
    } as OnchainOrder;
  }

  private convertPosition(position: any, positionAddress: PublicKey) {
    return {
      positionPDA: positionAddress,
      owner: position.owner,
      positionId: position.positionId,
      basktId: position.basktId,
      size: position.size,
      collateral: position.collateral,
      isLong: position.isLong,
      entryPrice: position.entryPrice,
      exitPrice: position.exitPrice ? new BN(position.exitPrice) : undefined,
      lastFundingIndex: new BN(position.lastFundingIndex || 0),
      fundingAccumulated: new BN(position.fundingAccumulated || 0),
      lastBorrowIndex: new BN(position.lastBorrowIndex || 0),
      borrowAccumulated: new BN(position.borrowAccumulated || 0),
      lastRebalanceFeeIndex: new BN(position.lastRebalanceFeeIndex || 0),
      status: position.status?.open
        ? PositionStatus.OPEN
        : position.status?.closed
        ? PositionStatus.CLOSED
        : PositionStatus.LIQUIDATED,
      timestampOpen: position.timestampOpen,
      timestampClose: position.timestampClose,
      bump: position.bump,
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
    assetConfigs: Array<OnchainAssetConfig>,
    isPublic: boolean,
    rebalancePeriod: number = 0,
  ) {
    const uid = this.newUID();
    const basktId = await this.getBasktPDA(uid);

    // Get protocol account to find treasury
    const protocol = await this.getProtocolAccount();
    const treasury = new PublicKey(protocol.treasury);

    const txBuilder = this.program.methods
      .createBaskt({
        uid: uid,
        assetParams: assetConfigs.map((config) => ({
          weight: new BN(config.weight),
          direction: config.direction,
        })),
        isPublic,
        basktRebalancePeriod: new BN(rebalancePeriod),
      })
      .accounts({
        creator: this.getPublicKey(),
        treasury: treasury,
      });

    const assetAccounts = assetConfigs.map((config) => {
      return {
        pubkey: config.assetId,
        isSigner: false,
        isWritable: false,
      };
    });

    txBuilder.remainingAccounts([...assetAccounts]);
    const txSignature = await this.sendAndConfirmRpc(txBuilder);
    return {
      basktId,
      txSignature,
      uid,
    };
  }

  /**
   * Activate a baskt with the provided prices
   * @param basktId The public key of the baskt to activate
   * @param prices Array of prices for each asset in the baskt
   * @param maxPriceAgeSec The maximum price age in seconds
   * @returns Transaction signature
   */
  public async activateBaskt(basktId: PublicKey, prices: anchor.BN[]): Promise<string> {
    const txBuilder = this.program.methods.activateBaskt({ prices }).accountsPartial({
      authority: this.getPublicKey(),
      baskt: basktId,
    });

    // Build transaction and send using provider like other methods
    const tx = await txBuilder.transaction();
    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Activate a baskt with the provided prices
   * Note: This method used to also initialize a separate funding index,
   * but now the funding index is embedded in the Baskt account
   * @param basktId The public key of the baskt to activate
   * @param prices Array of prices for each asset in the baskt
   * @param maxPriceAgeSec The maximum price age in seconds (unused)
   * @returns Transaction signature
   */
  public async activateBasktAndInitializeFundingIndex(
    basktId: PublicKey,
    prices: anchor.BN[],
    maxPriceAgeSec: number = 60,
  ): Promise<string> {
    // Funding index is now embedded in the Baskt account,
    // so we just need to activate the baskt
    return await this.activateBaskt(basktId, prices);
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
      basktPubkey = await this.getBasktPDA(parseInt(basktPubkey));
    }
    return await this.getBasktAccount(basktPubkey, commitment);
  }

  public async getBasktAccount(
    basktPubkey: PublicKey | string,
    commitment: Commitment = 'confirmed',
  ) {
    const account = await this.getBasktRaw(basktPubkey, commitment);
    return this.convertBaskt(account, account.address);
  }

  public async getBasktRaw(basktPubkey: PublicKey | string, commitment: Commitment = 'confirmed') {
    const account = await this.program.account.baskt.fetch(basktPubkey, commitment);
    return (account as any).account ?? account;
  }

  /**
   * Get all baskt accounts in the protocol
   * @returns Array of baskt accounts with their public keys
   */
  public async getAllBaskts() {
    const rawBaskt = (await this.program.account.baskt.all()).map((baskt) =>
      this.convertBaskt(baskt.account, baskt.publicKey),
    );
    return rawBaskt.map((baskt) => baskt);
  }

  private convertBaskt(baskt: any, basktId: PublicKey) {
    const status = statusStringToEnum(baskt.status);
    return {
      ...baskt,
      uid: baskt.uid.toString(),
      basktId: basktId,
      status: status,
      openPositions: new BN(baskt.openPositions),
      config: {
        openingFeeBps: (baskt.config.flags & 0x01) != 0 ? new BN(baskt.config.openingFeeBps) : null,
        closingFeeBps: (baskt.config.flags & 0x02) != 0 ? new BN(baskt.config.closingFeeBps) : null,
        liquidationFeeBps: (baskt.config.flags & 0x04) != 0 ? new BN(baskt.config.liquidationFeeBps) : null,
        minCollateralRatioBps: (baskt.config.flags & 0x08) != 0 ? new BN(baskt.config.minCollateralRatioBps) : null,
        liquidationThresholdBps: (baskt.config.flags & 0x10) != 0 ? new BN(baskt.config.liquidationThresholdBps) : null,
      },
      marketIndices: {
        cumulativeFundingIndex: new BN(baskt.marketIndices.cumulativeFundingIndex),
        cumulativeBorrowIndex: new BN(baskt.marketIndices.cumulativeBorrowIndex),
        currentFundingRate: new BN(baskt.marketIndices.currentFundingRate),
        currentBorrowRate: new BN(baskt.marketIndices.currentBorrowRate),
        lastUpdateTimestamp: new BN(baskt.marketIndices.lastUpdateTimestamp),
      },
      rebalanceFeeIndex: {
        cumulativeIndex: new BN(baskt.rebalanceFeeIndex.cumulativeIndex),
        lastUpdateTimestamp: new BN(baskt.rebalanceFeeIndex.lastUpdateTimestamp), 
        currentFeePerUnit: new BN(baskt.rebalanceFeeIndex.currentFeePerUnit),
      },
    } as OnchainBasktAccount;
  }

  public getBasktPDA(uid: number) {
    const uidBN = new BN(uid);
    const [basktId] = PublicKey.findProgramAddressSync(
      [Buffer.from('baskt'), uidBN.toArrayLike(Buffer, 'le', 4)],
      this.program.programId,
    );
    return basktId;
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
   * @param newNav New NAV after applying the new baseline prices
   * @param rebalanceFeePerUnit Optional rebalance fee per unit position size (defaults to null)
   * @returns Transaction signature
   */
  public async rebalanceBaskt(
    basktId: PublicKey,
    assetConfigs: Array<OnchainAssetConfig>,
    newNav: anchor.BN,
    rebalanceFeePerUnit?: anchor.BN,
  ): Promise<string> {
    // Prepare the transaction builder
    const txBuilder = this.program.methods
      .rebalance(assetConfigs, newNav, rebalanceFeePerUnit ?? null)
      .accountsPartial({
        baskt: basktId,
        payer: this.getPublicKey(),
        protocol: this.protocolPDA,
      });

    const itx = await txBuilder.instruction();

    // Execute the transaction
    const txSignature = await this.sendAndConfirm([itx]);
    return txSignature;
  }

  /**
   * Request a rebalance for a baskt (creator only)
   * @param basktId The public key of the baskt to request rebalance for
   * @returns Transaction signature
   */
  public async rebalanceRequest(basktId: PublicKey): Promise<string> {
    // Get protocol account to find treasury
    const protocol = await this.getProtocolAccount();
    const treasury = new PublicKey(protocol.treasury);

    const txBuilder = this.program.methods
      .rebalanceRequest()
      .accounts({
        baskt: basktId,
        creator: this.getPublicKey(),
        treasury: treasury,
      });

    return await this.sendAndConfirmRpc(txBuilder);
  }

  public async getPositionEscrow(position: PublicKey) {
    const escrow = this.getPositionEscrowPDA(position);
    return escrow;
  }

  /**
   * Check if a baskt name already exists
   * @param uid The uid to check
   * @returns Boolean indicating if the baskt name exists
   */
  public async doesBasktExist(uid: number): Promise<boolean> {
    const basktPDA = await this.getBasktPDA(uid);
    try {
      const account = await this.connection.getAccountInfo(basktPDA);
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
   * @returns Transaction signature
   */
  public async initializeLiquidityPool(
    depositFeeBps: number,
    withdrawalFeeBps: number,
    lpMint: PublicKey,
    tokenMint: PublicKey,
    lpMintKeypair: anchor.web3.Keypair,
  ): Promise<string> {
    // Build the transaction with signers
    const txBuilder = this.program.methods
      .initializeLiquidityPool(depositFeeBps, withdrawalFeeBps)
      .accounts({
        admin: this.getPublicKey(),
        lpMint,
        usdcMint: tokenMint,
      });

    // Get the transaction and add signers
    const tx = await txBuilder.transaction();

    // Get recent blockhash and set fee payer
    const { blockhash } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = this.getPublicKey();

    // Sign with the LP mint keypair
    tx.partialSign(lpMintKeypair);

    // DO NOT USE sendAndConfirm HERE - We require a special signer
    return await this.provider.sendAndConfirmLegacy(tx);
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
        providerUsdcAccount: providerTokenAccount,
        providerLpAccount,
        lpMint,
        treasuryUsdcAccount: treasuryTokenAccount,
        treasury,
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
        providerUsdcAccount: providerTokenAccount,
        providerLpAccount,
        lpMint,
        treasuryUsdcAccount: treasuryTokenAccount,
        treasury,
      })
      .preInstructions(itx)
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Queue a withdrawal request when utilization is high
   * @param lpAmount The amount of LP tokens to queue for withdrawal
   * @param providerTokenAccount The provider's token account for receiving funds
   * @param providerLpAccount The provider's LP token account
   * @param lpMint The LP token mint
   * @returns Transaction signature
   */
  public async queueWithdrawLiquidity(
    lpAmount: anchor.BN,
    providerTokenAccount: PublicKey,
    providerLpAccount: PublicKey,
    lpMint: PublicKey,
  ): Promise<string> {
    // Get current queue head to determine next request ID
    const poolData = await this.getLiquidityPool();
    const nextRequestId = poolData.withdrawQueueHead.add(new BN(1));
    const withdrawRequest = await this.getWithdrawRequestPDA(nextRequestId);


    // Build the transaction
    const tx = await this.program.methods
      .queueWithdrawLiquidity({ lpAmount })
      .accounts({
        provider: this.getPublicKey(),
        providerLpAccount,
        providerUsdcAccount: providerTokenAccount,
        withdrawRequest,
        lpMint,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
  }

  /**
   * Process queued withdrawal requests (keeper only)
   * @param maxRequests Maximum number of requests to process
   * @param withdrawRequestAccounts Array of withdraw request account addresses
   * @param providerTokenAccounts Array of provider token account addresses (must match order of requests)
   * @returns Transaction signature
   */
  public async processWithdrawQueue(
    provider: PublicKey,
    withdrawRequest: PublicKey,
    providerTokenAccount: PublicKey,
  ): Promise<string> {
    const [tokenVault] = await this.getUsdcVaultPda();

    // Get treasury info
    const protocol = await this.getProtocolAccount();
    const poolData = await this.getLiquidityPool();

    // Get the token vault account to find the mint
    const treasuryTokenAccount = await this.getUserTokenAccount(
      protocol.treasury,
      USDC_MINT,
    );

    // Get LP mint from pool data
    const lpMint = poolData.lpMint;

    // Build the transaction - Anchor will auto-derive most PDAs
    const tx = await this.program.methods
      .processWithdrawQueue()
      .accounts({
        keeper: this.getPublicKey(),
        treasuryUsdcAccount: treasuryTokenAccount.address,
        lpMint,
        providerUsdcAccount: providerTokenAccount,
        withdrawRequest,
        provider,
      })
      .transaction();

    return await this.provider.sendAndConfirmLegacy(tx);
  }



  /**
   * Find the LP token escrow PDA
   * @returns The LP token escrow PDA
   */
  public  getLPTokenEscrowPDA(): PublicKey {
    const liquidityPool = this.liquidityPoolPDA;
    const [lpTokenEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from('lp_escrow'), liquidityPool.toBuffer()],
      this.program.programId,
    );
    return lpTokenEscrow;
  }

  /**
   * Find a withdraw request PDA
   * @param requestId The withdrawal request ID
   * @returns The withdraw request PDA
   */
  public getWithdrawRequestPDA(requestId: BN | number): PublicKey {
    const requestIdBN = new BN(requestId);
    const liquidityPool = this.liquidityPoolPDA;
    const [withdrawRequest] = PublicKey.findProgramAddressSync(
      [Buffer.from('withdraw'), liquidityPool.toBuffer(), requestIdBN.toArrayLike(Buffer, 'le', 8)],
      this.program.programId,
    );
    return withdrawRequest;
  }

  /**
   * Get a withdrawal request account by its ID
   * @param requestId The withdrawal request ID
   * @param commitment Commitment level for the account fetch
   * @returns The withdrawal request account data
   */
  public async getWithdrawalRequest(requestId: BN | number, commitment: Commitment = 'confirmed') {
    const withdrawRequestPDA = this.getWithdrawRequestPDA(requestId);
    
    try {
      const withdrawRequest = await this.program.account.withdrawRequest.fetch(
        withdrawRequestPDA,
        commitment
      );
      
      return {
        ...withdrawRequest,
        key: withdrawRequestPDA,
      };
    } catch (error) {
      console.error(`Error fetching withdrawal request ${requestId}:`, error);
      return null;
    }
  }

  /**
   * Get a liquidity pool account by its public key
   * @returns The liquidity pool account data
   */
  public async getLiquidityPool(commitment: Commitment = 'confirmed') {
    const liquidityPool = this.liquidityPoolPDA;
    const account = await this.program.account.liquidityPool.fetch(liquidityPool, commitment)
    let realAccount = account.bump ? account : (account as any).account;
    return {
      ...realAccount,
      address: liquidityPool,
    };
  }



  /**
   * Base function to create any type of order
   * @param params Order creation parameters
   * @returns Transaction signature
   */
  public async createOrder(params: {
    orderId: number;
    basktId: PublicKey;
    ownerTokenAccount: PublicKey;
    // Open order parameters
    notionalValue?: BN;
    collateral?: BN;
    isLong?: boolean;
    leverageBps?: BN;
    // Close order parameters
    sizeAsContracts?: BN;
    targetPosition?: PublicKey;
    // Limit order parameters
    limitPrice?: BN;
    maxSlippageBps?: BN;
    // Order type
    action: OrderAction ;
    orderType: OrderType;
  }): Promise<string> {
    const owner = this.getPublicKey();

    // Derive addresses that Anchor cannot infer automatically
    const escrowToken = await this.getOrderEscrowPDA(owner);
    const programAuthority = this.programAuthorityPDA;

    // Build the transaction based on action and order type
    const tx = await this.program.methods
      .createOrder({
        orderId: params.orderId,
        notionalValue: params.notionalValue || new BN(0),
        collateral: params.collateral || new BN(0),
        isLong: params.isLong || false,
        action: params.action === OrderAction.Open ? { open: {} } : { close: {} },
        targetPosition: params.targetPosition || null,
        limitPrice: params.limitPrice || new BN(0),
        maxSlippageBps: params.maxSlippageBps || new BN(0),
        leverageBps: params.leverageBps || new BN(10000),
        orderType: params.orderType === OrderType.Market ? { market: {} } : { limit: {} },
        sizeAsContracts: params.sizeAsContracts || null,
      })
      .accountsPartial({
        owner,
        baskt: params.basktId,
        ownerCollateralAccount: params.ownerTokenAccount,
        collateralMint: USDC_MINT,
        ownerCollateralEscrowAccount: escrowToken,
        programAuthority,
        protocol: this.protocolPDA,
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * Create a market open order
   * @param params Market open order parameters
   * @returns Transaction signature
   */
  public async createMarketOpenOrder(params: {
    orderId: number;
    basktId: PublicKey;
    notionalValue: BN;
    collateral: BN;
    isLong: boolean;
    leverageBps: BN;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    return await this.createOrder({
      orderId: params.orderId,
      basktId: params.basktId,
      ownerTokenAccount: params.ownerTokenAccount,
      notionalValue: params.notionalValue,
      collateral: params.collateral,
      isLong: params.isLong,
      leverageBps: params.leverageBps,
      action: OrderAction.Open,
      orderType: OrderType.Market,
    });
  }

  /**
   * Create a limit open order
   * @param params Limit open order parameters
   * @returns Transaction signature
   */
  public async createLimitOpenOrder(params: {
    orderId: number;
    basktId: PublicKey;
    notionalValue: BN;
    collateral: BN;
    isLong: boolean;
    leverageBps: BN;
    limitPrice: BN;
    maxSlippageBps: BN;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    return await this.createOrder({
      orderId: params.orderId,
      basktId: params.basktId,
      ownerTokenAccount: params.ownerTokenAccount,
      notionalValue: params.notionalValue,
      collateral: params.collateral,
      isLong: params.isLong,
      leverageBps: params.leverageBps,
      limitPrice: params.limitPrice,
      maxSlippageBps: params.maxSlippageBps,
      action: OrderAction.Open,
      orderType: OrderType.Limit,
    });
  }

  /**
   * Create a market close order
   * @param params Market close order parameters
   * @returns Transaction signature
   */
  public async createMarketCloseOrder(params: {
    orderId: number;
    basktId: PublicKey;
    sizeAsContracts: BN;
    targetPosition: PublicKey;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    return await this.createOrder({
      orderId: params.orderId,
      basktId: params.basktId,
      ownerTokenAccount: params.ownerTokenAccount,
      sizeAsContracts: params.sizeAsContracts,
      targetPosition: params.targetPosition,
      action: OrderAction.Close,
      orderType: OrderType.Market,
    });
  }

  /**
   * Create a limit close order
   * @param params Limit close order parameters
   * @returns Transaction signature
   */
  public async createLimitCloseOrder(params: {
    orderId: number;
    basktId: PublicKey;
    sizeAsContracts: BN;
    targetPosition: PublicKey;
    limitPrice: BN;
    maxSlippageBps: BN;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    return await this.createOrder({
      orderId: params.orderId,
      basktId: params.basktId,
      ownerTokenAccount: params.ownerTokenAccount,
      sizeAsContracts: params.sizeAsContracts,
      targetPosition: params.targetPosition,
      limitPrice: params.limitPrice,
      maxSlippageBps: params.maxSlippageBps,
        action: OrderAction.Close,
      orderType: OrderType.Limit,
    });
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
        owner,
        order: orderPDA,
        ownerCollateralAccount: ownerTokenAccount,        
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
  async getUsdcVaultPda(): Promise<[PublicKey, number]> {
    const liquidityPool = this.liquidityPoolPDA;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('token_vault'), liquidityPool.toBuffer()],
      this.program.programId,
    );
  }

  /**
   * Update the market indices (funding and borrow rates) for a baskt
   * @param basktId The public key of the baskt
   * @param newFundingRate The new funding rate in BPS (can be positive or negative)
   * @param newBorrowRate The new borrow rate in BPS (must be positive)
   * @returns Transaction signature
   */
  public async updateMarketIndices(basktId: PublicKey, newFundingRate: BN, newBorrowRate: BN): Promise<string> {
    const tx = await this.program.methods
      .updateMarketIndices(newFundingRate, newBorrowRate)
      .accountsPartial({
        authority: this.getPublicKey(),
        baskt: basktId,
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }

  /**
   * @deprecated Use updateMarketIndices instead
   * Update the funding index rate for a baskt (legacy method for backward compatibility)
   * @param basktId The public key of the baskt
   * @param newRate The new funding rate in BPS (basis points)
   * @returns Transaction signature
   */
  public async updateFundingIndex(basktId: PublicKey, newRate: BN): Promise<string> {
    // Default borrow rate to 0 for backward compatibility
    return this.updateMarketIndices(basktId, newRate, new BN(0));
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
   * Set the minimum liquidity
   * @param newMinLiquidity New minimum liquidity (>0)
   * @returns Transaction signature
   */
  public async setMinLiquidity(newMinLiquidity: number): Promise<string> {
    const tx = await this.program.methods
      .setMinLiquidity(new BN(newMinLiquidity))
      .accounts({
        admin: this.getPublicKey(),
      })
      .transaction();

    return await this.sendAndConfirmLegacy(tx);
  }



  public async setRebalanceRequestFee(newFeeLamports: number): Promise<string> {
    return await this.sendAndConfirmRpc(
      this.program.methods.setRebalanceRequestFee(new BN(newFeeLamports)).accountsPartial({
        authority: this.getPublicKey(),
      }),
    );
  }

  public async setBasktCreationFee(newFeeLamports: number): Promise<string> {
    return await this.sendAndConfirmRpc(
      this.program.methods.setBasktCreationFee(new BN(newFeeLamports)).accountsPartial({
        authority: this.getPublicKey(),
      }),
    );
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
   * Close a baskt - final state when all positions are closed
   * @param basktId The public key of the baskt to close
   * @returns Transaction signature
   */
  public async closeBaskt(basktId: PublicKey, creator?: PublicKey): Promise<string> {
    const creatorAccount = creator || (await this.getBasktAccount(basktId)).creator;
    const tx = await this.program.methods
      .closeBaskt()
      .accountsPartial({
        authority: this.getPublicKey(),
        baskt: basktId,
        creator: creatorAccount,
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
    try {
      // Get the baskt account which now contains the funding index
      const baskt = await this.getBasktRaw(basktId, commitment);
      if (!baskt) {
        return null;
      }
      // Return the embedded market indices
      return baskt.marketIndices;
    } catch (error) {
      // Return null if the account doesn't exist or there's an error
      return null;
    }
  }


  public  getOrderEscrowPDA(owner: PublicKey): PublicKey {
    const [orderEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_escrow'), owner.toBuffer()],
      this.program.programId,
    );
    return orderEscrowPDA;
  }

  public  getPositionPDA(owner: PublicKey, positionId: number): PublicKey {
    const [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), owner.toBuffer(), new BN(positionId).toArrayLike(Buffer, 'le', 4)],
      this.program.programId,
    );
    return positionPDA;
  }

  /**
   * Open a position
   */
  public async openPosition(params: {
    order: PublicKey;
    positionId: number;
    entryPrice: BN;
    baskt: PublicKey;
    orderOwner?: PublicKey;
    preInstructions?: TransactionInstruction[];
  }): Promise<string> {
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
    const tokenVault = (await this.getUsdcVaultPda())[0];    


    const orderEscrow = await this.getOrderEscrowPDA(params.orderOwner || this.getPublicKey());

    return await this.sendAndConfirmRpc(
      this.program.methods
        .openPosition({ positionId: params.positionId, entryPrice: params.entryPrice })
        .accountsPartial({
          matcher: this.getPublicKey(),
          orderOwner: params.orderOwner,
          baskt: params.baskt,
          collateralMint: USDC_MINT,
          order: params.order,
          position: position,
          orderEscrow: orderEscrow,
          treasuryToken: treasuryTokenAccount,
          usdcVault: tokenVault,
        })
        .preInstructions(params.preInstructions || []),
    );
  }

  public getOrderPDA(orderId: number, owner: PublicKey): PublicKey {
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), owner.toBuffer(), new BN(orderId).toArrayLike(Buffer, 'le', 4)],
      this.program.programId,
    );
    return orderPDA;
  }

  public getAssetPDA(ticker: string): PublicKey {
    const [assetPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('asset'), Buffer.from(ticker)],
      this.program.programId,
    );
    return assetPDA;
  }


  public getPositionEscrowPDA(position: PublicKey): PublicKey {
    const [positionEscrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), position.toBuffer()],
      this.program.programId,
    );
    return positionEscrowPDA;
  }

  public async addCollateral(params: {
    position: PublicKey;
    additionalCollateral: BN;
    ownerTokenAccount: PublicKey;
  }): Promise<string> {
    // Derive the protocol PDA explicitly to ensure it's available for constraint checking
    const protocol = this.protocolPDA;

    return await this.sendAndConfirmRpc(
      this.program.methods
        .addCollateral({ additionalCollateral: params.additionalCollateral })
        .accountsPartial({
          owner: this.getPublicKey(),
          ownerCollateralAccount: params.ownerTokenAccount,
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
    sizeToClose?: BN; // Optional parameter for partial close
  }): Promise<string> {
    // Get token vault for validation
    const tokenVault = (await this.getUsdcVaultPda())[0];
    const orderOwner = params.orderOwner || this.getPublicKey();

    return await this.sendAndConfirmRpc(
      this.program.methods
        .closePosition({ exitPrice: params.exitPrice, sizeToClose: params.sizeToClose || null })
        .accountsPartial({
          matcher: this.getPublicKey(),
          orderOwner: orderOwner,
          order: params.orderPDA,
          position: params.position,
          baskt: params.baskt,
          treasury: params.treasury,
          ownerCollateralAccount: params.ownerTokenAccount,
          treasuryToken: params.treasuryTokenAccount,
          usdcVault: tokenVault,
        }),
    );
  }
  public async liquidatePosition(params: {
    position: PublicKey;
    exitPrice: BN;
    baskt: PublicKey;
    ownerTokenAccount: PublicKey;
    treasury: PublicKey;
    treasuryTokenAccount: PublicKey;
    sizeToClose?: BN; // Optional parameter for partial liquidation
  }): Promise<string> {
    // Fetch the position to get the owner
    const positionAccount = await this.getPosition(params.position);
    const escrowToken = this.getPositionEscrowPDA(params.position);

    const liquidityPool = await this.getLiquidityPool();
    const tokenVault = liquidityPool.usdcVault;

    // Get protocol and pool authority   PDAs
    const protocolPDA = this.protocolPDA;
    const poolAuthorityPDA = this.poolAuthorityPDA;
    const programAuthorityPDA = this.programAuthorityPDA;

    return await this.sendAndConfirmRpc(
      this.program.methods
        .liquidatePosition({ exitPrice: params.exitPrice, sizeToClose: params.sizeToClose || null })
        .accountsPartial({
          liquidator: this.getPublicKey(),
          position: params.position,
          baskt: params.baskt,
          protocol: protocolPDA,
          liquidityPool: this.liquidityPoolPDA,
          treasury: params.treasury,
          ownerCollateralEscrowAccount: escrowToken,
          ownerCollateralAccount: params.ownerTokenAccount,
          treasuryToken: params.treasuryTokenAccount,
          usdcVault: tokenVault,
          programAuthority: programAuthorityPDA,
          poolAuthority: poolAuthorityPDA,
        }),
    );
  }

  public async forceClosePosition(params: {
    position: PublicKey;
    closePrice: BN;
    baskt: PublicKey;
    ownerTokenAccount: PublicKey;
    treasury: PublicKey;
    treasuryTokenAccount: PublicKey;
    sizeToClose?: BN; // Optional parameter for partial force close
  }): Promise<string> {
    const escrowToken = this.getPositionEscrowPDA(params.position);

    // Find liquidity pool and get token vault
    const liquidityPool = await this.getLiquidityPool();
    const tokenVault = liquidityPool.usdcVault;

    return await this.program.methods
      .forceClosePosition({
        closePrice: params.closePrice,
        sizeToClose: params.sizeToClose || null,
      })
      .accountsPartial({
        authority: this.getPublicKey(),
        position: params.position,
        baskt: params.baskt,
        ownerCollateralEscrowAccount: escrowToken,
        ownerCollateralAccount: params.ownerTokenAccount,
        treasuryToken: params.treasuryTokenAccount,
        usdcVault: tokenVault,
      })
      .rpc();
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
    const currentBaskt = await this.getBasktRaw(baskt, 'confirmed');
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

  /**
   * Parse raw on-chain order account status into a simple string.
   * Handles both enum-object and numeric representations defensively.
   */
  private parseOrderStatus(raw: any): 'pending' | 'filled' | 'cancelled' | 'unknown' {
    const status = raw?.status;
    if (!status) return 'unknown';

    // Anchor enum object form: { pending: {} } | { filled: {} } | { cancelled: {} }
    if (typeof status === 'object') {
      if (status.pending) return 'pending';
      if (status.filled) return 'filled';
      if (status.cancelled) return 'cancelled';
      return 'unknown';
    }

    // Numeric fallback: 0 = pending, 1 = filled, 2 = cancelled
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'pending';
        case 1: return 'filled';
        case 2: return 'cancelled';
        default: return 'unknown';
      }
    }

    return 'unknown';
  }

  /**
   * Fetch an order account by id/owner with retries and return its status.
   * Does not throw when account is missing; returns status 'not_found' instead.
   */
  public async getOrderStatusWithRetry(params: {
    orderId: number;
    owner: PublicKey;
    commitment?: Commitment;
    retries?: number;
    delay?: number;
  }): Promise<{ orderPDA: PublicKey; status: 'pending' | 'filled' | 'cancelled' | 'not_found' | 'unknown'; account?: any }>
  {
    const { orderId, owner, commitment = 'confirmed', retries = 3, delay = 1000 } = params;
    const orderPDA = await this.getOrderPDA(orderId, owner);
    try {
      const account = await this.readWithRetry(
        () => this.program.account.order.fetch(orderPDA, commitment),
        retries,
        delay,
      );
      const status = this.parseOrderStatus(account);
      return { orderPDA, status, account };
    } catch (err) {
      // Treat missing account (e.g., closed after cancel) as not_found
      return { orderPDA, status: 'not_found' };
    }
  }
}
