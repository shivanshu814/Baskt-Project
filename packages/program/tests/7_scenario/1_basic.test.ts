import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { OrderAction, OrderType } from '@baskt/types';

describe('Basic Trading Scenario', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  const NOTIONAL_ORDER_VALUE = new BN(10_000_000);
  const COLLATERAL_AMOUNT = new BN(1_200_000_000);
  const ENTRY_PRICE = BASELINE_PRICE;
  const EXIT_PRICE_PROFIT = ENTRY_PRICE.add(new BN(20_000_000)); // $120 for significant profit
  const EXIT_PRICE_LOSS = ENTRY_PRICE.sub(new BN(20_000_000)); // $80 for significant loss
  const TICKER = 'BTC';
  

  let treasury: Keypair;

  // Test accounts from centralized setup
  let winnerClient: TestClient;
  let loserClient: TestClient;
  let matcherClient: TestClient;
  let liquidityProviderClient: TestClient;
  let liquidatorClient: TestClient;

  let winnerTokenAccount: PublicKey;
  let loserTokenAccount: PublicKey;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let assetId: PublicKey;

  // Liquidity pool accounts for Closing tests
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let usdcVault: PublicKey;


  before(async () => {
    // Use centralized test setup
    const testSetup = await TestClient.setupPositionTest({
      client,
      ticker: TICKER,
    });

    // Assign all the returned values to our test variables
    winnerClient = testSetup.userClient;
    loserClient = testSetup.nonMatcherClient;
    matcherClient = testSetup.matcherClient;
    basktId = testSetup.basktId;
    collateralMint = testSetup.collateralMint;
    userTokenAccount = testSetup.userTokenAccount;
    assetId = testSetup.assetId;

    // Get treasury from protocol
    treasury = client.treasury;
    treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);

    // Get token accounts for the winner and loser
    winnerTokenAccount = await client.getOrCreateUSDCAccountKey(winnerClient.publicKey);
    loserTokenAccount = await client.getOrCreateUSDCAccountKey(loserClient.publicKey);

    // Give USDC to the winner
    await client.mintUSDC(winnerTokenAccount, COLLATERAL_AMOUNT.muln(10).toNumber()); 
    // Give USDC to the loser
    await client.mintUSDC(loserTokenAccount, COLLATERAL_AMOUNT.muln(10).toNumber());

    // Set up a liquidity pool with sufficient funds for position closing
    ({ liquidityPool, lpMint, usdcVault } = await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      collateralMint,
    }));

    // Create a separate provider for liquidity to avoid role conflicts
    liquidityProviderClient = await TestClient.forUser(Keypair.generate());

    // Create token accounts for liquidity provider
    const liquidityProviderTokenAccount = await client.getOrCreateUSDCAccountKey(
      liquidityProviderClient.publicKey,
    );
    const liquidityProviderLpAccount = await client.createTokenAccount(
      lpMint,
      liquidityProviderClient.publicKey,
    );

    // Mint USDC to liquidity provider
    await client.mintUSDC(liquidityProviderTokenAccount, COLLATERAL_AMOUNT.muln(10));

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: COLLATERAL_AMOUNT.muln(10), // deposit 1000x collateral = 15,000 USDC
      minSharesOut: new BN(1),
      providerTokenAccount: liquidityProviderTokenAccount,
      usdcVault,
      providerLpAccount: liquidityProviderLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });

  });

  afterEach(async () => {
    // Reset feature flags to enabled state after each test using centralized helper
    await TestClient.resetFeatureFlags(client);
  });

  it('Successfully closes a position with profit', async () => {  
    const openOrderId = client.newUID();
    const positionId = client.newUID();
    const closeOrderId = client.newUID();

    // Find position PDA
    const positionPDA = await client.getPositionPDA(winnerClient.publicKey, positionId);

    const closeOrderPDA = await client.getOrderPDA(closeOrderId, winnerClient.publicKey);

    // Calculate position size in contracts
    const PRICE_PRECISION = new BN(1_000_000); // 6 decimals
    const positionSizeContracts = NOTIONAL_ORDER_VALUE.mul(PRICE_PRECISION).div(ENTRY_PRICE);

    // Open a position for the winner
    await matcherClient.createAndOpenMarketPosition({
      userClient: winnerClient,
      orderId: openOrderId,
      positionId: positionId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: winnerTokenAccount,
      entryPrice: ENTRY_PRICE,
    });

    // Create close order
    await winnerClient.createMarketCloseOrder({
      orderId: closeOrderId,
      basktId,
      sizeAsContracts: positionSizeContracts,
      targetPosition: positionPDA,
      ownerTokenAccount: winnerTokenAccount,
    });

    // Get balances before closing
    const winnerTokenBefore = await getAccount(client.connection, winnerTokenAccount);
    const treasuryTokenBefore = await getAccount(client.connection, treasuryTokenAccount);
    const vaultBefore = await getAccount(client.connection, usdcVault);

    // Close the position with profit
    await matcherClient.closePosition({
      orderPDA: closeOrderPDA,
      position: positionPDA,
      exitPrice: EXIT_PRICE_PROFIT,
      baskt: basktId,
      ownerTokenAccount: winnerTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
      orderOwner: winnerClient.publicKey,
    });

    // STEP 1: Verify position is closed
    try {
      await client.program.account.position.fetch(positionPDA);
      expect.fail('Position account should be closed');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // STEP 2: Verify order is closed
    try {
      await client.program.account.order.fetch(closeOrderPDA);
      expect.fail('Order account should be closed');
    } catch (error) {
      expect((error as Error).message).to.include('Account does not exist');
    }

    // STEP 3: Verify escrow account is closed
    const positionEscrow = client.getPositionEscrowPDA(positionPDA);
    try {
      await getAccount(client.connection, positionEscrow);
      expect.fail('Position escrow account should be closed');
    } catch (error) {
      expect((error as Error).toString()).to.include('TokenAccountNotFoundError');
    }

    // STEP 4: Get balances after closing and calculate differences
    const winnerTokenAfter = await getAccount(client.connection, winnerTokenAccount);
    const treasuryTokenAfter = await getAccount(client.connection, treasuryTokenAccount);
    const vaultAfter = await getAccount(client.connection, usdcVault);

    const winnerBalanceDiff = new BN(winnerTokenAfter.amount.toString()).sub(
      new BN(winnerTokenBefore.amount.toString()),
    );
    const treasuryBalanceDiff = new BN(treasuryTokenAfter.amount.toString()).sub(
      new BN(treasuryTokenBefore.amount.toString()),
    );
    const vaultDiff = new BN(vaultBefore.amount.toString()).sub(
      new BN(vaultAfter.amount.toString()),
    );

    // STEP 5: Calculate expected values
    const BPS_DIVISOR = new BN(10000);
    const CLOSING_FEE_BPS = new BN(10); // 0.1%
    const OPENING_FEE_BPS = new BN(10); // 0.1%
    const TREASURY_CUT_BPS = new BN(1000); // 10%

    // Calculate 20% profit: (exit_price - entry_price) * position_size_contracts / PRICE_PRECISION
    const priceDelta = EXIT_PRICE_PROFIT.sub(ENTRY_PRICE); // 20_000_000 (20 USDC price difference)
    const expectedProfit = priceDelta.mul(positionSizeContracts).div(PRICE_PRECISION);

    // Calculate closing fee based on exit notional value
    const exitNotional = positionSizeContracts.mul(EXIT_PRICE_PROFIT).div(PRICE_PRECISION);
    const closingFee = exitNotional.mul(CLOSING_FEE_BPS).div(BPS_DIVISOR);

    // Calculate opening fee (already deducted from position collateral)
    const openingFee = NOTIONAL_ORDER_VALUE.mul(OPENING_FEE_BPS).div(BPS_DIVISOR);

    // Calculate treasury portion of closing fee
    const treasuryFee = closingFee.mul(TREASURY_CUT_BPS).div(BPS_DIVISOR);
    const blpFee = closingFee.sub(treasuryFee);

    // Expected user payout: net collateral (after opening fee) + profit - closing fee
    const netCollateral = COLLATERAL_AMOUNT.sub(openingFee);
    const expectedUserPayout = netCollateral.add(expectedProfit).sub(closingFee);

    // STEP 6: Verify the user got ~20% profit
    console.log('Profit scenario verification:', {
      expectedProfit: expectedProfit.toString(),
      actualUserPayout: winnerBalanceDiff.toString(),
      expectedUserPayout: expectedUserPayout.toString(),
      profitPercentage: expectedProfit.mul(new BN(10000)).div(NOTIONAL_ORDER_VALUE).toString() + ' bps',
    });

    expect(winnerBalanceDiff.toString()).to.equal(expectedUserPayout.toString());
    expect(expectedProfit.gt(new BN(0))).to.be.true; // Should be profitable

    // STEP 7: Verify the treasury got fees
    expect(treasuryBalanceDiff.toString()).to.equal(treasuryFee.toString());
    expect(treasuryBalanceDiff.gt(new BN(0))).to.be.true;

    // STEP 8: Verify the pool lost money due to paying out the winning position
    // Pool pays out profit but receives BLP fee
    const expectedVaultDecrease = expectedProfit.sub(blpFee);
    expect(vaultDiff.toString()).to.equal(expectedVaultDecrease.toString());
    expect(vaultDiff.gt(new BN(0))).to.be.true; // Pool should have net outflow

    console.log('✅ Profit position closed successfully!');
    console.log(`Winner made profit of ${expectedProfit.div(new BN(1_000_000)).toString()} USDC`);
  });

  it('Successfully closes a position with loss', async () => {  
    const openOrderId = client.newUID();
    const positionId = client.newUID();
    const closeOrderId = client.newUID();

    // Find position PDA
    const positionPDA = await client.getPositionPDA(loserClient.publicKey, positionId);

    const closeOrderPDA = await client.getOrderPDA(closeOrderId, loserClient.publicKey);

    // Calculate position size in contracts
    const PRICE_PRECISION = new BN(1_000_000); // 6 decimals
    const positionSizeContracts = NOTIONAL_ORDER_VALUE.mul(PRICE_PRECISION).div(ENTRY_PRICE);

    // Open a position for the loser
    await matcherClient.createAndOpenMarketPosition({
      userClient: loserClient,
      orderId: openOrderId,
      positionId: positionId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: loserTokenAccount,
      entryPrice: ENTRY_PRICE,
    });

    // Create close order
    await loserClient.createMarketCloseOrder({
      orderId: closeOrderId,
      basktId,
      sizeAsContracts: positionSizeContracts,
      targetPosition: positionPDA,
      ownerTokenAccount: loserTokenAccount,
    });

    // Get balances before closing
    const loserTokenBefore = await getAccount(client.connection, loserTokenAccount);
    const treasuryTokenBefore = await getAccount(client.connection, treasuryTokenAccount);
    const vaultBefore = await getAccount(client.connection, usdcVault);

    // Close the position with loss
    await matcherClient.closePosition({
      orderPDA: closeOrderPDA,
      position: positionPDA,
      exitPrice: EXIT_PRICE_LOSS,
      baskt: basktId,
      ownerTokenAccount: loserTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
      orderOwner: loserClient.publicKey,
    });

    // STEP 1: Verify position is closed
    try {
      await client.program.account.position.fetch(positionPDA);
      expect.fail('Position account should be closed');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // STEP 2: Verify order is closed
    try {
      await client.program.account.order.fetch(closeOrderPDA);
      expect.fail('Order account should be closed');
    } catch (error) {
      expect((error as Error).message).to.include('Account does not exist');
    }

    // STEP 3: Verify escrow account is closed
    const positionEscrow = client.getPositionEscrowPDA(positionPDA);
    try {
      await getAccount(client.connection, positionEscrow);
      expect.fail('Position escrow account should be closed');
    } catch (error) {
      expect((error as Error).toString()).to.include('TokenAccountNotFoundError');
    }

    // STEP 4: Get balances after closing and calculate differences
    const loserTokenAfter = await getAccount(client.connection, loserTokenAccount);
    const treasuryTokenAfter = await getAccount(client.connection, treasuryTokenAccount);
    const vaultAfter = await getAccount(client.connection, usdcVault);

    const loserBalanceDiff = new BN(loserTokenAfter.amount.toString()).sub(
      new BN(loserTokenBefore.amount.toString()),
    );
    const treasuryBalanceDiff = new BN(treasuryTokenAfter.amount.toString()).sub(
      new BN(treasuryTokenBefore.amount.toString()),
    );
    const vaultDiff = new BN(vaultAfter.amount.toString()).sub(
      new BN(vaultBefore.amount.toString()),
    );

    // STEP 5: Calculate expected values
    const BPS_DIVISOR = new BN(10000);
    const CLOSING_FEE_BPS = new BN(10); // 0.1%
    const OPENING_FEE_BPS = new BN(10); // 0.1%
    const TREASURY_CUT_BPS = new BN(1000); // 10%

    // Calculate 20% loss: (exit_price - entry_price) * position_size_contracts / PRICE_PRECISION
    const priceDelta = EXIT_PRICE_LOSS.sub(ENTRY_PRICE); // -20_000_000 (20 USDC price difference, negative)
    const expectedLoss = priceDelta.mul(positionSizeContracts).div(PRICE_PRECISION); // This will be negative

    // Calculate closing fee based on exit notional value
    const exitNotional = positionSizeContracts.mul(EXIT_PRICE_LOSS).div(PRICE_PRECISION);
    const closingFee = exitNotional.mul(CLOSING_FEE_BPS).div(BPS_DIVISOR);

    // Calculate opening fee (already deducted from position collateral)
    const openingFee = NOTIONAL_ORDER_VALUE.mul(OPENING_FEE_BPS).div(BPS_DIVISOR);

    // Calculate treasury portion of closing fee
    const treasuryFee = closingFee.mul(TREASURY_CUT_BPS).div(BPS_DIVISOR);
    const blpFee = closingFee.sub(treasuryFee);

    // Expected user payout: net collateral (after opening fee) + loss - closing fee
    // Since expectedLoss is negative, this effectively subtracts the loss
    const netCollateral = COLLATERAL_AMOUNT.sub(openingFee);
    const expectedUserPayout = netCollateral.add(expectedLoss).sub(closingFee);

    // STEP 6: Verify the user got ~20% loss
    console.log('Loss scenario verification:', {
      expectedLoss: expectedLoss.toString(),
      actualUserPayout: loserBalanceDiff.toString(),
      expectedUserPayout: expectedUserPayout.toString(),
      lossPercentage: expectedLoss.abs().mul(new BN(10000)).div(NOTIONAL_ORDER_VALUE).toString() + ' bps',
    });

    expect(loserBalanceDiff.toString()).to.equal(expectedUserPayout.toString());
    expect(expectedLoss.lt(new BN(0))).to.be.true; // Should be a loss (negative)
    expect(loserBalanceDiff.lt(COLLATERAL_AMOUNT)).to.be.true; // User should get back less than collateral

    // STEP 7: Verify the treasury got fees
    expect(treasuryBalanceDiff.toString()).to.equal(treasuryFee.toString());
    expect(treasuryBalanceDiff.gt(new BN(0))).to.be.true;

    // STEP 8: Verify the pool gained money due to the losing position
    // Pool receives the loss (user's loss is pool's gain) plus BLP fee
    const expectedVaultIncrease = expectedLoss.abs().add(blpFee); // Loss is negative, so abs() makes it positive
    expect(vaultDiff.toString()).to.equal(expectedVaultIncrease.toString());
    expect(vaultDiff.gt(new BN(0))).to.be.true; // Pool should have net inflow

    console.log('✅ Loss position closed successfully!');
    console.log(`Loser lost ${expectedLoss.abs().div(new BN(1_000_000)).toString()} USDC`);
  });
});