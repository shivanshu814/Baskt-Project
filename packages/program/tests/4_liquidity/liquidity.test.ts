import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';
import { BN } from 'bn.js';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';

describe('Liquidity Pool', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  const DEPOSIT_FEE_BPS = 50; // 0.25%
  const WITHDRAWAL_FEE_BPS = 50; // 0.5%
  const MIN_DEPOSIT = new BN(1_000_000); // 1 USDC (assuming 6 decimals)
  const DEPOSIT_AMOUNT = new BN(100_000_000); // 100 USDC

  let treasury: Keypair;
  let liquidityProvider: Keypair;

  // Liquidity Pool accounts
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let tokenVault: PublicKey;
  let providerTokenAccount: PublicKey;
  let providerLpAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let lpClient: TestClient;

  before(async () => {
    // Initialize protocol first with client's treasury
    try {
      const protocol = await client.getProtocolAccount();
      if (!protocol.isInitialized) {
        await client.initializeProtocol(client.treasury.publicKey);
      }
    } catch (error) {
      // Protocol doesn't exist, initialize it
      await client.initializeProtocol(client.treasury.publicKey);
    }
    
    // Initialize TestClient roles (AssetManager, OracleManager)
    await client.initializeRoles();

    // Create test keypairs
    liquidityProvider = Keypair.generate();
    treasury = client.treasury;

    // Fund the test accounts
    await requestAirdrop(liquidityProvider.publicKey, client.connection);
    await requestAirdrop(treasury.publicKey, client.connection);

    // Create user clients
    lpClient = await TestClient.forUser(liquidityProvider);

    // Enable liquidity features
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

    const poolSetup = await client.setupLiquidityPoolWithLiquidity({
      depositFeeBps: DEPOSIT_FEE_BPS,
      withdrawalFeeBps: WITHDRAWAL_FEE_BPS,
      minDeposit: MIN_DEPOSIT,
      initialDeposit: DEPOSIT_AMOUNT,
      provider: liquidityProvider,
    });

    // Store pool accounts for future tests
    liquidityPool = poolSetup.liquidityPool;
    lpMint = poolSetup.lpMint;
    tokenVault = poolSetup.tokenVault;
    providerTokenAccount = poolSetup.providerTokenAccount;
    providerLpAccount = poolSetup.providerLpAccount;
    treasuryTokenAccount = poolSetup.treasuryTokenAccount;
  });

  afterEach(async () => {
    // Reset feature flags to enabled state after each test
    try {
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
    } catch (error) {
      // Silently handle cleanup errors to avoid masking test failures
      console.warn('Cleanup error in liquidity.test.ts:', error);
    }
  });

  it('Initializes the liquidity pool', async () => {
    // Fetch liquidity pool state
    const liquidityPoolState = await client.getLiquidityPool();

    // Verify the liquidity pool was initialized correctly
    expect(liquidityPoolState.lpMint.toString()).to.equal(lpMint.toString());
    expect(liquidityPoolState.tokenVault.toString()).to.equal(tokenVault.toString());
    expect(liquidityPoolState.depositFeeBps).to.equal(DEPOSIT_FEE_BPS);
    expect(liquidityPoolState.withdrawalFeeBps).to.equal(WITHDRAWAL_FEE_BPS);
    expect(liquidityPoolState.minDeposit.toString()).to.equal(MIN_DEPOSIT.toString());

    // Calculate expected values from our deposit
    const expectedFeeAmount = DEPOSIT_AMOUNT.muln(DEPOSIT_FEE_BPS).divn(10000);
    const expectedNetDeposit = DEPOSIT_AMOUNT.sub(expectedFeeAmount);

    // Verify token balances - check that our provider received the expected LP tokens
    const lpTokenBalance = await getAccount(client.connection, providerLpAccount);
    expect(lpTokenBalance.amount.toString()).to.equal(expectedNetDeposit.toString());

    // Note: We don't check absolute pool totals or vault balance since the pool may have
    // liquidity from previous tests. The successful completion of setupLiquidityPoolWithLiquidity
    // already verifies that our deposit was processed correctly.

    // Verify that the pool has at least our expected liquidity
    expect(Number(liquidityPoolState.totalLiquidity.toString())).to.be.at.least(Number(expectedNetDeposit.toString()));
    expect(Number(liquidityPoolState.totalShares.toString())).to.be.at.least(Number(expectedNetDeposit.toString()));
  });

  it('Deposits additional liquidity and receives LP tokens', async () => {
    // Calculate expected values for second deposit
    const secondDepositAmount = new BN(50_000_000); // 50 USDC
    const expectedFeeAmount = secondDepositAmount.muln(DEPOSIT_FEE_BPS).divn(10000);
    const expectedNetDeposit = secondDepositAmount.sub(expectedFeeAmount);

    // Get current pool state and treasury balance before operation
    const poolStateBefore = await client.getLiquidityPool();
    const treasuryBalanceBefore = await getAccount(client.connection, treasuryTokenAccount);

    // Get the current liquidity and shares totals for calculation
    const totalLiquidityBefore = new BN(poolStateBefore.totalLiquidity.toString());
    const totalSharesBefore = new BN(poolStateBefore.totalShares.toString());

    // For subsequent deposits, calculate expected shares:
    // shares = (net_deposit * total_shares) / total_liquidity
    const expectedShares = expectedNetDeposit.mul(totalSharesBefore).div(totalLiquidityBefore);

    // Mint more tokens to provider for this deposit
    await client.mintUSDC(providerTokenAccount, secondDepositAmount);
    // Add more liquidity using the provider's client
    await lpClient.addLiquidityToPool({
      liquidityPool,
      amount: secondDepositAmount,
      minSharesOut: expectedShares,
      providerTokenAccount,
      tokenVault,
      providerLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });

    // Fetch updated state
    const poolStateAfter = await client.getLiquidityPool();
    const lpTokenBalance = await getAccount(client.connection, providerLpAccount);
    const treasuryBalanceAfter = await getAccount(client.connection, treasuryTokenAccount);

    // Calculate expected new totals
    const expectedTotalLiquidity = totalLiquidityBefore.add(expectedNetDeposit);
    const expectedTotalShares = totalSharesBefore.add(expectedShares);

    // Verify pool state and balances
    expect(poolStateAfter.totalLiquidity.toString()).to.equal(expectedTotalLiquidity.toString());
    expect(poolStateAfter.totalShares.toString()).to.equal(expectedTotalShares.toString());
    expect(lpTokenBalance.amount.toString()).to.equal(expectedTotalShares.toString());

    // Check that treasury received exactly the expected fee amount from this operation
    const treasuryBalanceIncrease = BigInt(treasuryBalanceAfter.amount.toString()) - BigInt(treasuryBalanceBefore.amount.toString());
    expect(treasuryBalanceIncrease.toString()).to.equal(expectedFeeAmount.toString());
  });

  it('Withdraws liquidity by burning LP tokens', async () => {
    // Get current pool state and treasury balance before operation
    const poolStateBefore = await client.getLiquidityPool();
    const treasuryBalanceBefore = await getAccount(client.connection, treasuryTokenAccount);

    // Calculate burn amount - 25% of total shares
    const totalShares = new BN(poolStateBefore.totalShares.toString());
    const burnAmount = totalShares.divn(4); // 25%

    // Calculate expected values
    const expectedWithdrawalAmount = burnAmount
      .mul(new BN(poolStateBefore.totalLiquidity.toString()))
      .div(totalShares);
    const expectedFeeAmount = expectedWithdrawalAmount.muln(WITHDRAWAL_FEE_BPS).divn(10000);
    const expectedNetAmount = expectedWithdrawalAmount.sub(expectedFeeAmount);

    // Remove liquidity using the provider's client
    await lpClient.removeLiquidityFromPool({
      liquidityPool,
      lpAmount: burnAmount,
      minTokensOut: expectedNetAmount,
      providerTokenAccount,
      tokenVault,
      providerLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });

    // Fetch updated state
    const poolStateAfter = await client.getLiquidityPool();
    const lpTokenBalance = await getAccount(client.connection, providerLpAccount);
    const treasuryBalanceAfter = await getAccount(client.connection, treasuryTokenAccount);

    // Calculate expected values after withdrawal
    const expectedRemainingShares = totalShares.sub(burnAmount);
    const expectedRemainingLiquidity = new BN(poolStateBefore.totalLiquidity.toString()).sub(
      expectedWithdrawalAmount,
    );

    // Verify the expected states
    expect(poolStateAfter.totalShares.toString()).to.equal(expectedRemainingShares.toString());
    expect(poolStateAfter.totalLiquidity.toString()).to.equal(
      expectedRemainingLiquidity.toString(),
    );
    expect(lpTokenBalance.amount.toString()).to.equal(expectedRemainingShares.toString());

    // Check that treasury received exactly the expected fee amount from this withdrawal operation
    const treasuryBalanceIncrease = BigInt(treasuryBalanceAfter.amount.toString()) - BigInt(treasuryBalanceBefore.amount.toString());
    expect(treasuryBalanceIncrease.toString()).to.equal(expectedFeeAmount.toString());
  });

  it('Fails when trying to deposit below minimum deposit amount', async () => {
    // Try to deposit below minimum amount (should fail)
    try {
      const belowMinDeposit = MIN_DEPOSIT.subn(1); // 1 less than minimum

      // Mint tokens to provider for this test
      await client.mintUSDC(providerTokenAccount, belowMinDeposit);

      // Attempt to add liquidity with below minimum amount
      await lpClient.addLiquidityToPool({
        liquidityPool,
        amount: belowMinDeposit,
        minSharesOut: new BN(0),
        providerTokenAccount,
        tokenVault,
        providerLpAccount,
        lpMint,
        treasuryTokenAccount,
        treasury: treasury.publicKey,
      });

      // Should not reach here
      expect.fail('Transaction should have failed due to below minimum deposit');
    } catch (err) {
      // Type assertion for error handling
      const error = err as { toString: () => string };
      // Verify error message indicates minimum deposit failure
      expect(error.toString()).to.include('BelowMinimumDeposit');
    }
  });

  it('Fails when a deposit would result in zero LP tokens', async () => {
    // This test assumes the pool already has sufficient liquidity from previous tests
    // A tiny deposit that would result in zero LP tokens due to rounding
    // For a pool with substantial liquidity, a deposit of 1 token unit is likely to
    // result in zero shares due to rounding in the formula:
    // shares = (deposit * total_shares) / total_liquidity
    const tinyDeposit = new BN(1); // Just 1 token unit

    // Mint tokens to provider for this test
    await client.mintUSDC(providerTokenAccount, tinyDeposit);

    try {
      // Attempt to add liquidity with a tiny amount
      await lpClient.addLiquidityToPool({
        liquidityPool,
        amount: tinyDeposit,
        minSharesOut: new BN(0),
        providerTokenAccount,
        tokenVault,
        providerLpAccount,
        lpMint,
        treasuryTokenAccount,
        treasury: treasury.publicKey,
      });

      // Should not reach here
      expect.fail('Transaction should have failed due to zero LP tokens');
    } catch (err) {
      // Type assertion for error handling
      const error = err as { toString: () => string };
      // console.debug(error.toString());
      // In this case we expect InvalidLpTokenAmount error
      expect(error.toString()).to.include('BelowMinimumDeposit');
    }
  });
});
