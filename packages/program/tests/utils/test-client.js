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
exports.TestClient = void 0;
const anchor = __importStar(require("@coral-xyz/anchor"));
const sdk_1 = require("@baskt/sdk");
/**
 * Singleton test client for the Baskt protocol
 * Provides utility methods for interacting with the protocol in tests
 * This extends the BaseClient directly instead of wrapping BasktClient
 */
class TestClient extends sdk_1.BaseClient {
    /**
     * Private constructor - use getInstance() instead
     */
    constructor() {
        // Use the AnchorProvider.env() to get the provider from the environment
        const provider = anchor.AnchorProvider.env();
        anchor.setProvider(provider);
        // Get the program from the workspace
        const program = anchor.workspace.BasktV1;
        // Initialize the base client
        super(program);
    }
    /**
     * Get the singleton instance of the test client
     */
    static getInstance() {
        if (!TestClient.instance) {
            TestClient.instance = new TestClient();
        }
        return TestClient.instance;
    }
    /**
     * Create and add a synthetic asset with a custom oracle in one step
     * @param ticker Asset ticker symbol
     * @param price Oracle price (optional)
     * @param exponent Price exponent (optional)
     * @returns Object containing asset and oracle information
     */
    async createAssetWithCustomOracle(ticker, price = this.DEFAULT_PRICE, exponent = this.DEFAULT_PRICE_EXPONENT) {
        // We inherit createAndAddAssetWithCustomOracle from BaseClient
        const result = await this.createAndAddAssetWithCustomOracle(ticker, price, exponent);
        // Format the result to match the expected return format of the TestClient
        return {
            assetKeypair: result.assetKeypair,
            assetId: result.assetId,
            ticker,
            oracle: result.oracle,
            oracleParams: this.createOracleParams(result.oracle.address, "custom"),
        };
    }
}
exports.TestClient = TestClient;
