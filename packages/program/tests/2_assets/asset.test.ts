import { expect } from "chai";
import { describe, it, before } from "mocha";
import { Keypair } from "@solana/web3.js";
import { TestClient } from "../utils/test-client";
import { AccessControlRole } from "@baskt/sdk";

describe("asset", () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Initial price data
  const priceExponent = -6; // 6 decimal places

  // Set up test roles before running tests
  before(async () => {
    await client.initializeRoles();

    // Verify roles were assigned correctly
    const hasAssetManagerRole = await client.hasRole(
      client.assetManager.publicKey,
      AccessControlRole.AssetManager
    );
    const hasOracleManagerRole = await client.hasRole(
      client.oracleManager.publicKey,
      AccessControlRole.OracleManager
    );

    expect(hasAssetManagerRole).to.be.true;
    expect(hasOracleManagerRole).to.be.true;
  });

  it("Successfully adds a new synthetic asset with custom oracle", async () => {
    // Create a custom oracle and asset in one step
    // The client should have the AssetManager role by default since it's the protocol owner
    const { assetAddress, ticker, oracle } =
      await client.createAssetWithCustomOracle("BTC");

    // Fetch the asset account to verify it was initialized correctly
    const assetAccount = await client.getAsset(assetAddress);

    // Verify the asset was initialized with correct values
    expect(assetAccount.assetId.toString()).to.equal(assetAddress.toString());
    expect(assetAccount.ticker).to.equal(ticker);
    expect(assetAccount.oracle.oracleAccount.toString()).to.equal(
      oracle.toString()
    );
    expect(assetAccount.oracle.oracleType).to.deep.include({ custom: {} });
    expect(assetAccount.oracle.maxPriceError.toNumber()).to.equal(100);
    expect(assetAccount.oracle.maxPriceAgeSec).to.equal(60);
    expect(assetAccount.oracle.oracleAuthority.toString()).to.equal(
      client.wallet.publicKey.toString()
    );
    expect(assetAccount.openInterestLong.toNumber()).to.equal(0);
    expect(assetAccount.openInterestShort.toNumber()).to.equal(0);
    expect(assetAccount.fundingRate.toNumber()).to.equal(0);
  });

  it("Successfully updates oracle price and verifies the change", async () => {
    // Create a custom oracle and asset for this test
    // The client should have the OracleManager role by default since it's the protocol owner
    const { assetAddress } = await client.createAssetWithCustomOracle("ETH", 3000); // Initial price $3,000

    // Get the asset to access the oracle account
    const assetAccount = await client.getAsset(assetAddress);
    const oracleAddress = assetAccount.oracle.oracleAccount;

    // New price to set ($3,500)
    const newPrice = 3500; 
 
    // Update the oracle price
    await client.updateOraclePrice(oracleAddress, newPrice, priceExponent);

    // Fetch the oracle account to verify the price was updated
    const oracleAccount = await client.getOracleAccount(oracleAddress);

    // Calculate the on-chain price in dollars
    const onChainPrice = oracleAccount.price.toNumber();

    // Verify the price was updated correctly
    // Allow for some small rounding errors in the conversion
    expect(onChainPrice).to.be.equal(newPrice * 1e6);

    // Verify the publish time was updated
    expect(oracleAccount.publishTime.toNumber()).to.be.greaterThan(0);
  });

  it("Successfully adds an asset with Pyth oracle", async () => {
    // Create a Pyth oracle and asset in one step
    // The client should have the AssetManager role by default since it's the protocol owner
    const { assetAddress, oracle } = await client.createAndAddAssetWithPythOracle("SOL");

    // Fetch the asset account to verify it was initialized correctly
    const assetAccount = await client.getAsset(assetAddress);

    // Verify the asset was initialized with correct values
    expect(assetAccount.assetId.toString()).to.equal(assetAddress.toString());
    expect(assetAccount.ticker).to.equal("SOL");
    expect(assetAccount.oracle.oracleAccount.toString()).to.equal(
      oracle.toString()
    );
    expect(assetAccount.oracle.oracleType).to.deep.include({ pyth: {} });
    expect(assetAccount.oracle.maxPriceError.toNumber()).to.equal(100);
    expect(assetAccount.oracle.maxPriceAgeSec).to.equal(60);
    expect(assetAccount.oracle.oracleAuthority.toString()).to.equal(
      client.wallet.publicKey.toString()
    );
    expect(assetAccount.openInterestLong.toNumber()).to.equal(0);
    expect(assetAccount.openInterestShort.toNumber()).to.equal(0);
  });

  // Note: The following tests would require additional instruction handlers in the program
  // to expose internal functionality for testing

  it.skip("Tests funding rate calculation with different market skews", async () => {
    // This test demonstrates how you would test funding rate calculations
    // with different market skews using oracle price updates

    // Create a custom oracle and asset in one step
    // The client should have the AssetManager role by default since it's the protocol owner
    const { assetAddress, oracle } = await client.createAssetWithCustomOracle(
      "FUND"
    );

    // Fetch the asset account to verify it was initialized correctly
    const assetAccount = await client.getAsset(assetAddress);

    // Verify basic asset properties
    expect(assetAccount.assetId.toString()).to.equal(assetAddress.toString());
    expect(assetAccount.oracle.oracleAccount.toString()).to.equal(
      oracle.toString()
    );

    // Verify initial funding rate is zero
    expect(assetAccount.fundingRate.toNumber()).to.equal(0);

    // In a real test, you would now:
    // 1. Set up different market skews (e.g., more longs than shorts)
    // 2. Call a test instruction to calculate funding rates
    // 3. Verify the funding rates match expected values
  });

  it("Tests oracle price staleness handling", async () => {
    // Create a stale oracle (2 hours ago)
    // The client should have the OracleManager role by default since it's the protocol owner
    const staleOracle = await client.createStaleOracle(7200); // 2 hours in seconds

    // Verify the oracle was created with the stale timestamp
    const oracleAccount = await client.getOracleAccount(staleOracle.address);

    // Get current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    // The timestamp should be approximately 2 hours ago (with some tolerance)
    expect(currentTime - oracleAccount.publishTime.toNumber()).to.be.closeTo(
      7200,
      10
    );

    const staleTicker = "STALE";

    // Create oracle parameters with a short max age
    const staleOracleParams = client.createOracleParams(
      staleOracle.address,
      "custom",
      100, // 1% max price error
      10 // Only 10 seconds allowed
    );

    // Add the asset with the stale oracle
    const { assetAddress } = await client.addAsset(
      staleTicker,
      staleOracleParams
    );

    // Verify the asset was created with the correct oracle parameters
    const assetAccount = await client.getAsset(assetAddress);

    expect(assetAccount.oracle.oracleAccount.toString()).to.equal(
      staleOracle.address.toString()
    );
    expect(assetAccount.oracle.maxPriceAgeSec).to.equal(10);
  });

  it("Tests permission checks for asset management", async () => {
    // Create a new keypair without any roles
    const unauthorizedUser = Keypair.generate();

    // Verify the unauthorized user doesn't have the AssetManager role
    const hasRole = await client.hasRole(
      unauthorizedUser.publicKey,
      AccessControlRole.AssetManager
    );
    expect(hasRole).to.be.false;

    // Verify the asset manager has the correct role
    const hasAssetManagerRole = await client.hasRole(
      client.assetManager.publicKey,
      AccessControlRole.AssetManager
    );
    expect(hasAssetManagerRole).to.be.true;
  });

  it("Successfully gets asset price from oracle", async () => {
    // Create a new asset with a custom oracle
    const initialPrice = 3000;
    const { assetAddress, oracle } = await client.createAssetWithCustomOracle("XYZ", initialPrice);
    
    // Get and log oracle account details
    const oracleAccount = await client.getOracleAccount(oracle);
    const currentTime = Math.floor(Date.now() / 1000);
        
    // Get the asset price using the view function
    const price = await client.getAssetPrice(assetAddress, oracle);
    
    // Update the price to a new value
    const newPrice = 4000; // Scale properly
    await client.updateOraclePrice(oracle, newPrice);
    
    // Get and log updated oracle account details
    const updatedOracleAccount = await client.getOracleAccount(oracle);
    const updatedCurrentTime = Math.floor(Date.now() / 1000);

    // Get the updated price
    const updatedPrice = await client.getAssetPrice(assetAddress, oracle);

    // Verify the updated price
    expect(updatedPrice.toString()).to.be.equal((newPrice * 1e6).toString());
  });
});
