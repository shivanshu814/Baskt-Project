import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { OracleHelper } from './utils/oracle-helper';
import BN from 'bn.js';

// Import the types from our local files
import type { BasktV1 } from './program/types';
import { toRoleString } from './utils/acl-helper';
import { AccessControlRole } from './types/role';
import { AssetPermissions } from './types/asset';

/**
 * Abstract base client for Solana programs
 * Provides common functionality for program interaction
 */
export abstract class BaseClient {
  // Program and provider
  public program: anchor.Program<BasktV1>;
  public provider: anchor.AnchorProvider;
  // Protocol PDA
  public protocolPDA: PublicKey;

  // Wallet (payer)
  public get wallet() {
    return this.provider.wallet;
  }

  // Helpers
  public oracleHelper: OracleHelper;

  // Default values
  protected readonly DEFAULT_PRICE = 50000; // $50,000
  protected readonly DEFAULT_PRICE_EXPONENT = -6; // 6 decimal places
  protected readonly DEFAULT_PRICE_ERROR = 100; // 1% (100 BPS)
  protected readonly DEFAULT_PRICE_AGE_SEC = 60; // 1 minute

  /**
   * Create a new client instance
   * @param program Program instance
   */
  constructor(program: anchor.Program<BasktV1>) {
    this.program = program;
    this.provider = program.provider as anchor.AnchorProvider;

    // Initialize helpers
    this.oracleHelper = new OracleHelper(this.program);

    // Derive protocol PDA
    [this.protocolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol')],
      this.program.programId,
    );
  }

  /**
   * Create a custom oracle with specified parameters
   * @param price Price value
   * @param exponent Price exponent
   * @param confidence Confidence interval (optional)
   * @param timestamp Optional timestamp (for testing)
   * @returns Oracle information including keypair and address
   */
  public async createCustomOracle(
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
    confidence?: number | BN,
    timestamp?: number,
  ) {
    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === 'number' ? price * Math.pow(10, -exponent) : price;

    // Default confidence to 1% of price if not specified
    const rawConfidence = confidence ?? (typeof rawPrice === 'number' ? rawPrice / 100 : undefined);

    return await this.oracleHelper.createCustomOracle(rawPrice, exponent, rawConfidence, timestamp);
  }

  /**
   * Create a Pyth oracle with specified parameters
   * @param price Price value
   * @param exponent Price exponent
   * @param confidence Confidence interval (optional)
   * @param timestamp Optional timestamp (for testing)
   * @returns Oracle information including keypair and address
   */
  public async createPythOracle(
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
    confidence?: number | BN,
    timestamp?: number,
  ) {
    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === 'number' ? price * Math.pow(10, -exponent) : price;

    // Default confidence to 1% of price if not specified
    const rawConfidence = confidence ?? (typeof rawPrice === 'number' ? rawPrice / 100 : undefined);

    return await this.oracleHelper.createPythOracle(rawPrice, exponent, rawConfidence, timestamp);
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
  ) {
    // Convert the oracle type to the format expected by the program
    const formattedOracleType = oracleType === 'custom' ? { custom: {} } : { pyth: {} };

    return {
      oracleAccount: oracleAddress,
      oracleType: formattedOracleType,
      oracleAuthority: this.provider.wallet.publicKey,
      maxPriceError: typeof maxPriceError === 'number' ? new BN(maxPriceError) : maxPriceError,
      maxPriceAgeSec: maxPriceAgeSec,
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
    oracleAddress: PublicKey,
    price: number | BN,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
    confidence?: number | BN,
  ) {
    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === 'number' ? price * Math.pow(10, -exponent) : price;

    // Default confidence to 1% of price if not specified
    const rawConfidence = confidence ?? (typeof rawPrice === 'number' ? rawPrice / 100 : undefined);

    await this.oracleHelper.updateCustomOraclePrice(
      oracleAddress,
      rawPrice,
      exponent,
      rawConfidence,
    );
  }

  /**
   * Create a stale oracle for testing
   * @param staleTimeSeconds How many seconds in the past
   * @param price Oracle price
   * @param exponent Price exponent
   * @returns Oracle information
   */
  public async createStaleOracle(
    staleTimeSeconds: number = 7200, // 2 hours by default
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
  ) {
    const currentTime = Math.floor(Date.now() / 1000);
    const staleTime = currentTime - staleTimeSeconds;

    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === 'number' ? price * Math.pow(10, -exponent) : price;

    return await this.oracleHelper.createCustomOracle(
      rawPrice,
      exponent,
      undefined, // Default confidence
      staleTime, // Use stale timestamp
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
    oracleParams: any,
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
  public async initializeProtocol(): Promise<string> {
    const tx = await this.program.methods
      .initializeProtocol()
      .accounts({
        payer: this.provider.wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  /**
   * Fetch the protocol account
   * @returns Protocol account data
   */
  public async getProtocolAccount() {
    return await this.program.account.protocol.fetch(this.protocolPDA);
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
      .addRole(parseInt(role.toString()))
      .accounts({
        owner: this.provider.wallet.publicKey,
        account: account,
        protocol: this.protocolPDA,
      })
      .rpc();

    return tx;
  }

  /**
   * Remove a role from an account in the protocol
   * @param account Public key of the account to remove the role from
   * @param role AccessControlRole to remove
   * @returns Transaction signature
   */
  public async removeRole(account: PublicKey, role: AccessControlRole): Promise<string> {
    // Submit the transaction to remove the role
    const tx = await this.program.methods
      .removeRole(parseInt(role.toString()))
      .accounts({
        owner: this.provider.wallet.publicKey,
        account: account,
        protocol: this.protocolPDA,
      })
      .rpc();

    return tx;
  }

  /**
   * Check if an account has a specific role
   * @param account Public key of the account to check
   * @param role AccessControlRole to check
   * @returns Boolean indicating if the account has the role
   */
  public async hasRole(account: PublicKey, role: AccessControlRole): Promise<boolean> {
    const protocol = await this.getProtocolAccount();

    // Check if the account has the role
    if (!protocol.accessControl || !protocol.accessControl.entries) {
      return false;
    }

    // Convert role enum to string representation that matches Rust enum variant
    const roleString = toRoleString(role);

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
  public async hasPermission(account: PublicKey, role: AccessControlRole): Promise<boolean> {
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
   * @param targetPrice Target price for the asset (optional)
   * @param maxSupply Maximum supply of the asset (optional)
   * @param collateralRatio Collateral ratio for the asset (in BPS, optional)
   * @param liquidationThreshold Liquidation threshold (in BPS, optional)
   * @param liquidationPenalty Liquidation penalty (in BPS, optional)
   * @param interestRate Interest rate (in BPS, optional)
   * @param interestAccrualRate How often interest accrues (in seconds, optional)
   * @returns Transaction signature and asset PDA
   */
  public async addAsset(
    ticker: string,
    oracleParams: any,
    permissions?: AssetPermissions,
    targetPrice?: number | BN,
    maxSupply?: number | BN,
    collateralRatio?: number,
    liquidationThreshold?: number,
    liquidationPenalty?: number,
    interestRate?: number,
    interestAccrualRate?: number,
  ): Promise<{ txSignature: string; assetAddress: PublicKey }> {
    // Create the asset parameters using BaseClient's helper method
    const params = this.createAssetParams(
      ticker,
      oracleParams,
      targetPrice || 50000, // Default value
      maxSupply || new BN(1000000000), // Default value
      collateralRatio,
      liquidationThreshold,
      liquidationPenalty,
      interestRate,
      interestAccrualRate,
      permissions,
    );

    // Derive the asset PDA from the ticker
    const [assetAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('asset'), Buffer.from(ticker)],
      this.program.programId,
    );

    // Submit the transaction to add the asset
    // We need to use a type assertion because the IDL doesn't include all required accounts
    const txSignature = await this.program.methods
      .addAsset({
        ticker: params.ticker,
        oracle: params.oracle,
        permissions: params.permissions,
      })
      .accounts({
        admin: this.provider.wallet.publicKey,
        // Add the protocol account which is required by the program but not in the IDL
        protocol: this.protocolPDA,
      })
      .rpc();

    return { txSignature, assetAddress };
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
  ) {
    // Use BaseClient's default values
    const DEFAULT_PRICE_ERROR = 100;
    const DEFAULT_PRICE_AGE_SEC = 60;
    // Create a custom oracle
    const oracle = await this.createCustomOracle(price, exponent);

    // Create oracle parameters
    const oracleParams = this.createOracleParams(
      oracle.address,
      'custom',
      DEFAULT_PRICE_ERROR,
      DEFAULT_PRICE_AGE_SEC,
    );

    // Add the asset
    const { txSignature, assetAddress } = await this.addAsset(ticker, oracleParams, permissions);

    return {
      assetAddress,
      oracle: oracle.address, // Just return the oracle address directly
      ticker,
      txSignature,
    };
  }

  /**
   * Create and add a synthetic asset with a Pyth oracle in one step
   * @param ticker Asset ticker symbol
   * @param price Price value (optional, defaults to 50,000)
   * @param exponent Price exponent (optional, defaults to -6)
   * @returns Object containing asset and oracle information
   */
  public async createAndAddAssetWithPythOracle(
    ticker: string,
    price?: number | BN,
    exponent?: number,
    permissions?: AssetPermissions,
  ) {
    // Use BaseClient's default values
    const DEFAULT_PRICE_ERROR = 100;
    const DEFAULT_PRICE_AGE_SEC = 60;
    // Create a Pyth oracle
    const oracle = await this.createPythOracle(price, exponent);

    // Create oracle parameters
    const oracleParams = this.createOracleParams(
      oracle.address,
      'pyth',
      DEFAULT_PRICE_ERROR,
      DEFAULT_PRICE_AGE_SEC,
    );

    // Add the asset
    const { txSignature, assetAddress } = await this.addAsset(ticker, oracleParams, permissions);

    return {
      assetAddress,
      oracle: oracle.address, // Just return the oracle address directly
      ticker,
      txSignature,
    };
  }

  /**
   * Get an asset account by its public key
   * @param assetPublicKey Public key of the asset account
   * @returns Asset account data
   */
  public async getAsset(assetPublicKey: PublicKey) {
    return await this.program.account.syntheticAsset.fetch(assetPublicKey);
  }

  /**
   * Get all assets in the protocol
   * @returns Array of asset accounts with their public keys
   */
  public async getAllAssets() {
    return await this.program.account.syntheticAsset.all();
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
        creator: this.provider.wallet.publicKey,
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

    // Execute the transaction

    const txSignature = await txBuilder.rpc();
    return {
      basktId,
      txSignature,
    };
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
      const allAssets = await this.getAllAssets();
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
}
