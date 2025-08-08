import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { OrderAction, OrderType } from '@baskt/types';
import { PRICE_PRECISION } from '@baskt/sdk';

describe('Partial Close Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const NOTIONAL_ORDER_VALUE = new BN(10 * 1e6); // 10 USDC
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at 1 with 6 decimals
  const EXIT_PRICE_PROFIT = ENTRY_PRICE.add(new BN(5 * 1e6)); // 6 for profitable close
  const EXIT_PRICE_LOSS = ENTRY_PRICE.sub(new BN(5 * 1e6)); // 0.5 for loss scenario
  const TICKER = 'BTC';

  // Calculate proper collateral amount based on worst-case notional
  const COLLATERAL_AMOUNT = new BN(12 * 1e6); // 12 USDC with 6 decimals

  // Calculate position size in contracts (NOTIONAL_ORDER_VALUE * PRICE_PRECISION / ENTRY_PRICE)
  const POSITION_SIZE_CONTRACTS = NOTIONAL_ORDER_VALUE.mul(PRICE_PRECISION).div(ENTRY_PRICE);

  // Test accounts from centralized setup
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let nonMatcher: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let nonMatcherClient: TestClient;

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
    user = testSetup.user;
    matcher = testSetup.matcher;
    nonMatcher = testSetup.nonMatcher;
    userClient = testSetup.userClient;
    matcherClient = testSetup.matcherClient;
    nonMatcherClient = testSetup.nonMatcherClient;
    basktId = testSetup.basktId;
    collateralMint = testSetup.collateralMint;
    userTokenAccount = testSetup.userTokenAccount;
    assetId = testSetup.assetId;
    lpMint = testSetup.lpMint;
    liquidityPool = testSetup.liquidityPool;
    usdcVault = testSetup.usdcVault;

    // Get treasury from protocol
    treasury = client.treasury;
    treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);

    // Mint additional USDC for multiple tests
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(5).toNumber(), // 5x for multiple tests
    );

    // Create a separate provider for liquidity to avoid role conflicts
    const liquidityProviderClient = await TestClient.forUser(Keypair.generate());

    // Create token accounts for liquidity provider
    const liquidityProviderTokenAccount = await client.getOrCreateUSDCAccountKey(
      liquidityProviderClient.publicKey,
    );
    const liquidityProviderLpAccount = await client.createTokenAccount(
      lpMint,
      liquidityProviderClient.publicKey,
    );

    // Mint USDC to liquidity provider
    await client.mintUSDC(liquidityProviderTokenAccount, NOTIONAL_ORDER_VALUE.muln(10));

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: NOTIONAL_ORDER_VALUE.muln(10), // deposit 10x notional = 100 USDC
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

  it('Successfully partially closes a position with profit', async () => {
    const {
      snapshotBefore,
      snapshotAfter,
      sizeClosed,
    } = await matcherClient.openAndClosePosition({
      userClient,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_PROFIT,
      leverageBps: new BN(10000),
      sizePercentageToClose: new BN(4000), // Close 40% of position
    });

    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_PROFIT,
      sizeClosed: sizeClosed,
      snapshotBefore,
      snapshotAfter,
      basktId,
    });
  });

  it('Successfully partially closes a position with loss', async () => {
    const {
      snapshotBefore,
      snapshotAfter,
      sizeClosed,
    } = await matcherClient.openAndClosePosition({
      userClient,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_LOSS,
      leverageBps: new BN(10000),
      sizePercentageToClose: new BN(6000), // Close 60% of position
    });

    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_LOSS,
      sizeClosed: sizeClosed,
      snapshotBefore,
      snapshotAfter,
      basktId,
    });
  });

  it('Successfully performs multiple partial closes', async () => {
    const exitPrice = ENTRY_PRICE.muln(150).divn(100);

    // First partial close (50% of position)
    const {
      snapshotBefore,
      snapshotAfter,
      sizeClosed,
      positionId
    } = await matcherClient.openAndClosePosition({
      userClient,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      entryPrice: ENTRY_PRICE,
      exitPrice: exitPrice,
      leverageBps: new BN(10000),
      sizePercentageToClose: new BN(5000), // Close 50%
      isLong: true,
    });

    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: exitPrice,
      sizeClosed: sizeClosed,
      snapshotBefore,
      snapshotAfter,
      basktId,
    });

    // Second partial close (50% of remaining position = 25% of original)
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);
    let position = await client.getPosition(positionPDA);
    const secondSnapshotBefore = await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId);
    const secondSizeToClose = position.size.div(new BN(2));

    await matcherClient.createAndCloseMarketPosition({
      userClient,
      basktId: basktId,
      position: positionPDA,
      orderId: client.newUID(),
      positionId: positionId,
      exitPrice: ENTRY_PRICE.muln(120).divn(100),
      sizeAsContracts: secondSizeToClose,
      ownerTokenAccount: userTokenAccount,
    });

    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: ENTRY_PRICE.muln(120).divn(100),
      sizeClosed: secondSizeToClose,
      snapshotBefore: secondSnapshotBefore,
      snapshotAfter: await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId),
      basktId,
    });

    // Final close (remaining 25% of original position)
    position = await client.getPosition(positionPDA);
    const thirdSnapshotBefore = await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId);

    await matcherClient.createAndCloseMarketPosition({
      userClient,
      basktId: basktId,
      position: positionPDA,
      orderId: client.newUID(),
      positionId: positionId,
      exitPrice: ENTRY_PRICE.muln(80).divn(100),
      sizeAsContracts: position.size,
      ownerTokenAccount: userTokenAccount,
    });

    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: ENTRY_PRICE.muln(80).divn(100),
      sizeClosed: position.size,
      snapshotBefore: thirdSnapshotBefore,
      snapshotAfter: await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId),
      basktId,
    });
  });

  it('Fails to close position without matcher role', async () => {
    // Create a new position for this test
    const newOrderId = client.newUID();
    const newPositionId = client.newUID();
    const newCloseOrderId = client.newUID();

    const newPositionPDA = await client.getPositionPDA(user.publicKey, newPositionId);

    const newCloseOrderPDA = await client.getOrderPDA(newCloseOrderId, user.publicKey);

    // Create and open position using helper
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId: newOrderId,
      positionId: newPositionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000),
    });

    // Create a partial close order
    await userClient.createMarketCloseOrder({
      orderId: newCloseOrderId,
      basktId,
      sizeAsContracts: POSITION_SIZE_CONTRACTS.div(new BN(2)), // Close 50%
      targetPosition: newPositionPDA,
      ownerTokenAccount: userTokenAccount,
    });

    // Try to close the position with a non-matcher (should fail)
    try {
      await nonMatcherClient.closePosition({
        orderPDA: newCloseOrderPDA,
        position: newPositionPDA,
        exitPrice: EXIT_PRICE_PROFIT,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
        orderOwner: user.publicKey,
        sizeToClose: POSITION_SIZE_CONTRACTS.div(new BN(2)),
      });
      expect.fail('Transaction should have failed due to missing matcher role');
    } catch (error: any) {
      console.debug('Non-matcher close error:', error.toString());
      expect(error?.error?.errorName || error.toString()).to.include('Unauthorized');
    }
  });
});
