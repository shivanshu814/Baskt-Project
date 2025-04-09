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

// Import the types from our local files
import type { BasktV1 } from './program/types';
import { stringToRole, toRoleString } from './utils/acl-helper';
import { AccessControlRole } from './types/role';
import { Asset, AssetPermissions, OracleParams } from './types/asset';
import { createLookupTableInstructions, extendLookupTable } from './utils/lookup-table-helper';
import { ProtocolInterface } from './types/protocol';
import { LightweightProvider } from './types';
import { BasktV1Idl } from './program/idl';

/**
 * Abstract base client for Solana programs
 * Provides common functionality for program interaction
 */
export abstract class BaseClient {
  // Program and provider
  public program: anchor.Program<BasktV1>;
  public provider: LightweightProvider;
  public connection: Connection;
  // Protocol PDA
  public protocolPDA: PublicKey;

  // Helpers
  public oracleHelper: OracleHelper;

  // Default values
  protected readonly DEFAULT_PRICE = 50000; // $50,000
  protected readonly DEFAULT_PRICE_EXPONENT = -6; // 6 decimal places
  protected readonly DEFAULT_PRICE_ERROR = 100; // 1% (100 BPS)
  protected readonly DEFAULT_PRICE_AGE_SEC = 60; // 1 minute

  // Lookup table
  public lookupTable: PublicKey | undefined;

  /**
   * Create a new client instance
   * @param program Program instance
   */
  constructor(connection: Connection, provider: LightweightProvider, userPublicKey?: PublicKey) {
    this.program = new anchor.Program<BasktV1>(BasktV1Idl);
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
   * Create a custom oracle with specified parameters
   * @param price Price value
   * @param exponent Price exponent
   * @param confidence Confidence interval (optional)
   * @param timestamp Optional timestamp (for testing)
   * @returns Oracle information including keypair and address
   */
  public async createCustomOracle(
    protocol: PublicKey,
    oracleName: string,
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
    confidence?: number | BN,
    ema?: number | BN,
    timestamp?: number,
  ) {
    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === 'number' ? new anchor.BN(price) : price;
    const emaBN = typeof ema === 'number' ? new anchor.BN(ema) : (ema ?? rawPrice);

    // Default confidence to 1% of price if not specified
    const rawConfidence = confidence ?? (typeof rawPrice === 'number' ? rawPrice / 100 : undefined);

    const oracle = PublicKey.findProgramAddressSync(
      [Buffer.from('oracle'), Buffer.from(oracleName)],
      this.program.programId,
    )[0];

    const postInstructions = [];
    if (this.lookupTable) {
      postInstructions.push(
        await extendLookupTable(
          this.connection,
          this.lookupTable,
          this.getPublicKey(),
          this.getPublicKey(),
          [oracle],
        ),
      );
    }

    const result = await this.oracleHelper.createCustomOracle(
      protocol,
      oracleName,
      rawPrice,
      exponent,
      emaBN,
      rawConfidence,
      timestamp,
      postInstructions,
    );

    return result;
  }

  /**
   * Create oracle parameters for asset initialization
   * @param oracleAddress Oracle account address
   * @param oracleType Type of oracle (custom or pyth)
   * @param maxPriceError Maximum allowed price error in BPS
   * @param maxPriceAgeSec Maximum allowed age of price data in seconds
   * @returns Oracle parameters object formatted for the program
   */
  public createOracleParams(
    oracleAddress: PublicKey,
    oracleType: 'custom' | 'pyth',
    maxPriceError: number | BN = this.DEFAULT_PRICE_ERROR,
    maxPriceAgeSec: number = this.DEFAULT_PRICE_AGE_SEC,
    priceFeedId: string = '',
  ): OracleParams {
    // Convert the oracle type to the format expected by the program
    const formattedOracleType = oracleType === 'custom' ? { custom: {} } : { pyth: {} };

    return {
      oracleAccount: oracleAddress,
      oracleType: formattedOracleType,
      maxPriceError: typeof maxPriceError === 'number' ? new BN(maxPriceError) : maxPriceError,
      maxPriceAgeSec: maxPriceAgeSec,
      priceFeedId,
    };
  }

  /**
   * Update the price of a custom oracle
   * @param oracleAddress Address of the oracle to update
   * @param price New price value
   * @param exponent Price exponent
   * @param confidence Confidence interval (optional)
   */
  public async updateOraclePrice(
    oracleName: string,
    oracleAddress: PublicKey,
    price: number | BN,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
    ema?: number | BN,
    confidence?: number | BN,
  ) {
    /// TODO: This is extremely risky. I will somehow end up causing a massive problem  due to this.
    /// This needs to be removed. The multiply. Caller should do the multiply
    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === 'number' ? new anchor.BN(price) : price;

    const rawPriceBN = rawPrice.mul(
      new anchor.BN(10 ** -(exponent || this.DEFAULT_PRICE_EXPONENT)),
    );

    // Default confidence to 1% of price if not specified
    const rawConfidence = confidence ?? (typeof rawPrice === 'number' ? rawPrice / 100 : undefined);

    await this.oracleHelper.updateCustomOraclePrice(
      oracleName,
      oracleAddress,
      rawPriceBN,
      exponent,
      ema ?? rawPrice,
      rawConfidence,
    );
  }

  /**
   * Add a synthetic asset
   * @param assetId Asset ID (can be any unique PublicKey)
   * @param ticker Asset ticker symbol
   * @param oracleParams Oracle parameters for the asset
   * @param targetPrice Target price for the asset
   * @param maxSupply Maximum supply of the asset
   * @param collateralRatio Collateral ratio for the asset (in BPS)
   * @param liquidationThreshold Liquidation threshold (in BPS)
   * @param liquidationPenalty Liquidation penalty (in BPS)
   * @param interestRate Interest rate (in BPS)
   * @param interestAccrualRate How often interest accrues (in seconds)
   * @returns Transaction signature
   */
  /**
   * Helper method for creating asset parameters
   */
  public createAssetParams(
    ticker: string,
    oracleParams: Record<string, unknown>,
    targetPrice: number | BN,
    maxSupply: number | BN,
    collateralRatio: number = 15000, // 150% by default
    liquidationThreshold: number = 12500, // 125% by default
    liquidationPenalty: number = 1000, // 10% by default
    interestRate: number = 500, // 5% by default
    interestAccrualRate: number = 86400, // 1 day by default
    permissions: AssetPermissions = { allowLongs: true, allowShorts: true },
  ) {
    // Convert numeric values to BN if they aren't already
    const targetPriceBN = typeof targetPrice === 'number' ? new BN(targetPrice) : targetPrice;
    const maxSupplyBN = typeof maxSupply === 'number' ? new BN(maxSupply) : maxSupply;

    // Create the asset parameters object
    return {
      ticker: ticker,
      oracle: oracleParams,
      targetPrice: targetPriceBN,
      maxSupply: maxSupplyBN,
      collateralRatio: collateralRatio,
      liquidationThreshold: liquidationThreshold,
      liquidationPenalty: liquidationPenalty,
      interestRate: interestRate,
      interestAccrualRate: interestAccrualRate,
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
    const tx = await this.program.methods
      .initializeProtocol()
      .accounts({
        payer: this.getPublicKey(),
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
  public async getProtocolAccount(): Promise<ProtocolInterface> {
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
  public async addRole(account: PublicKey, role: AccessControlRole | string): Promise<string> {
    const roleEnum = typeof role === 'string' ? stringToRole(role) : role;
    // Submit the transaction to add the role
    const tx = await this.program.methods
      .addRole(parseInt(roleEnum.toString()))
      .accounts({
        owner: this.getPublicKey(),
        account: account,
        protocol: this.protocolPDA,
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
  public async removeRole(account: PublicKey, role: AccessControlRole | string): Promise<string> {
    const roleEnum = typeof role === 'string' ? stringToRole(role) : role;
    // Submit the transaction to remove the role
    const tx = await this.program.methods
      .removeRole(parseInt(roleEnum.toString()))
      .accounts({
        owner: this.getPublicKey(),
        account: account,
        protocol: this.protocolPDA,
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
   * @param oracleParams Oracle parameters
   * @param permissions Permissions for the asset
   * @returns Transaction signature and asset PDA
   */
  public async addAsset(params: {
    ticker: string;
    oracle: OracleParams;
    permissions?: AssetPermissions;
  }): Promise<{ txSignature: string; assetAddress: PublicKey }> {
    // Find the asset PDA
    const [assetAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('asset'), Buffer.from(params.ticker)],
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
    // We need to use a type assertion because the IDL doesn't include all required accounts
    const tx = await this.program.methods
      .addAsset({
        ticker: params.ticker,
        oracle: params.oracle as any,
        permissions: params.permissions as any,
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
   * Create and add a synthetic asset with a custom oracle in one step
   * @param ticker Asset ticker symbol
   * @param price Price value (optional, defaults to 50,000)
   * @param exponent Price exponent (optional, defaults to -6)
   * @returns Object containing asset and oracle information
   */
  public async createAndAddAssetWithCustomOracle(
    ticker: string,
    price?: number | BN,
    exponent?: number,
    permissions?: AssetPermissions,
    priceError: number = 100,
    priceAgeSec: number = 60,
  ) {
    let priceBN = new anchor.BN(price || this.DEFAULT_PRICE);
    priceBN = priceBN.mul(new anchor.BN(10 ** -(exponent || this.DEFAULT_PRICE_EXPONENT)));
    // Create a custom oracle
    const oracle = await this.createCustomOracle(this.protocolPDA, ticker, priceBN, exponent);

    // Create oracle parameters
    const oracleParams = this.createOracleParams(oracle.address, 'custom', priceError, priceAgeSec);

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

  /**
   * Create and add a synthetic asset with a custom oracle in one step
   * @param ticker Asset ticker symbol
   * @param price Price value (optional, defaults to 50,000)
   * @param exponent Price exponent (optional, defaults to -6)
   * @returns Object containing asset and oracle information
   */
  public async addAssetWithPythOracle(
    ticker: string,
    pythAddress: PublicKey,
    permissions: AssetPermissions = { allowLongs: true, allowShorts: true },
    priceError: number = 100,
    priceAgeSec: number = 60,
  ) {
    // Create oracle parameters
    const oracleParams = this.createOracleParams(pythAddress, 'pyth', priceError, priceAgeSec);

    // Add the asset
    const { txSignature, assetAddress } = await this.addAsset({
      ticker,
      oracle: oracleParams,
      permissions: permissions,
    });

    return {
      assetAddress,
      oracle: pythAddress, // Just return the oracle address directly
      ticker,
      txSignature,
    };
  }

  public async getOraclePrice(oracle: PublicKey): Promise<{
    price: BN;
    exponent: number;
  }> {
    const account = await this.program.account.customOracle.fetch(oracle);
    return { price: account.price, exponent: account.expo };
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertAsset(account: any) {
    return {
      address: account.publicKey,
      ticker: account.account.ticker,
      oracle: {
        oracleAccount: account.account.oracle.oracleAccount,
        oracleType: Object.keys(account.account.oracle.oracleType)[0] || 'unknown',
        maxPriceError: account.account.oracle.maxPriceError,
        maxPriceAgeSec: account.account.oracle.maxPriceAgeSec,
      } as OracleParams,
      permissions: {
        allowLongs: account.account.permissions.allowLongs,
        allowShorts: account.account.permissions.allowShorts,
      } as AssetPermissions,
      isActive: true, // Default to active since paused property might not exist
    } as Asset;
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
   * Fetch a custom oracle account
   * @param oracleAddress Address of the oracle account
   * @returns Oracle account data
   */
  public async getOracleAccount(oracleAddress: PublicKey) {
    return await this.program.account.customOracle.fetch(oracleAddress);
  }

  /**
   * Get all custom oracles in the protocol
   * @returns Array of custom oracle accounts with their public keys
   */
  public async getAllOracles() {
    try {
      const oracleAccounts = await this.program.account.customOracle.all();
      return oracleAccounts.map((account) => ({
        address: account.publicKey,
        ...account.account,
      }));
    } catch (error) {
      console.error('Error fetching all oracles:', error);
      throw error;
    }
  }

  /**
   * Create a new baskt
   * @param basktName The name of the baskt
   * @param assetConfigs Array of asset configurations with weights
   * @param isPublic Whether the baskt is public or private
   * @param assetOraclePairs Optional array of asset/oracle pairs to use for getting current prices
   * @returns Object containing the baskt keypair and transaction signature
   */
  public async createBaskt(
    basktName: string,
    assetConfigs: Array<{
      assetId: PublicKey;
      direction: boolean;
      weight: number;
    }>,
    isPublic: boolean,
    assetOraclePairs?: Array<{ asset: PublicKey; oracle: PublicKey }>,
  ) {
    // Derive the baskt PDA
    const [basktId] = PublicKey.findProgramAddressSync(
      [Buffer.from('baskt'), Buffer.from(basktName)],
      this.program.programId,
    );

    // Convert asset configs to the format expected by the program
    const programAssetConfigs = assetConfigs.map((config) => ({
      assetId: config.assetId,
      direction: config.direction,
      weight: new BN(config.weight),
    }));

    // Prepare the transaction builder
    const txBuilder = this.program.methods
      .createBaskt({
        basktName,
        assetParams: programAssetConfigs,
        isPublic,
      })
      .accounts({
        creator: this.getPublicKey(),
        baskt: basktId,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any);

    // Add remaining accounts if provided
    if (assetOraclePairs && assetOraclePairs.length > 0) {
      const remainingAccounts = assetOraclePairs.flatMap((pair) => [
        {
          pubkey: pair.asset,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: pair.oracle,
          isWritable: false,
          isSigner: false,
        },
      ]);

      txBuilder.remainingAccounts(remainingAccounts);
    }

    // Add lookup table account if provided
    if (this.lookupTable) {
      txBuilder.accounts({
        lookupTable: this.lookupTable,
      } as any);
    }

    const instruction = await txBuilder.instruction();

    // Execute the transaction

    const txSignature = await this.sendAndConfirm([instruction]);
    return {
      basktId,
      txSignature,
    };
  }

  private async sendAndConfirm(instructions: TransactionInstruction[]) {
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
      payerKey: this.getPublicKey(), // Account paying for the transaction
      recentBlockhash: blockhash, // Latest blockhash
      instructions, // Instructions to be included in the transaction
    }).compileToV0Message(lookupTables);

    // Create the versioned transaction from the message
    const transaction = new VersionedTransaction(message);

    // Send the signed transaction to the network
    return await this.provider.sendAndConfirmV0(transaction);
  }

  /**
   * Get a baskt account by its public key
   * @param basktPubkey The public key of the baskt account
   * @returns The baskt account data
   */
  public async getBaskt(basktPubkey: PublicKey) {
    return await this.program.account.baskt.fetch(basktPubkey);
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
        oracle: assetInfo.account.oracle,
      };
    } catch (error) {
      console.error(`Error getting asset by ticker ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Get asset price using the view instruction
   * @param assetAddress The asset account address
   * @param oracleAddress The oracle account address
   * @returns The current price as a BN
   */
  public async getAssetPrice(assetAddress: PublicKey, oracleAddress: PublicKey) {
    try {
      return await this.program.methods
        .getAssetPrice()
        .accounts({
          asset: assetAddress,
          oracle: oracleAddress,
        })
        .view();
    } catch (error) {
      console.error(error);
      throw error;
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
  }): Promise<string> {
    try {
      const tx = await this.program.methods
        .updateFeatureFlags(
          featureFlags.allowAddLiquidity,
          featureFlags.allowRemoveLiquidity,
          featureFlags.allowOpenPosition,
          featureFlags.allowClosePosition,
          featureFlags.allowPnlWithdrawal,
          featureFlags.allowCollateralWithdrawal,
          featureFlags.allowBasktCreation,
          featureFlags.allowBasktUpdate,
          featureFlags.allowTrading,
          featureFlags.allowLiquidations,
        )
        .accounts({
          owner: this.getPublicKey(),
          protocol: this.protocolPDA,
        })
        .transaction();

      return await this.provider.sendAndConfirmLegacy(tx);
    } catch (error) {
      console.error('Error updating feature flags:', error);
      throw error;
    }
  }

  /**
   * Get baskt NAV using the view instruction
   * @param basktAddress The baskt account address
   * @param assetOraclePairs Array of asset/oracle account pairs
   * @returns The current NAV as a BN
   */
  public async getBasktNav(
    basktAddress: PublicKey,
    assetOraclePairs: Array<{ asset: PublicKey; oracle: PublicKey }> = [],
  ) {
    // Prepare remaining accounts (asset/oracle pairs)
    const remainingAccounts = assetOraclePairs.flatMap((pair) => [
      {
        pubkey: pair.asset,
        isWritable: false,
        isSigner: false,
      },
      {
        pubkey: pair.oracle,
        isWritable: false,
        isSigner: false,
      },
    ]);

    // For view instructions with remainingAccounts
    return await this.program.methods
      .getBasktNav()
      .accounts({
        baskt: basktAddress,
      })
      .remainingAccounts(remainingAccounts)
      .view();
  }

  /**
   * Rebalance a baskt with new asset weights
   * @param basktId The public key of the baskt to rebalance
   * @param assetConfigs Array of asset configurations with new weights
   * @param assetOraclePairs Optional array of asset/oracle pairs to use for getting current prices
   * @returns Transaction signature
   */
  public async rebalanceBaskt(
    basktId: PublicKey,
    assetConfigs: Array<{
      assetId: PublicKey;
      weight: number;
      direction?: boolean; // Optional, will be preserved from existing config if not provided
    }>,
    assetOraclePairs?: Array<{ asset: PublicKey; oracle: PublicKey }>,
  ): Promise<string> {
    // Get the current baskt to determine existing asset directions
    const baskt = await this.getBaskt(basktId);

    // Prepare asset parameters with directions
    const assetParams = assetConfigs.map((config) => {
      // Find existing config to preserve direction if not provided
      const existingConfig = baskt.currentAssetConfigs.find(
        (ac) => ac.assetId.toString() === config.assetId.toString(),
      );

      if (!existingConfig) {
        throw new Error(`Asset ${config.assetId.toString()} not found in baskt`);
      }

      return {
        assetId: config.assetId,
        // Use provided direction or preserve from existing config
        direction: config.direction !== undefined ? config.direction : existingConfig.direction,
        weight: new BN(config.weight),
      };
    });

    // Prepare the transaction builder
    const txBuilder = this.program.methods.rebalance(assetParams).accounts({
      baskt: basktId,
      payer: this.getPublicKey(),
    });

    // Add remaining accounts if provided
    if (assetOraclePairs && assetOraclePairs.length > 0) {
      const remainingAccounts = assetOraclePairs.flatMap((pair) => [
        {
          pubkey: pair.asset,
          isWritable: false,
          isSigner: false,
        },
        {
          pubkey: pair.oracle,
          isWritable: false,
          isSigner: false,
        },
      ]);

      txBuilder.remainingAccounts(remainingAccounts);
    }

    const itx = await txBuilder.instruction();

    // Execute the transaction
    const txSignature = await this.sendAndConfirm([itx]);
    return txSignature;
  }

  public async waitForBlocks() {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
