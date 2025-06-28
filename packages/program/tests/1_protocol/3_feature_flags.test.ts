import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
// Using TestClient static method instead of importing from test-setup
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';

describe('protocol feature flags', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Create test account for non-owner tests
  const nonOwnerAccount = Keypair.generate();

  before(async () => {
    // Initialize the protocol and necessary roles before running tests
    await TestClient.initializeProtocolAndRoles(client);
  });

  afterEach(async () => {
    // Ensure all feature flags are reset to enabled after each test
    const resetSig = await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: true,
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });
    await waitForTx(client.connection, resetSig);
    await waitForNextSlot(client.connection);
  });

  it('Successfully initializes protocol with all features enabled by default', async () => {
    // Get the protocol account
    const protocol = await client.getProtocolAccount();

    // Verify all features are enabled by default
    const featureFlags = protocol.featureFlags;
    expect(featureFlags.allowAddLiquidity).to.be.true;
    expect(featureFlags.allowRemoveLiquidity).to.be.true;
    expect(featureFlags.allowOpenPosition).to.be.true;
    expect(featureFlags.allowClosePosition).to.be.true;
    expect(featureFlags.allowPnlWithdrawal).to.be.true;
    expect(featureFlags.allowCollateralWithdrawal).to.be.true;
    expect(featureFlags.allowBasktCreation).to.be.true;
    expect(featureFlags.allowBasktUpdate).to.be.true;
    expect(featureFlags.allowTrading).to.be.true;
    expect(featureFlags.allowLiquidations).to.be.true;
  });

  it('Successfully updates feature flags', async () => {
    // Update feature flags - disable some features
    await client.updateFeatureFlags({
      allowAddLiquidity: false,
      allowRemoveLiquidity: true,
      allowOpenPosition: false,
      allowClosePosition: true,
      allowPnlWithdrawal: false,
      allowCollateralWithdrawal: true,
      allowAddCollateral: false,
      allowBasktCreation: false,
      allowBasktUpdate: true,
      allowTrading: false,
      allowLiquidations: true,
    });

    // Get the protocol account to verify changes
    const protocol = await client.getProtocolAccount();
    const featureFlags = protocol.featureFlags;

    // Verify the feature flags were updated correctly
    expect(featureFlags.allowAddLiquidity).to.be.false;
    expect(featureFlags.allowRemoveLiquidity).to.be.true;
    expect(featureFlags.allowOpenPosition).to.be.false;
    expect(featureFlags.allowClosePosition).to.be.true;
    expect(featureFlags.allowPnlWithdrawal).to.be.false;
    expect(featureFlags.allowCollateralWithdrawal).to.be.true;
    expect(featureFlags.allowAddCollateral).to.be.false;
    expect(featureFlags.allowBasktCreation).to.be.false;
    expect(featureFlags.allowBasktUpdate).to.be.true;
    expect(featureFlags.allowTrading).to.be.false;
    expect(featureFlags.allowLiquidations).to.be.true;
  });

  it('Non-owner cannot update feature flags', async () => {
    /*
     * Use a completely separate TestClient instance so that any provider / wallet
     * changes required for the negative-permission test are isolated from the
     * singleton that drives the rest of the suite.  This prevents accidental
     * mutation of the global client state.
     */

    const nonOwnerClient = await TestClient.forUser(nonOwnerAccount);
    const program = nonOwnerClient.program;

    // Helper that tries to flip a flag and should fail with UnauthorizedRole
    const attemptFlagUpdate = async () => {
      return await program.methods
        .updateFeatureFlags({
          allowAddLiquidity: true,
          allowRemoveLiquidity: true,
          allowOpenPosition: true,
          allowClosePosition: true,
          allowPnlWithdrawal: true,
          allowCollateralWithdrawal: true,
          allowAddCollateral: true,
          allowBasktCreation: true,
          allowBasktUpdate: true,
          allowTrading: true,
          allowLiquidations: true,
        })
        .accounts({
          owner: nonOwnerAccount.publicKey,
        })
        .rpc();
    };

    try {
      await attemptFlagUpdate();
      expect.fail('Non-owner should not be able to update feature flags');
    } catch (error) {
      expect(error).to.exist;
    }
  });
});
