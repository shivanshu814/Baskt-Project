import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BasktV1 } from "../../target/types/baskt_v1";
import { Keypair, PublicKey } from "@solana/web3.js";
import { OracleHelper, OracleType } from "./oracle-helper";
import BN from "bn.js";

/**
 * Singleton test client for the Baskt protocol
 * Provides utility methods for interacting with the protocol in tests
 */
export class TestClient {
  private static instance: TestClient;
  
  // Program and provider
  public program: Program<BasktV1>;
  public provider: anchor.AnchorProvider;
  public wallet: anchor.Wallet;
  
  // Helpers
  public oracleHelper: OracleHelper;
  
  // Protocol PDA
  public protocolPDA: PublicKey;
  
  // Default values for testing
  private readonly DEFAULT_PRICE = 50000; // $50,000
  private readonly DEFAULT_PRICE_EXPONENT = -6; // 6 decimal places
  private readonly DEFAULT_MAX_PRICE_ERROR = 100; // 1% (100 BPS)
  private readonly DEFAULT_MAX_PRICE_AGE_SEC = 60; // 1 minute

  private constructor() {
    // Configure the client to use the local cluster
    this.provider = anchor.AnchorProvider.env();
    anchor.setProvider(this.provider);

    this.program = anchor.workspace.BasktV1 as Program<BasktV1>;
    this.wallet = this.provider.wallet as anchor.Wallet;
    
    // Initialize helpers
    this.oracleHelper = new OracleHelper(this.program as unknown as anchor.Program);
    
    // Derive protocol PDA
    [this.protocolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      this.program.programId
    );
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
   * Initialize the protocol
   * @returns Transaction signature
   */
  public async initializeProtocol(): Promise<string> {
    const tx = await this.program.methods
      .initializeProtocol()
      .accounts({
        payer: this.wallet.publicKey,
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
   * Create a custom oracle with default or specified parameters
   * @param price Price value (optional, defaults to 50,000)
   * @param exponent Price exponent (optional, defaults to -6)
   * @param confidence Confidence interval (optional)
   * @returns Oracle information including keypair and address
   */
  public async createCustomOracle(
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
    confidence?: number | BN
  ) {
    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === "number" 
      ? price * Math.pow(10, -exponent)
      : price;
    
    // Default confidence to 1% of price if not specified
    const rawConfidence = confidence ?? 
      (typeof rawPrice === "number" ? rawPrice / 100 : undefined);
    
    return await this.oracleHelper.createCustomOracle(
      rawPrice,
      exponent,
      rawConfidence
    );
  }

  /**
   * Create a Pyth oracle with default or specified parameters
   * @param price Price value (optional, defaults to 50,000)
   * @param exponent Price exponent (optional, defaults to -6)
   * @param confidence Confidence interval (optional)
   * @returns Oracle information including keypair and address
   */
  public async createPythOracle(
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT,
    confidence?: number | BN
  ) {
    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === "number" 
      ? price * Math.pow(10, -exponent)
      : price;
    
    // Default confidence to 1% of price if not specified
    const rawConfidence = confidence ?? 
      (typeof rawPrice === "number" ? rawPrice / 100 : undefined);
    
    return await this.oracleHelper.createPythOracle(
      rawPrice,
      exponent,
      rawConfidence
    );
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
    oracleType: "custom" | "pyth",
    maxPriceError: number | BN = this.DEFAULT_MAX_PRICE_ERROR,
    maxPriceAgeSec: number = this.DEFAULT_MAX_PRICE_AGE_SEC
  ) {
    // Convert the OracleType enum to the format expected by the program
    const formattedOracleType = oracleType === "custom" 
      ? { custom: {} } 
      : { pyth: {} };
    
    return {
      oracleAccount: oracleAddress,
      oracleType: formattedOracleType,
      oracleAuthority: this.wallet.publicKey,
      maxPriceError: typeof maxPriceError === "number" 
        ? new BN(maxPriceError) 
        : maxPriceError,
      maxPriceAgeSec: maxPriceAgeSec,
    };
  }

  /**
   * Add a synthetic asset
   * @param assetKeypair Keypair for the asset account
   * @param assetId Unique identifier for the asset
   * @param ticker Asset ticker symbol
   * @param oracleParams Oracle parameters
   * @returns Transaction signature
   */
  public async addAsset(
    assetKeypair: Keypair,
    assetId: PublicKey,
    ticker: string,
    oracleParams: any
  ): Promise<string> {
    const tx = await this.program.methods
      .addAsset({
        assetId: assetId,
        ticker: ticker,
        oracle: oracleParams,
      })
      .accounts({
        admin: this.wallet.publicKey,
        asset: assetKeypair.publicKey,
      })
      .signers([assetKeypair])
      .rpc();
    
    return tx;
  }

  /**
   * Create and add a synthetic asset with a custom oracle in one step
   * @param ticker Asset ticker symbol
   * @param price Oracle price (optional)
   * @param exponent Price exponent (optional)
   * @returns Object containing asset and oracle information
   */
  public async createAssetWithCustomOracle(
    ticker: string,
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT
  ) {
    // Create oracle
    const oracle = await this.createCustomOracle(price, exponent);
    
    // Create oracle parameters
    const oracleParams = this.createOracleParams(
      oracle.address,
      "custom"
    );
    
    // Generate keypairs for the asset
    const assetKeypair = Keypair.generate();
    const assetId = Keypair.generate().publicKey;
    
    // Add the asset
    await this.addAsset(
      assetKeypair,
      assetId,
      ticker,
      oracleParams
    );
    
    return {
      assetKeypair,
      assetId,
      ticker,
      oracle,
      oracleParams
    };
  }

  /**
   * Create and add a synthetic asset with a Pyth oracle in one step
   * @param ticker Asset ticker symbol
   * @param price Oracle price (optional)
   * @param exponent Price exponent (optional)
   * @returns Object containing asset and oracle information
   */
  public async createAssetWithPythOracle(
    ticker: string,
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT
  ) {
    // Create oracle
    const oracle = await this.createPythOracle(price, exponent);
    
    // Create oracle parameters
    const oracleParams = this.createOracleParams(
      oracle.address,
      "pyth"
    );
    
    // Generate keypairs for the asset
    const assetKeypair = Keypair.generate();
    const assetId = Keypair.generate().publicKey;
    
    // Add the asset
    await this.addAsset(
      assetKeypair,
      assetId,
      ticker,
      oracleParams
    );
    
    return {
      assetKeypair,
      assetId,
      ticker,
      oracle,
      oracleParams
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
    confidence?: number | BN
  ) {
    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === "number" 
      ? price * Math.pow(10, -exponent)
      : price;
    
    // Default confidence to 1% of price if not specified
    const rawConfidence = confidence ?? 
      (typeof rawPrice === "number" ? rawPrice / 100 : undefined);
    
    await this.oracleHelper.updateCustomOraclePrice(
      oracleAddress,
      rawPrice,
      exponent,
      rawConfidence
    );
  }

  /**
   * Fetch a synthetic asset account
   * @param assetAddress Address of the asset account
   * @returns Asset account data
   */
  public async getAssetAccount(assetAddress: PublicKey) {
    return await this.program.account.syntheticAsset.fetch(assetAddress);
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
   * Create a stale oracle for testing
   * @param staleTimeSeconds How many seconds in the past (default: 2 hours)
   * @param price Oracle price (optional)
   * @param exponent Price exponent (optional)
   * @returns Oracle information
   */
  public async createStaleOracle(
    staleTimeSeconds: number = 7200, // 2 hours by default
    price: number | BN = this.DEFAULT_PRICE,
    exponent: number = this.DEFAULT_PRICE_EXPONENT
  ) {
    const currentTime = Math.floor(Date.now() / 1000);
    const staleTime = currentTime - staleTimeSeconds;
    
    // Convert to raw price with exponent if a number is provided
    const rawPrice = typeof price === "number" 
      ? price * Math.pow(10, -exponent)
      : price;
    
    return await this.oracleHelper.createCustomOracle(
      rawPrice,
      exponent,
      undefined, // Default confidence
      staleTime // Use stale timestamp
    );
  }
}
