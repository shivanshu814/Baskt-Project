import { expect } from "chai";
import { describe, it, before, beforeEach } from "mocha";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TestClient } from "../utils/test-client";
import { BN } from "@coral-xyz/anchor";
import { AccessControlRole } from "@baskt/sdk";

describe("baskt", () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Asset IDs that will be used across tests
  let btcAssetId: PublicKey;
  let ethAssetId: PublicKey;
  let solAssetId: PublicKey;

  // Set up test roles and assets before running tests
  before(async () => {
    // Create assets that will be used across tests
    const { assetAddress: btcAsset } = await client.createAssetWithCustomOracle("BTC", 50000);
    const { assetAddress: ethAsset } = await client.createAssetWithCustomOracle("ETH", 3000);
    const { assetAddress: solAsset } = await client.createAssetWithCustomOracle("SOL", 100);

    btcAssetId = btcAsset;
    ethAssetId = ethAsset;
    solAssetId = solAsset;
  });

  it("Successfully creates a new baskt with valid asset configs", async () => {
    // Create asset configs for the baskt
    const assetConfigs = [
      {
        assetId: btcAssetId,
        direction: true,
        weight: 6000, // 60% BTC
      },
      {
        assetId: ethAssetId,
        direction: true,
        weight: 4000, // 40% ETH
      }
    ];

    // Create the baskt
    const { basktId, txSignature } = await client.createBaskt(
      "TestBaskt",
      assetConfigs,
      true // is_public
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.isPublic).to.be.true;
    expect(basktAccount.creator.toString()).to.equal(client.wallet.publicKey.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(2);
    
    // Verify asset configs
    const btcConfig = basktAccount.currentAssetConfigs.find(config => 
      config.assetId.toString() === btcAssetId.toString()
    );
    expect(btcConfig?.weight.toNumber()).to.equal(6000);

    const ethConfig = basktAccount.currentAssetConfigs.find(config => 
      config.assetId.toString() === ethAssetId.toString()
    );
    expect(ethConfig?.weight.toNumber()).to.equal(4000);
  });

  it("Fails to create a baskt with invalid total weight", async () => {
    // Create asset configs with invalid total weight (not 100%)
    const assetConfigs = [
      {
        assetId: btcAssetId,
        direction: true,
        weight: 6000, // 60% BTC
      },
      {
        assetId: ethAssetId,
        direction: true,
        weight: 5000, // 50% ETH (total 110%)
      }
    ];

    // Attempt to create the baskt - should fail
    try {
      await client.createBaskt("BadBaskt", assetConfigs, true);
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).to.include("InvalidBasktConfig");
    }
  });

  it("Successfully creates a private baskt", async () => {
    // Create asset config for the baskt
    const assetConfigs = [
      {
        assetId: solAssetId,
        direction: true,
        weight: 10000, // 100% SOL
      }
    ];

    // Create the private baskt
    const { basktId } = await client.createBaskt(
      "PrivBaskt",
      assetConfigs,
      false // is_public
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.isPublic).to.be.false;
    expect(basktAccount.creator.toString()).to.equal(client.wallet.publicKey.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(1);
    
    // Verify asset config
    const solConfig = basktAccount.currentAssetConfigs[0];
    expect(solConfig.assetId.toString()).to.equal(solAssetId.toString());
    expect(solConfig.weight.toNumber()).to.equal(10000);
  });

  it("Successfully creates a baskt with multiple assets", async () => {
    // Create asset configs for the baskt
    const assetConfigs = [
      {
        assetId: btcAssetId,
        direction: true,
        weight: 5000, // 50% BTC
      },
      {
        assetId: ethAssetId,
        direction: true,
        weight: 3000, // 30% ETH
      },
      {
        assetId: solAssetId,
        direction: true,
        weight: 2000, // 20% SOL
      }
    ];

    // Create the baskt
    const { basktId } = await client.createBaskt(
      "MultiBaskt",
      assetConfigs,
      true // is_public
    );

    // Fetch the baskt account to verify it was initialized correctly
    const basktAccount = await client.getBaskt(basktId);

    // Verify the baskt was initialized with correct values
    expect(basktAccount.basktId.toString()).to.equal(basktId.toString());
    expect(basktAccount.isPublic).to.be.true;
    expect(basktAccount.creator.toString()).to.equal(client.wallet.publicKey.toString());
    expect(basktAccount.currentAssetConfigs).to.have.length(3);
    
    // Verify all asset configs
    const btcConfig = basktAccount.currentAssetConfigs.find(config => 
      config.assetId.toString() === btcAssetId.toString()
    );
    expect(btcConfig?.weight.toNumber()).to.equal(5000);

    const ethConfig = basktAccount.currentAssetConfigs.find(config => 
      config.assetId.toString() === ethAssetId.toString()
    );
    expect(ethConfig?.weight.toNumber()).to.equal(3000);

    const solConfig = basktAccount.currentAssetConfigs.find(config => 
      config.assetId.toString() === solAssetId.toString()
    );
    expect(solConfig?.weight.toNumber()).to.equal(2000);
  });
}); 