import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { OrderAction, OrderType } from '@baskt/types';
import { PRICE_PRECISION } from '@baskt/sdk';

describe('Close Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const NOTIONAL_ORDER_VALUE = new BN(10 * 1e6); // 10 USDC
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at 1 with 6 decimals
  // Use larger price deltas to ensure sufficient funds for profit after fees
  const EXIT_PRICE_PROFIT = ENTRY_PRICE.add(new BN(5 * 1e6)); // 105 for profitable close
  const EXIT_PRICE_LOSS = ENTRY_PRICE.sub(new BN(5 * 1e6)); // 95 for loss scenario
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
      COLLATERAL_AMOUNT.muln(5).toNumber(), // 1000x for pool + 20x for multiple tests
    );

    // Set up a liquidity pool for closing positions

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
      amount: NOTIONAL_ORDER_VALUE.muln(10), // deposit 1000x collateral = 15,000 USDC
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

    const snapshot = await client.openAndClosePosition({
      userClient,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_PROFIT,
      leverageBps: new BN(10000),
      sizePercentageToClose: new BN(10000),
    });

    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_PROFIT,
      sizeClosed: POSITION_SIZE_CONTRACTS,
      snapshotBefore: snapshot.snapshotBefore,
      snapshotAfter: snapshot.snapshotAfter,
    });

  });

  it('Successfully closes a position with loss', async () => {
    // Derive the position escrow token account PDA

    const {
      snapshotBefore,
      snapshotAfter,
    } = await client.openAndClosePosition({
      userClient,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_LOSS,
      leverageBps: new BN(10000),
      sizePercentageToClose: new BN(10000),
    });

    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_LOSS,
      sizeClosed: POSITION_SIZE_CONTRACTS,
      snapshotBefore,
      snapshotAfter,
    });
  
  });

  it('Fails to close a position without matcher role', async () => {
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

    // Create a close order
    await userClient.createMarketCloseOrder({
      orderId: newCloseOrderId,
      basktId,
      sizeAsContracts: POSITION_SIZE_CONTRACTS,
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
        orderOwner: user.publicKey, // Must be the actual owner of the order
      });
      expect.fail('Transaction should have failed due to missing matcher role');
    } catch (error: any) {
      // This error should come from the on-chain unauthorized check
      console.debug('Non-matcher close error:', error.toString());
      expect(error?.error?.errorName || error.toString()).to.include('Unauthorized');
    }
  });

  it('Fails to close position when close trading is disabled', async () => {
    // Disable close position feature flag
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: false, // Disable close positions
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: true,
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });

    // Create a new position for this test
    const disabledOrderId = client.newUID();
    const disabledPositionId = client.newUID();
    const disabledCloseOrderId = client.newUID();

    const disabledPositionPDA = await client.getPositionPDA(user.publicKey, disabledPositionId);

    const disabledCloseOrderPDA = await client.getOrderPDA(disabledCloseOrderId, user.publicKey);

    // Re-enable close positions to create the position first
    await TestClient.resetFeatureFlags(client);

    // Create and open position
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId: disabledOrderId,
      positionId: disabledPositionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000),
    });

    // Create close order
    await userClient.createMarketCloseOrder({
      orderId: disabledCloseOrderId,
      basktId,
      sizeAsContracts: POSITION_SIZE_CONTRACTS,
      targetPosition: disabledPositionPDA,
      ownerTokenAccount: userTokenAccount,
    });

    // Now disable close positions
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: false, // Disable close positions
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: true,
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });

    // Try to close position with feature disabled
    try {
    await matcherClient.closePosition({
        orderPDA: disabledCloseOrderPDA,
        position: disabledPositionPDA,
        exitPrice: EXIT_PRICE_PROFIT,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
        orderOwner: user.publicKey, // Must be the actual owner of the order
      });
      expect.fail('Should have failed when close position feature is disabled');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PositionOperationsDisabled');
    }
  });

  it('Fails to close position with zero exit price', async () => {  
    const zeroOrderId = client.newUID();
    const zeroPositionId = client.newUID();
    const zeroCloseOrderId = client.newUID();

    const zeroPositionPDA = await client.getPositionPDA(user.publicKey, zeroPositionId);

    const zeroCloseOrderPDA = await client.getOrderPDA(zeroCloseOrderId, user.publicKey);

    // Create and open position
    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId: zeroOrderId,
      positionId: zeroPositionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000),
    });

    // Create close order
    await userClient.createMarketCloseOrder({
      orderId: zeroCloseOrderId,
      basktId,
      sizeAsContracts: POSITION_SIZE_CONTRACTS,
      targetPosition: zeroPositionPDA,
      ownerTokenAccount: userTokenAccount,
    });

    // Should fail with zero exit price
    try {
      await matcherClient.closePosition({
        orderPDA: zeroCloseOrderPDA,
        position: zeroPositionPDA,
        exitPrice: new BN(0),
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
        orderOwner: user.publicKey, // Must be the actual owner of the order
      });

      expect.fail('Transaction should have failed due to zero exit price');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('InvalidOraclePrice');
    }
  });

  it('Successfully performs partial position close', async () => {

    const exitPrice = ENTRY_PRICE.muln(150).divn(100);

    // Create a new position for partial close testing
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
      sizePercentageToClose: new BN(5000),
      isLong: true,
    });

    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: exitPrice,
      sizeClosed: sizeClosed,
      snapshotBefore,
      snapshotAfter,
    });

    const posidtionPDA = await client.getPositionPDA(user.publicKey, positionId);
    let position = await client.getPosition(posidtionPDA);
    const secondSnapshotBefore = await client.snapshotPositionBalances(posidtionPDA, user.publicKey);
    const secondSizeToClose = position.size.div(new BN(2));


    await matcherClient.createAndCloseMarketPosition({
      userClient,
      basktId: basktId,
      position: posidtionPDA,   
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
      snapshotAfter: await client.snapshotPositionBalances(posidtionPDA, user.publicKey),
    });

    position = await client.getPosition(posidtionPDA);
    const thirdSnapshotBefore = await client.snapshotPositionBalances(posidtionPDA, user.publicKey);


    await matcherClient.createAndCloseMarketPosition({
      userClient,
      basktId: basktId,
      position: posidtionPDA,   
      orderId: client.newUID(),
      positionId: positionId,
      exitPrice: ENTRY_PRICE.muln(50).divn(100),
      sizeAsContracts: position.size,
      ownerTokenAccount: userTokenAccount,
    });

    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: ENTRY_PRICE.muln(50).divn(100),
      sizeClosed: position.size,
      snapshotBefore: thirdSnapshotBefore,
      snapshotAfter: await client.snapshotPositionBalances(posidtionPDA, user.publicKey),
    });



  });


});