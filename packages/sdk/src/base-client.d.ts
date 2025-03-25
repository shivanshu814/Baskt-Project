import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { OracleHelper } from "./utils/oracle-helper";
import BN from "bn.js";
import type { BasktV1 } from "./program/types";
/**
 * Abstract base client for Solana programs
 * Provides common functionality for program interaction
 */
export declare abstract class BaseClient {
    program: anchor.Program<BasktV1>;
    provider: anchor.AnchorProvider;
    protocolPDA: PublicKey;
    get wallet(): import("@coral-xyz/anchor/dist/cjs/provider").Wallet;
    oracleHelper: OracleHelper;
    protected readonly DEFAULT_PRICE = 50000;
    protected readonly DEFAULT_PRICE_EXPONENT = -6;
    protected readonly DEFAULT_PRICE_ERROR = 100;
    protected readonly DEFAULT_PRICE_AGE_SEC = 60;
    /**
     * Create a new client instance
     * @param program Program instance
     */
    constructor(program: anchor.Program<BasktV1>);
    /**
     * Create a custom oracle with specified parameters
     * @param price Price value
     * @param exponent Price exponent
     * @param confidence Confidence interval (optional)
     * @param timestamp Optional timestamp (for testing)
     * @returns Oracle information including keypair and address
     */
    createCustomOracle(price?: number | BN, exponent?: number, confidence?: number | BN, timestamp?: number): Promise<{
        keypair: Keypair;
        address: PublicKey;
    }>;
    /**
     * Create a Pyth oracle with specified parameters
     * @param price Price value
     * @param exponent Price exponent
     * @param confidence Confidence interval (optional)
     * @param timestamp Optional timestamp (for testing)
     * @returns Oracle information including keypair and address
     */
    createPythOracle(price?: number | BN, exponent?: number, confidence?: number | BN, timestamp?: number): Promise<{
        keypair: Keypair;
        address: PublicKey;
    }>;
    /**
     * Create oracle parameters for asset initialization
     * @param oracleAddress Oracle account address
     * @param oracleType Type of oracle (custom or pyth)
     * @param maxPriceError Maximum allowed price error in BPS
     * @param maxPriceAgeSec Maximum allowed age of price data in seconds
     * @returns Oracle parameters object formatted for the program
     */
    createOracleParams(oracleAddress: PublicKey, oracleType: "custom" | "pyth", maxPriceError?: number | BN, maxPriceAgeSec?: number): {
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
    /**
     * Update the price of a custom oracle
     * @param oracleAddress Address of the oracle to update
     * @param price New price value
     * @param exponent Price exponent
     * @param confidence Confidence interval (optional)
     */
    updateOraclePrice(oracleAddress: PublicKey, price: number | BN, exponent?: number, confidence?: number | BN): Promise<void>;
    /**
     * Create a stale oracle for testing
     * @param staleTimeSeconds How many seconds in the past
     * @param price Oracle price
     * @param exponent Price exponent
     * @returns Oracle information
     */
    createStaleOracle(staleTimeSeconds?: number, // 2 hours by default
    price?: number | BN, exponent?: number): Promise<{
        keypair: Keypair;
        address: PublicKey;
    }>;
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
    createAssetParams(assetId: PublicKey, ticker: string, oracleParams: any, targetPrice: number | BN, maxSupply: number | BN, collateralRatio?: number, // 150% by default
    liquidationThreshold?: number, // 125% by default
    liquidationPenalty?: number, // 10% by default
    interestRate?: number, // 5% by default
    interestAccrualRate?: number): {
        assetId: anchor.web3.PublicKey;
        ticker: string;
        oracle: any;
        targetPrice: anchor.BN;
        maxSupply: anchor.BN;
        collateralRatio: number;
        liquidationThreshold: number;
        liquidationPenalty: number;
        interestRate: number;
        interestAccrualRate: number;
    };
    /**
     * Initialize the protocol
     * @returns Transaction signature
     */
    initializeProtocol(): Promise<string>;
    /**
     * Fetch the protocol account
     * @returns Protocol account data
     */
    getProtocolAccount(): Promise<{
        isInitialized: boolean;
        owner: anchor.web3.PublicKey;
    }>;
    /**
     * Add a synthetic asset
     * @param assetKeypair Keypair for the asset account
     * @param assetId Unique identifier for the asset
     * @param ticker Asset ticker symbol
     * @param oracleParams Oracle parameters
     * @param targetPrice Target price for the asset (optional)
     * @param maxSupply Maximum supply of the asset (optional)
     * @param collateralRatio Collateral ratio for the asset (in BPS, optional)
     * @param liquidationThreshold Liquidation threshold (in BPS, optional)
     * @param liquidationPenalty Liquidation penalty (in BPS, optional)
     * @param interestRate Interest rate (in BPS, optional)
     * @param interestAccrualRate How often interest accrues (in seconds, optional)
     * @returns Transaction signature
     */
    addAsset(assetKeypair: Keypair, assetId: PublicKey, ticker: string, oracleParams: any, targetPrice?: number | BN, maxSupply?: number | BN, collateralRatio?: number, liquidationThreshold?: number, liquidationPenalty?: number, interestRate?: number, interestAccrualRate?: number): Promise<string>;
    /**
     * Implementation of the abstract getProtocolAddress method from BaseClient
     * @returns The protocol PDA public key
     */
    protected getProtocolAddress(): PublicKey;
    /**
     * Create and add a synthetic asset with a custom oracle in one step
     * @param ticker Asset ticker symbol
     * @param price Price value (optional, defaults to 50,000)
     * @param exponent Price exponent (optional, defaults to -6)
     * @returns Object containing asset and oracle information
     */
    createAndAddAssetWithCustomOracle(ticker: string, price?: number | BN, exponent?: number): Promise<{
        assetKeypair: anchor.web3.Keypair;
        assetId: anchor.web3.PublicKey;
        assetAddress: anchor.web3.PublicKey;
        oracle: {
            keypair: Keypair;
            address: PublicKey;
        };
        txSignature: string;
    }>;
    /**
     * Create and add a synthetic asset with a Pyth oracle in one step
     * @param ticker Asset ticker symbol
     * @param price Price value (optional, defaults to 50,000)
     * @param exponent Price exponent (optional, defaults to -6)
     * @returns Object containing asset and oracle information
     */
    createAndAddAssetWithPythOracle(ticker: string, price?: number | BN, exponent?: number): Promise<{
        assetKeypair: anchor.web3.Keypair;
        assetId: anchor.web3.PublicKey;
        assetAddress: anchor.web3.PublicKey;
        oracle: {
            keypair: Keypair;
            address: PublicKey;
        };
        txSignature: string;
    }>;
    /**
     * Get an asset account by its public key
     * @param assetPublicKey Public key of the asset account
     * @returns Asset account data
     */
    getAsset(assetPublicKey: PublicKey): Promise<{
        assetId: anchor.web3.PublicKey;
        ticker: string;
        oracle: {
            oracleAccount: anchor.web3.PublicKey;
            oracleType: ({
                custom?: undefined;
                pyth?: undefined;
            } & {
                none: Record<string, never>;
            }) | ({
                none?: undefined;
                pyth?: undefined;
            } & {
                custom: Record<string, never>;
            }) | ({
                none?: undefined;
                custom?: undefined;
            } & {
                pyth: Record<string, never>;
            });
            oracleAuthority: anchor.web3.PublicKey;
            maxPriceError: anchor.BN;
            maxPriceAgeSec: number;
        };
        openInterestLong: anchor.BN;
        openInterestShort: anchor.BN;
        lastFundingUpdate: anchor.BN;
        fundingRate: anchor.BN;
        totalFundingLong: anchor.BN;
        totalFundingShort: anchor.BN;
        totalOpeningFees: anchor.BN;
        totalClosingFees: anchor.BN;
        totalLiquidationFees: anchor.BN;
    }>;
    /**
     * Get all assets in the protocol
     * @returns Array of asset accounts with their public keys
     */
    getAllAssets(): Promise<anchor.ProgramAccount<{
        assetId: anchor.web3.PublicKey;
        ticker: string;
        oracle: {
            oracleAccount: anchor.web3.PublicKey;
            oracleType: ({
                custom?: undefined;
                pyth?: undefined;
            } & {
                none: Record<string, never>;
            }) | ({
                none?: undefined;
                pyth?: undefined;
            } & {
                custom: Record<string, never>;
            }) | ({
                none?: undefined;
                custom?: undefined;
            } & {
                pyth: Record<string, never>;
            });
            oracleAuthority: anchor.web3.PublicKey;
            maxPriceError: anchor.BN;
            maxPriceAgeSec: number;
        };
        openInterestLong: anchor.BN;
        openInterestShort: anchor.BN;
        lastFundingUpdate: anchor.BN;
        fundingRate: anchor.BN;
        totalFundingLong: anchor.BN;
        totalFundingShort: anchor.BN;
        totalOpeningFees: anchor.BN;
        totalClosingFees: anchor.BN;
        totalLiquidationFees: anchor.BN;
    }>[]>;
    /**
     * Update the price of a custom oracle
     * @param oracleAddress Address of the oracle to update
     * @param price New price value
     * @param exponent Price exponent
     * @param confidence Confidence interval (optional)
     */
    /**
     * Fetch a custom oracle account
     * @param oracleAddress Address of the oracle account
     * @returns Oracle account data
     */
    getOracleAccount(oracleAddress: PublicKey): Promise<{
        price: anchor.BN;
        expo: number;
        conf: anchor.BN;
        ema: anchor.BN;
        publishTime: anchor.BN;
    }>;
}
