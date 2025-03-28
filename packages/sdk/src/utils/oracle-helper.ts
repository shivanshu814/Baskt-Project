import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// Oracle types enum to match the Rust program
export enum OracleType {
  None = 0,
  Custom = 1,
  Pyth = 2,
}

// Interface for oracle price data
export interface OraclePrice {
  price: anchor.BN;
  exponent: number;
  confidence?: anchor.BN;
  publishTime?: anchor.BN;
}

/**
 * Helper class for creating and managing oracle accounts
 */
export class OracleHelper {
  program: any; // Using any to avoid type conflicts
  provider: anchor.AnchorProvider;

  constructor(program: any) {
    this.program = program;
    this.provider = program.provider as anchor.AnchorProvider;
  }

  /**
   * Creates a custom oracle account with the specified price data
   * @param price Price value (mantissa)
   * @param exponent Price exponent (e.g., -9 for 1 GWEI = 10^-9)
   * @param conf Confidence interval (optional, defaults to 1% of price)
   * @param publishTime Timestamp of price publication (optional, defaults to current time)
   * @returns The keypair and address of the created oracle account
   */
  async createCustomOracle(
    price: number | anchor.BN,
    exponent: number,
    conf?: number | anchor.BN,
    publishTime?: number | anchor.BN
  ): Promise<{ keypair: Keypair; address: PublicKey }> {
    // Convert inputs to BN if they are numbers
    const priceBN = typeof price === "number" ? new anchor.BN(price) : price;
    const confBN = conf
      ? typeof conf === "number"
        ? new anchor.BN(conf)
        : conf
      : priceBN.div(new anchor.BN(100)); // Default to 1% of price if not specified

    const currentTime = Math.floor(Date.now() / 1000);
    const publishTimeBN = publishTime
      ? typeof publishTime === "number"
        ? new anchor.BN(publishTime)
        : publishTime
      : new anchor.BN(currentTime);

    // Create a new keypair for the oracle account
    const oracleKeypair = Keypair.generate();

    // Initialize the oracle account with the provided data
    await this.program.methods
      .initializeCustomOracle(
        priceBN,
        exponent,
        confBN,
        priceBN, // Use price as EMA for simplicity
        publishTimeBN
      )
      .accounts({
        oracle: oracleKeypair.publicKey,
        authority: this.provider.wallet.publicKey,
      })
      .signers([oracleKeypair])
      .rpc();

    return {
      keypair: oracleKeypair,
      address: oracleKeypair.publicKey,
    };
  }

  /**
   * Creates a mock Pyth oracle account for testing
   * Note: This is a simplified version for testing and doesn't include all Pyth features
   * @param price Price value (mantissa)
   * @param exponent Price exponent (e.g., -9 for 1 GWEI = 10^-9)
   * @param conf Confidence interval (optional, defaults to 1% of price)
   * @param publishTime Timestamp of price publication (optional, defaults to current time)
   * @returns The keypair and address of the created oracle account
   */
  async createPythOracle(
    price: number | anchor.BN,
    exponent: number,
    conf?: number | anchor.BN,
    publishTime?: number | anchor.BN
  ): Promise<{ keypair: Keypair; address: PublicKey }> {
    // For testing purposes, we'll use the same implementation as custom oracle
    // In a real environment, you would interact with the actual Pyth program
    return this.createCustomOracle(price, exponent, conf, publishTime);
  }

  /**
   * Creates an oracle account of the specified type
   * @param oracleType Type of oracle to create (Custom or Pyth)
   * @param price Price value (mantissa)
   * @param exponent Price exponent (e.g., -9 for 1 GWEI = 10^-9)
   * @param conf Confidence interval (optional, defaults to 1% of price)
   * @param publishTime Timestamp of price publication (optional, defaults to current time)
   * @returns The keypair and address of the created oracle account
   */
  async createOracle(
    oracleType: OracleType,
    price: number | anchor.BN,
    exponent: number,
    conf?: number | anchor.BN,
    publishTime?: number | anchor.BN
  ): Promise<{ keypair: Keypair; address: PublicKey }> {
    switch (oracleType) {
      case OracleType.Custom:
        return this.createCustomOracle(price, exponent, conf, publishTime);
      case OracleType.Pyth:
        return this.createPythOracle(price, exponent, conf, publishTime);
      default:
        throw new Error(`Unsupported oracle type: ${oracleType}`);
    }
  }

  /**
   * Creates oracle parameters object for use in asset initialization
   * @param oracleAddress Address of the oracle account
   * @param oracleType Type of oracle (Custom or Pyth)
   * @param maxPriceError Maximum allowed price error in BPS (basis points)
   * @param maxPriceAgeSec Maximum allowed age of price data in seconds
   * @returns Oracle parameters object
   */
  createOracleParams(
    oracleAddress: PublicKey,
    oracleType: OracleType,
    maxPriceError: number | anchor.BN = 1000, // Default to 10% (1000 BPS)
    maxPriceAgeSec: number = 60 // Default to 60 seconds
  ) {
    return {
      oracleAccount: oracleAddress,
      oracleType: oracleType,
      oracleAuthority: this.provider.wallet.publicKey,
      maxPriceError:
        typeof maxPriceError === "number"
          ? new anchor.BN(maxPriceError)
          : maxPriceError,
      maxPriceAgeSec: maxPriceAgeSec,
    };
  }

  /**
   * Updates the price of a custom oracle account
   * @param oracleAddress Address of the oracle account to update
   * @param price New price value (mantissa)
   * @param exponent New price exponent (e.g., -9 for 1 GWEI = 10^-9)
   * @param conf New confidence interval (optional, defaults to 1% of price)
   * @param publishTime New timestamp of price publication (optional, defaults to current time)
   */
  async updateCustomOraclePrice(
    oracleAddress: PublicKey,
    price: number | anchor.BN,
    exponent: number,
    conf?: number | anchor.BN,
    publishTime?: number | anchor.BN
  ) {
    // Convert inputs to BN if they are numbers
    const priceBN = typeof price === "number" ? new anchor.BN(price) : price;
    const confBN = conf
      ? typeof conf === "number"
        ? new anchor.BN(conf)
        : conf
      : priceBN.div(new anchor.BN(100)); // Default to 1% of price if not specified

    const currentTime = Math.floor(Date.now() / 1000);
    // Set publish time to current time - 1 to ensure it's always behind
    const publishTimeBN = publishTime
      ? typeof publishTime === "number"
        ? new anchor.BN(publishTime)
        : publishTime
      : new anchor.BN(currentTime - 1);

    // Update the oracle account with the new data
    await this.program.methods
      .updateCustomOracle(
        priceBN,
        exponent,
        confBN,
        priceBN, // Use price as EMA for simplicity
        publishTimeBN
      )
      .accounts({
        oracle: oracleAddress,
        authority: this.provider.wallet.publicKey,
      })
      .rpc();
  }
}
