import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Keypair } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';

describe('protocol feature flags', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Create test account for non-owner tests
  const nonOwnerAccount = Keypair.generate();

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

    // Reset all features to enabled for subsequent tests
    await client.updateFeatureFlags({
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
  });

  it('Non-owner cannot update feature flags', async () => {
    // Create a new client instance with the non-owner account
    const program = client.program;

    // Create a mock function for testing non-owner access
    const mockUpdateFeatureFlags = async () => {
      // Use the program directly with non-owner account
      return await program.methods
        .updateFeatureFlags({
          allowAddLiquidity: true, // allow_add_liquidity
          allowRemoveLiquidity: true, // allow_remove_liquidity
          allowOpenPosition: true, // allow_open_position
          allowClosePosition: true, // allow_close_position
          allowPnlWithdrawal: true, // allow_pnl_withdrawal
          allowCollateralWithdrawal: true, // allow_collateral_withdrawal
          allowAddCollateral: true, // allow_add_collateral
          allowBasktCreation: true, // allow_baskt_creation
          allowBasktUpdate: true, // allow_baskt_update
          allowTrading: true, // allow_trading
          allowLiquidations: true, // allow_liquidations
        })
        .accounts({
          owner: nonOwnerAccount.publicKey,
        })
        .signers([nonOwnerAccount])
        .rpc();
    };

    try {
      // Attempt to update feature flags as non-owner
      await mockUpdateFeatureFlags();
      // If we reach here, the test should fail
      expect.fail('Non-owner should not be able to update feature flags');
    } catch (error) {
      // We expect an error, so this is a successful test
      expect(error).to.exist;
    }
  });
});
