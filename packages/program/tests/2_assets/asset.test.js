"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const web3_js_1 = require("@solana/web3.js");
const test_client_1 = require("../utils/test-client");
(0, mocha_1.describe)("asset", () => {
    // Get the test client instance
    const client = test_client_1.TestClient.getInstance();
    // Initial price data
    const priceExponent = -6; // 6 decimal places
    (0, mocha_1.it)("Successfully adds a new synthetic asset with custom oracle", async () => {
        // Create a custom oracle and asset in one step
        const { assetKeypair, assetId, ticker, oracle } = await client.createAssetWithCustomOracle("BTC");
        // Fetch the asset account to verify it was initialized correctly
        const assetAccount = await client.getAsset(assetKeypair.publicKey);
        // Verify the asset was initialized with correct values
        (0, chai_1.expect)(assetAccount.assetId.toString()).to.equal(assetId.toString());
        (0, chai_1.expect)(assetAccount.ticker).to.equal(ticker);
        (0, chai_1.expect)(assetAccount.oracle.oracleAccount.toString()).to.equal(oracle.address.toString());
        (0, chai_1.expect)(assetAccount.oracle.oracleType).to.deep.include({ custom: {} });
        (0, chai_1.expect)(assetAccount.oracle.maxPriceError.toNumber()).to.equal(100);
        (0, chai_1.expect)(assetAccount.oracle.maxPriceAgeSec).to.equal(60);
        (0, chai_1.expect)(assetAccount.oracle.oracleAuthority.toString()).to.equal(client.wallet.publicKey.toString());
        (0, chai_1.expect)(assetAccount.openInterestLong.toNumber()).to.equal(0);
        (0, chai_1.expect)(assetAccount.openInterestShort.toNumber()).to.equal(0);
        (0, chai_1.expect)(assetAccount.fundingRate.toNumber()).to.equal(0);
    });
    (0, mocha_1.it)("Successfully updates oracle price and verifies the change", async () => {
        // Create a custom oracle and asset for this test
        const { oracle } = await client.createAssetWithCustomOracle("ETH", 3000); // Initial price $3,000
        // New price to set ($3,500)
        const newPrice = 3500;
        // Update the oracle price
        await client.updateOraclePrice(oracle.address, newPrice, priceExponent);
        // Fetch the oracle account to verify the price was updated
        const oracleAccount = await client.getOracleAccount(oracle.address);
        // Calculate the on-chain price in dollars
        const onChainPrice = oracleAccount.price.toNumber() * Math.pow(10, oracleAccount.expo);
        // Verify the price was updated correctly
        // Allow for some small rounding errors in the conversion
        (0, chai_1.expect)(onChainPrice).to.be.closeTo(newPrice, 0.1);
        // Verify the publish time was updated
        (0, chai_1.expect)(oracleAccount.publishTime.toNumber()).to.be.greaterThan(0);
    });
    (0, mocha_1.it)("Successfully adds an asset with Pyth oracle", async () => {
        // Create a Pyth oracle and asset in one step
        const { assetKeypair, assetId, oracle } = await client.createAndAddAssetWithPythOracle("SOL");
        // Fetch the asset account to verify it was initialized correctly
        const assetAccount = await client.getAsset(assetKeypair.publicKey);
        // Verify the asset was initialized with correct values
        (0, chai_1.expect)(assetAccount.assetId.toString()).to.equal(assetId.toString());
        (0, chai_1.expect)(assetAccount.ticker).to.equal("SOL");
        (0, chai_1.expect)(assetAccount.oracle.oracleAccount.toString()).to.equal(oracle.address.toString());
        (0, chai_1.expect)(assetAccount.oracle.oracleType).to.deep.include({ pyth: {} });
        (0, chai_1.expect)(assetAccount.oracle.maxPriceError.toNumber()).to.equal(100);
        (0, chai_1.expect)(assetAccount.oracle.maxPriceAgeSec).to.equal(60);
        (0, chai_1.expect)(assetAccount.oracle.oracleAuthority.toString()).to.equal(client.wallet.publicKey.toString());
        (0, chai_1.expect)(assetAccount.openInterestLong.toNumber()).to.equal(0);
        (0, chai_1.expect)(assetAccount.openInterestShort.toNumber()).to.equal(0);
    });
    // Note: The following tests would require additional instruction handlers in the program
    // to expose internal functionality for testing
    mocha_1.it.skip("Tests funding rate calculation with different market skews", async () => {
        // This test demonstrates how you would test funding rate calculations
        // with different market skews using oracle price updates
        // Create a custom oracle and asset in one step
        const { assetKeypair, assetId, oracle } = await client.createAssetWithCustomOracle("FUND");
        // Fetch the asset account to verify it was initialized correctly
        const assetAccount = await client.getAsset(assetKeypair.publicKey);
        // Verify basic asset properties
        (0, chai_1.expect)(assetAccount.assetId.toString()).to.equal(assetId.toString());
        (0, chai_1.expect)(assetAccount.oracle.oracleAccount.toString()).to.equal(oracle.address.toString());
        // Verify initial funding rate is zero
        (0, chai_1.expect)(assetAccount.fundingRate.toNumber()).to.equal(0);
        // In a real test, you would now:
        // 1. Set up different market skews (e.g., more longs than shorts)
        // 2. Call a test instruction to calculate funding rates
        // 3. Verify the funding rates match expected values
    });
    (0, mocha_1.it)("Tests oracle price staleness handling", async () => {
        // Create a stale oracle (2 hours ago)
        const staleOracle = await client.createStaleOracle(7200); // 2 hours in seconds
        // Verify the oracle was created with the stale timestamp
        const oracleAccount = await client.getOracleAccount(staleOracle.address);
        // Get current time in seconds
        const currentTime = Math.floor(Date.now() / 1000);
        // The timestamp should be approximately 2 hours ago (with some tolerance)
        (0, chai_1.expect)(currentTime - oracleAccount.publishTime.toNumber()).to.be.closeTo(7200, 10);
        // Create a new asset with a very short max price age (10 seconds)
        const staleAssetKeypair = web3_js_1.Keypair.generate();
        const staleAssetId = web3_js_1.Keypair.generate().publicKey;
        const staleTicker = "STALE";
        // Create oracle parameters with a short max age
        const staleOracleParams = client.createOracleParams(staleOracle.address, "custom", 100, // 1% max price error
        10 // Only 10 seconds allowed
        );
        // Add the asset with the stale oracle
        await client.addAsset(staleAssetKeypair, staleAssetId, staleTicker, staleOracleParams);
        // Verify the asset was created with the correct oracle parameters
        const assetAccount = await client.getAsset(staleAssetKeypair.publicKey);
        (0, chai_1.expect)(assetAccount.oracle.oracleAccount.toString()).to.equal(staleOracle.address.toString());
        (0, chai_1.expect)(assetAccount.oracle.maxPriceAgeSec).to.equal(10);
    });
});
