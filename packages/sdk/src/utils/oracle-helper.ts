import * as anchor from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BasktV1 } from '../program/types';
import { OnchainLightweightProvider } from '@baskt/types';

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
  program: anchor.Program<BasktV1>;
  public publicKey: PublicKey;
  provider: OnchainLightweightProvider;

  constructor(
    program: anchor.Program<BasktV1>,
    publicKey: PublicKey,
    provider: OnchainLightweightProvider,
  ) {
    this.program = program;
    this.publicKey = publicKey;
    this.provider = provider;
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
    oracleName: string,
    price: anchor.BN,
    exponent: number,
    ema: anchor.BN,
    conf: anchor.BN,
    postInstructions: TransactionInstruction[] = [],
  ): Promise<{ address: PublicKey; txSignature: string }> {
    const [oracle] = PublicKey.findProgramAddressSync(
      [Buffer.from('oracle'), Buffer.from(oracleName)],
      this.program.programId,
    );

    // Initialize the oracle account with the provided data
    const txSignature = await this.provider.sendAndConfirmLegacy(
      await this.program.methods
        .initializeCustomOracle({
          price: price,
          expo: exponent,
          conf: conf,
          ema: ema,
          oracleName: oracleName,
        })
        .accountsPartial({
          oracle,
          authority: this.publicKey,
        })
        .postInstructions(postInstructions)
        .transaction(),
    );
    return {
      address: oracle,
      txSignature,
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
    price: anchor.BN,
    ema: anchor.BN,
    conf: anchor.BN,
  ) {
    return await this.provider.sendAndConfirmLegacy(
      await this.updateOraclePriceTxBuilder(oracleAddress, price, ema, conf).transaction(),
    );
  }
  /**
   * Updates the price of a custom oracle account
   * @param oracleAddress Address of the oracle account to update
   * @param price New price value (mantissa)
   * @param exponent New price exponent (e.g., -9 for 1 GWEI = 10^-9)
   * @param conf New confidence interval (optional, defaults to 1% of price)
   * @param publishTime New timestamp of price publication (optional, defaults to current time)
   */
  async updateCustomOraclePriceItx(
    oracleAddress: PublicKey,
    price: anchor.BN,
    ema: anchor.BN,
    conf: anchor.BN,
  ) {
    return this.updateOraclePriceTxBuilder(oracleAddress, price, ema, conf).instruction();
  }

  private updateOraclePriceTxBuilder(
    oracleAddress: PublicKey,
    price: anchor.BN,
    ema: anchor.BN,
    conf: anchor.BN,
  ) {
    return this.program.methods
      .updateCustomOracle({
        price,
        conf,
        ema,
      })
      .accounts({
        oracle: oracleAddress,
        authority: this.publicKey,
      });
  }
}
