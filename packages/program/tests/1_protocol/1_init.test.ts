import { expect } from 'chai';
import { describe, it, after } from 'mocha';
import { TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { AccessControlRole } from '@baskt/types';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';

describe('protocol', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  const DEPOSIT_FEE_BPS = 50; // 0.25%
  const WITHDRAWAL_FEE_BPS = 50; // 0.5%
  const MIN_DEPOSIT = new BN(1_000_000); // 1 USDC (assuming 6 decimals)

  after(async () => {
    // Clean up roles added during initialization
    try {
      const removeAssetManagerSig = await client.removeRole(
        client.assetManager.publicKey,
        AccessControlRole.AssetManager
      );
      await waitForTx(client.connection, removeAssetManagerSig);

      const removeOracleManagerSig = await client.removeRole(
        client.oracleManager.publicKey,
        AccessControlRole.OracleManager
      );
      await waitForTx(client.connection, removeOracleManagerSig);
      await waitForNextSlot(client.connection);
    } catch (error) {
      // Silently handle cleanup errors to avoid masking test failures
      console.warn('Cleanup error in 1_init.test.ts:', error);
    }
  });

  it('Successfully initializes the protocol', async () => {
    await client.initializeProtocol(client.treasury.publicKey);
    await client.initializeRoles();

    // Fetch the protocol account to verify it was initialized correctly
    const protocolAccount = await client.getProtocolAccount();

    // Verify the protocol is initialized
    expect(protocolAccount.isInitialized).to.be.true;

    // Verify the payer is set as the owner
    expect(protocolAccount.owner.toString()).to.equal(client.getPublicKey().toString());
  });

  it('Successfully initializes the BLP', async () => {
    const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

    // Create a liquidity pool with initial liquidity
    const { lpMint } = await client.setupLiquidityPool({
      depositFeeBps: DEPOSIT_FEE_BPS,
      withdrawalFeeBps: WITHDRAWAL_FEE_BPS,
      minDeposit: MIN_DEPOSIT,
      collateralMint,
    });

    const liquidityPoolState = await client.getLiquidityPool();

    const tokenVault = await client.getTokenVaultPda();
    // Verify the liquidity pool was initialized correctly
    expect(liquidityPoolState.lpMint.toString()).to.equal(lpMint.toString());
    expect(liquidityPoolState.tokenVault.toString()).to.equal(tokenVault[0].toString());
    expect(liquidityPoolState.depositFeeBps).to.equal(DEPOSIT_FEE_BPS);
    expect(liquidityPoolState.withdrawalFeeBps).to.equal(WITHDRAWAL_FEE_BPS);
    expect(liquidityPoolState.minDeposit.toString()).to.equal(MIN_DEPOSIT.toString());

    expect(liquidityPoolState.totalLiquidity.toString()).to.equal('0');
    expect(liquidityPoolState.totalShares.toString()).to.equal('0');
  });
});
