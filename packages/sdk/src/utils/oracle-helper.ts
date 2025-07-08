import * as anchor from '@coral-xyz/anchor';
import { PublicKey, ComputeBudgetProgram, Transaction } from '@solana/web3.js';
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
   * Updates the price of a custom oracle account
   * @param basktAddress Address of the oracle account to update
   * @param price New price value (mantissa)
   */
  async updateCustomOraclePrice(basktAddress: PublicKey, price: anchor.BN) {
    return await this.sendAndConfirmLegacy(
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
