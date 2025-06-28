import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Baskt } from '../program/types';
import { OnchainLightweightProvider } from '@baskt/types';

// Interface for oracle price data
export interface OraclePrice {
  price: anchor.BN;
  exponent: number;
}

/**
 * Helper class for creating and managing oracle accounts
 */
export class OracleHelper {
  program: anchor.Program<Baskt>;
  public publicKey: PublicKey;
  provider: OnchainLightweightProvider;

  constructor(
    program: anchor.Program<Baskt>,
    publicKey: PublicKey,
    provider: OnchainLightweightProvider,
  ) {
    this.program = program;
    this.publicKey = publicKey;
    this.provider = provider;
  }

  /**
   * Updates the price of a custom oracle account
   * @param basktAddress Address of the oracle account to update
   * @param price New price value (mantissa)
   */
  async updateCustomOraclePrice(basktAddress: PublicKey, price: anchor.BN) {
    return await this.provider.sendAndConfirmLegacy(
      await this.updateOraclePriceTxBuilder(basktAddress, price).transaction(),
    );
  }
  /**
   * Updates the price of a custom oracle account
   * @param oracleAddress Address of the oracle account to update
   * @param price New price value (mantissa)
   */
  async updateCustomOraclePriceItx(basktAddress: PublicKey, price: anchor.BN) {
    return this.updateOraclePriceTxBuilder(basktAddress, price).instruction();
  }

  private updateOraclePriceTxBuilder(basktAddress: PublicKey, price: anchor.BN) {
    return this.program.methods.updateCustomOracle(price).accounts({
      baskt: basktAddress,
      authority: this.publicKey,
    });
  }
}
