import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { BaseClient } from "@baskt/sdk";
/**
 * Singleton test client for the Baskt protocol
 * Provides utility methods for interacting with the protocol in tests
 * This extends the BaseClient directly instead of wrapping BasktClient
 */
export declare class TestClient extends BaseClient {
    private static instance;
    /**
     * Private constructor - use getInstance() instead
     */
    private constructor();
    /**
     * Get the singleton instance of the test client
     */
    static getInstance(): TestClient;
    /**
     * Create and add a synthetic asset with a custom oracle in one step
     * @param ticker Asset ticker symbol
     * @param price Oracle price (optional)
     * @param exponent Price exponent (optional)
     * @returns Object containing asset and oracle information
     */
    createAssetWithCustomOracle(ticker: string, price?: number | BN, exponent?: number): Promise<{
        assetKeypair: anchor.web3.Keypair;
        assetId: anchor.web3.PublicKey;
        ticker: string;
        oracle: {
            keypair: Keypair;
            address: PublicKey;
        };
        oracleParams: {
            oracleAccount: anchor.web3.PublicKey;
            oracleType: {
                custom: {};
                pyth?: undefined;
            } | {
                pyth: {};
                custom?: undefined;
            };
            oracleAuthority: anchor.web3.PublicKey;
            maxPriceError: anchor.BN;
            maxPriceAgeSec: number;
        };
    }>;
}
