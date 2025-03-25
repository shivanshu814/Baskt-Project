import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
export declare enum OracleType {
    None = 0,
    Custom = 1,
    Pyth = 2
}
export interface OraclePrice {
    price: anchor.BN;
    exponent: number;
    confidence?: anchor.BN;
    publishTime?: anchor.BN;
}
/**
 * Helper class for creating and managing oracle accounts
 */
export declare class OracleHelper {
    program: any;
    provider: anchor.AnchorProvider;
    constructor(program: any);
    /**
     * Creates a custom oracle account with the specified price data
     * @param price Price value (mantissa)
     * @param exponent Price exponent (e.g., -9 for 1 GWEI = 10^-9)
     * @param conf Confidence interval (optional, defaults to 1% of price)
     * @param publishTime Timestamp of price publication (optional, defaults to current time)
     * @returns The keypair and address of the created oracle account
     */
    createCustomOracle(price: number | anchor.BN, exponent: number, conf?: number | anchor.BN, publishTime?: number | anchor.BN): Promise<{
        keypair: Keypair;
        address: PublicKey;
    }>;
    /**
     * Creates a mock Pyth oracle account for testing
     * Note: This is a simplified version for testing and doesn't include all Pyth features
     * @param price Price value (mantissa)
     * @param exponent Price exponent (e.g., -9 for 1 GWEI = 10^-9)
     * @param conf Confidence interval (optional, defaults to 1% of price)
     * @param publishTime Timestamp of price publication (optional, defaults to current time)
     * @returns The keypair and address of the created oracle account
     */
    createPythOracle(price: number | anchor.BN, exponent: number, conf?: number | anchor.BN, publishTime?: number | anchor.BN): Promise<{
        keypair: Keypair;
        address: PublicKey;
    }>;
    /**
     * Creates an oracle account of the specified type
     * @param oracleType Type of oracle to create (Custom or Pyth)
     * @param price Price value (mantissa)
     * @param exponent Price exponent (e.g., -9 for 1 GWEI = 10^-9)
     * @param conf Confidence interval (optional, defaults to 1% of price)
     * @param publishTime Timestamp of price publication (optional, defaults to current time)
     * @returns The keypair and address of the created oracle account
     */
    createOracle(oracleType: OracleType, price: number | anchor.BN, exponent: number, conf?: number | anchor.BN, publishTime?: number | anchor.BN): Promise<{
        keypair: Keypair;
        address: PublicKey;
    }>;
    /**
     * Creates oracle parameters object for use in asset initialization
     * @param oracleAddress Address of the oracle account
     * @param oracleType Type of oracle (Custom or Pyth)
     * @param maxPriceError Maximum allowed price error in BPS (basis points)
     * @param maxPriceAgeSec Maximum allowed age of price data in seconds
     * @returns Oracle parameters object
     */
    createOracleParams(oracleAddress: PublicKey, oracleType: OracleType, maxPriceError?: number | anchor.BN, // Default to 10% (1000 BPS)
    maxPriceAgeSec?: number): {
        oracleAccount: anchor.web3.PublicKey;
        oracleType: OracleType;
        oracleAuthority: anchor.web3.PublicKey;
        maxPriceError: anchor.BN;
        maxPriceAgeSec: number;
    };
    /**
     * Updates the price of a custom oracle account
     * @param oracleAddress Address of the oracle account to update
     * @param price New price value (mantissa)
     * @param exponent New price exponent (e.g., -9 for 1 GWEI = 10^-9)
     * @param conf New confidence interval (optional, defaults to 1% of price)
     * @param publishTime New timestamp of price publication (optional, defaults to current time)
     */
    updateCustomOraclePrice(oracleAddress: PublicKey, price: number | anchor.BN, exponent: number, conf?: number | anchor.BN, publishTime?: number | anchor.BN): Promise<void>;
}
