import { expect } from 'chai';
import { describe, it, after } from 'mocha';
import { TestClient } from '../utils/test-client';
import { TestCleanup } from '../utils/test-cleanup';
import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { AccessControlRole } from '@baskt/types';
import { USDC_MINT } from '@baskt/sdk';

describe('protocol', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  const DEPOSIT_FEE_BPS = 50; // 0.25%
  const WITHDRAWAL_FEE_BPS = 50; // 0.5%
  const MIN_DEPOSIT = new BN(1_000_000); // 1 USDC (assuming 6 decimals)

  after(async () => {
    // Clean up roles added during initialization
    await TestCleanup.cleanupRoles(client, [
      { publicKey: client.assetManager.publicKey, role: AccessControlRole.AssetManager },
      { publicKey: client.basktManager.publicKey, role: AccessControlRole.BasktManager }
    ]);
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

    // Create a liquidity pool with initial liquidity
    const { lpMint } = await client.setupLiquidityPool({
      depositFeeBps: DEPOSIT_FEE_BPS,
      withdrawalFeeBps: WITHDRAWAL_FEE_BPS,
      collateralMint: USDC_MINT,
    });

    const liquidityPoolState = await client.getLiquidityPool();

    const usdcVault = await client.getUsdcVaultPda();
    // Verify the liquidity pool was initialized correctly
    expect(liquidityPoolState.lpMint.toString()).to.equal(lpMint.toString());
    expect(liquidityPoolState.usdcVault.toString()).to.equal(usdcVault[0].toString());
    expect(liquidityPoolState.depositFeeBps).to.equal(DEPOSIT_FEE_BPS);
    expect(liquidityPoolState.withdrawalFeeBps).to.equal(WITHDRAWAL_FEE_BPS);
    
    // Note: min_liquidity is now stored in the protocol config, not the liquidity pool
    const protocolState = await client.getProtocolAccount();
    expect(protocolState.config.minLiquidity.toString()).to.equal(MIN_DEPOSIT.toString());

    expect(liquidityPoolState.totalLiquidity.toString()).to.equal('0');
    expect(liquidityPoolState.totalShares.toString()).to.equal('0');
  });
});
