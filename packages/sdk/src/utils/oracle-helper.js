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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleHelper = exports.OracleType = void 0;
const anchor = __importStar(require("@coral-xyz/anchor"));
const web3_js_1 = require("@solana/web3.js");
// Oracle types enum to match the Rust program
var OracleType;
(function (OracleType) {
    OracleType[OracleType["None"] = 0] = "None";
    OracleType[OracleType["Custom"] = 1] = "Custom";
    OracleType[OracleType["Pyth"] = 2] = "Pyth";
})(OracleType || (exports.OracleType = OracleType = {}));
/**
 * Helper class for creating and managing oracle accounts
 */
class OracleHelper {
    constructor(program) {
        this.program = program;
        this.provider = program.provider;
    }
    /**
     * Creates a custom oracle account with the specified price data
     * @param price Price value (mantissa)
     * @param exponent Price exponent (e.g., -9 for 1 GWEI = 10^-9)
     * @param conf Confidence interval (optional, defaults to 1% of price)
     * @param publishTime Timestamp of price publication (optional, defaults to current time)
     * @returns The keypair and address of the created oracle account
     */
    async createCustomOracle(price, exponent, conf, publishTime) {
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
        const oracleKeypair = web3_js_1.Keypair.generate();
        // Initialize the oracle account with the provided data
        await this.program.methods
            .initializeCustomOracle(priceBN, exponent, confBN, priceBN, // Use price as EMA for simplicity
        publishTimeBN)
            .accounts({
            oracle: oracleKeypair.publicKey,
            authority: this.provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
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
    async createPythOracle(price, exponent, conf, publishTime) {
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
    async createOracle(oracleType, price, exponent, conf, publishTime) {
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
    createOracleParams(oracleAddress, oracleType, maxPriceError = 1000, // Default to 10% (1000 BPS)
    maxPriceAgeSec = 60 // Default to 60 seconds
    ) {
        return {
            oracleAccount: oracleAddress,
            oracleType: oracleType,
            oracleAuthority: this.provider.wallet.publicKey,
            maxPriceError: typeof maxPriceError === "number"
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
    async updateCustomOraclePrice(oracleAddress, price, exponent, conf, publishTime) {
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
        // Update the oracle account with the new data
        await this.program.methods
            .updateCustomOracle(priceBN, exponent, confBN, priceBN, // Use price as EMA for simplicity
        publishTimeBN)
            .accounts({
            oracle: oracleAddress,
            authority: this.provider.wallet.publicKey,
        })
            .rpc();
    }
}
exports.OracleHelper = OracleHelper;
