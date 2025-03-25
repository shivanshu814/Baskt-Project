"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseClient = void 0;
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
const oracle_helper_1 = require("./utils/oracle-helper");
const bn_js_1 = __importDefault(require("bn.js"));
/**
 * Abstract base client for Solana programs
 * Provides common functionality for program interaction
 */
class BaseClient {
    // Wallet (payer)
    get wallet() {
        return this.provider.wallet;
    }
    /**
     * Create a new client instance
     * @param program Program instance
     */
    constructor(program) {
        // Default values
        this.DEFAULT_PRICE = 50000; // $50,000
        this.DEFAULT_PRICE_EXPONENT = -6; // 6 decimal places
        this.DEFAULT_PRICE_ERROR = 100; // 1% (100 BPS)
        this.DEFAULT_PRICE_AGE_SEC = 60; // 1 minute
        this.program = program;
        this.provider = program.provider;
        // Initialize helpers
        this.oracleHelper = new oracle_helper_1.OracleHelper(this.program);
        // Derive protocol PDA
        [this.protocolPDA] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("protocol")], this.program.programId);
    }
    /**
     * Create a custom oracle with specified parameters
     * @param price Price value
     * @param exponent Price exponent
     * @param confidence Confidence interval (optional)
     * @param timestamp Optional timestamp (for testing)
     * @returns Oracle information including keypair and address
     */
    async createCustomOracle(price = this.DEFAULT_PRICE, exponent = this.DEFAULT_PRICE_EXPONENT, confidence, timestamp) {
        // Convert to raw price with exponent if a number is provided
        const rawPrice = typeof price === "number" ? price * Math.pow(10, -exponent) : price;
        // Default confidence to 1% of price if not specified
        const rawConfidence = confidence ?? (typeof rawPrice === "number" ? rawPrice / 100 : undefined);
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
    async createPythOracle(price = this.DEFAULT_PRICE, exponent = this.DEFAULT_PRICE_EXPONENT, confidence, timestamp) {
        // Convert to raw price with exponent if a number is provided
        const rawPrice = typeof price === "number" ? price * Math.pow(10, -exponent) : price;
        // Default confidence to 1% of price if not specified
        const rawConfidence = confidence ?? (typeof rawPrice === "number" ? rawPrice / 100 : undefined);
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
    createOracleParams(oracleAddress, oracleType, maxPriceError = this.DEFAULT_PRICE_ERROR, maxPriceAgeSec = this.DEFAULT_PRICE_AGE_SEC) {
        // Convert the oracle type to the format expected by the program
        const formattedOracleType = oracleType === "custom" ? { custom: {} } : { pyth: {} };
        return {
            oracleAccount: oracleAddress,
            oracleType: formattedOracleType,
            oracleAuthority: this.provider.wallet.publicKey,
            maxPriceError: typeof maxPriceError === "number"
                ? new bn_js_1.default(maxPriceError)
                : maxPriceError,
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
    async updateOraclePrice(oracleAddress, price, exponent = this.DEFAULT_PRICE_EXPONENT, confidence) {
        // Convert to raw price with exponent if a number is provided
        const rawPrice = typeof price === "number" ? price * Math.pow(10, -exponent) : price;
        // Default confidence to 1% of price if not specified
        const rawConfidence = confidence ?? (typeof rawPrice === "number" ? rawPrice / 100 : undefined);
        await this.oracleHelper.updateCustomOraclePrice(oracleAddress, rawPrice, exponent, rawConfidence);
    }
    /**
     * Create a stale oracle for testing
     * @param staleTimeSeconds How many seconds in the past
     * @param price Oracle price
     * @param exponent Price exponent
     * @returns Oracle information
     */
    async createStaleOracle(staleTimeSeconds = 7200, // 2 hours by default
    price = this.DEFAULT_PRICE, exponent = this.DEFAULT_PRICE_EXPONENT) {
        const currentTime = Math.floor(Date.now() / 1000);
        const staleTime = currentTime - staleTimeSeconds;
        // Convert to raw price with exponent if a number is provided
        const rawPrice = typeof price === "number" ? price * Math.pow(10, -exponent) : price;
        return await this.oracleHelper.createCustomOracle(rawPrice, exponent, undefined, // Default confidence
        staleTime // Use stale timestamp
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
    createAssetParams(assetId, ticker, oracleParams, targetPrice, maxSupply, collateralRatio = 15000, // 150% by default
    liquidationThreshold = 12500, // 125% by default
    liquidationPenalty = 1000, // 10% by default
    interestRate = 500, // 5% by default
    interestAccrualRate = 86400 // 1 day by default
    ) {
        // Convert numeric values to BN if they aren't already
        const targetPriceBN = typeof targetPrice === "number" ? new bn_js_1.default(targetPrice) : targetPrice;
        const maxSupplyBN = typeof maxSupply === "number" ? new bn_js_1.default(maxSupply) : maxSupply;
        // Create the asset parameters object
        return {
            assetId: assetId,
            ticker: ticker,
            oracle: oracleParams,
            targetPrice: targetPriceBN,
            maxSupply: maxSupplyBN,
            collateralRatio: collateralRatio,
            liquidationThreshold: liquidationThreshold,
            liquidationPenalty: liquidationPenalty,
            interestRate: interestRate,
            interestAccrualRate: interestAccrualRate,
        };
    }
    /**
     * Initialize the protocol
     * @returns Transaction signature
     */
    async initializeProtocol() {
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
    async getProtocolAccount() {
        return await this.program.account.protocol.fetch(this.protocolPDA);
    }
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
    async addAsset(assetKeypair, assetId, ticker, oracleParams, targetPrice, maxSupply, collateralRatio, liquidationThreshold, liquidationPenalty, interestRate, interestAccrualRate) {
        // Create the asset parameters using BaseClient's helper method
        const params = this.createAssetParams(assetId, ticker, oracleParams, targetPrice || 50000, // Default value
        maxSupply || new bn_js_1.default(1000000000), // Default value
        collateralRatio, liquidationThreshold, liquidationPenalty, interestRate, interestAccrualRate);
        // Submit the transaction to add the asset
        // We need to use a type assertion because the IDL doesn't include all required accounts
        const tx = await this.program.methods
            .addAsset(params)
            .accounts({
            admin: this.provider.wallet.publicKey,
            asset: assetKeypair.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            // Add the protocol account which is required by the program but not in the IDL
            ...{ protocol: this.protocolPDA },
        })
            .signers([assetKeypair])
            .rpc();
        return tx;
    }
    /**
     * Implementation of the abstract getProtocolAddress method from BaseClient
     * @returns The protocol PDA public key
     */
    getProtocolAddress() {
        return this.protocolPDA;
    }
    /**
     * Create and add a synthetic asset with a custom oracle in one step
     * @param ticker Asset ticker symbol
     * @param price Price value (optional, defaults to 50,000)
     * @param exponent Price exponent (optional, defaults to -6)
     * @returns Object containing asset and oracle information
     */
    async createAndAddAssetWithCustomOracle(ticker, price, exponent) {
        // Use BaseClient's default values
        const DEFAULT_PRICE = 50000;
        const DEFAULT_PRICE_EXPONENT = -6;
        const DEFAULT_PRICE_ERROR = 100;
        const DEFAULT_PRICE_AGE_SEC = 60;
        // Create a custom oracle
        const oracle = await this.createCustomOracle(price, exponent);
        // Create oracle parameters
        const oracleParams = this.createOracleParams(oracle.address, "custom", DEFAULT_PRICE_ERROR, DEFAULT_PRICE_AGE_SEC);
        // Generate a keypair for the asset
        const assetKeypair = web3_js_1.Keypair.generate();
        // Generate a unique asset ID
        const assetId = web3_js_1.Keypair.generate().publicKey;
        // Add the asset
        const txSignature = await this.addAsset(assetKeypair, assetId, ticker, oracleParams);
        return {
            assetKeypair,
            assetId,
            assetAddress: assetKeypair.publicKey,
            oracle,
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
    async createAndAddAssetWithPythOracle(ticker, price, exponent) {
        // Use BaseClient's default values
        const DEFAULT_PRICE = 50000;
        const DEFAULT_PRICE_EXPONENT = -6;
        const DEFAULT_PRICE_ERROR = 100;
        const DEFAULT_PRICE_AGE_SEC = 60;
        // Create a Pyth oracle
        const oracle = await this.createPythOracle(price, exponent);
        // Create oracle parameters
        const oracleParams = this.createOracleParams(oracle.address, "pyth", DEFAULT_PRICE_ERROR, DEFAULT_PRICE_AGE_SEC);
        // Generate a keypair for the asset
        const assetKeypair = web3_js_1.Keypair.generate();
        // Generate a unique asset ID
        const assetId = web3_js_1.Keypair.generate().publicKey;
        // Add the asset
        const txSignature = await this.addAsset(assetKeypair, assetId, ticker, oracleParams);
        return {
            assetKeypair,
            assetId,
            assetAddress: assetKeypair.publicKey,
            oracle,
            txSignature,
        };
    }
    /**
     * Get an asset account by its public key
     * @param assetPublicKey Public key of the asset account
     * @returns Asset account data
     */
    async getAsset(assetPublicKey) {
        return await this.program.account.syntheticAsset.fetch(assetPublicKey);
    }
    /**
     * Get all assets in the protocol
     * @returns Array of asset accounts with their public keys
     */
    async getAllAssets() {
        return await this.program.account.syntheticAsset.all();
    }
    /**
     * Update the price of a custom oracle
     * @param oracleAddress Address of the oracle to update
     * @param price New price value
     * @param exponent Price exponent
     * @param confidence Confidence interval (optional)
     */
    // We inherit updateOraclePrice from BaseClient
    /**
     * Fetch a custom oracle account
     * @param oracleAddress Address of the oracle account
     * @returns Oracle account data
     */
    async getOracleAccount(oracleAddress) {
        return await this.program.account.customOracle.fetch(oracleAddress);
    }
}
exports.BaseClient = BaseClient;
