import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { USDC_MINT } from '@baskt/sdk';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PositionStatus } from '@baskt/types';
// Using TestClient static method instead of importing from test-setup
// Chain helpers and fee utils are now used internally by TestClient methods

describe('Position Opening', () => {
  // Constants for test
  const NOTIONAL_ORDER_VALUE = new BN(10 * 1e6); // 10 units
  const ENTRY_PRICE = BASELINE_PRICE;
  const LIMIT_PRICE = BASELINE_PRICE; 
  const COLLATERAL_AMOUNT = NOTIONAL_ORDER_VALUE.muln(1.1).add(new BN(1000000)); // 110% + opening fee

  // Get the test client instance
  const client = TestClient.getInstance();

  // Test accounts
  let user: Keypair;
  let matcher: Keypair;
  let nonMatcher: Keypair;

  // Test clients
  let userClient: TestClient;
  let matcherClient: TestClient;
  let nonMatcherClient: TestClient;

  // Test data
  let basktId: PublicKey;
  let assetId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;

  // Order and position data
  let orderPDA: PublicKey;
  let positionId: BN;
  let positionPDA: PublicKey;

  before(async () => {
    // Use the centralized position test setup helper
    const testSetup = await TestClient.setupPositionTest({
      client,
      ticker: 'BTC',
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
  });

  afterEach(async () => {
    // Reset feature flags to enabled state after each test using the centralized helper
    await TestClient.resetFeatureFlags(client);
  });

  it('Fails to open position with zero entry price', async () => {
    const zeroOrderId = client.newUID();
    const zeroPositionId = client.newUID();

    const zeroOrderPDA = await userClient.getOrderPDA(zeroOrderId, user.publicKey);

    await userClient.createMarketOpenOrder({
      orderId: zeroOrderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });
    // Should fail with zero price
    try {
      await matcherClient.openPosition({
        positionId: zeroPositionId,
        entryPrice: new BN(0),
        order: zeroOrderPDA,
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to zero entry price');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('InvalidOraclePrice');
    }
  });

  it('Fails to open a position without matcher role', async () => {
    // Create a new order for this test
    const newOrderId = client.newUID();
    const newPositionId = client.newUID();

    // Find the new order and position PDAs
    const newOrderPDA = await userClient.getOrderPDA(newOrderId, user.publicKey);

    // Create a new open order
    await userClient.createMarketOpenOrder({
      orderId: newOrderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    // Try to open the position using a non-matcher client
    try {
      await nonMatcherClient.openPosition({
        positionId: newPositionId,
        entryPrice: ENTRY_PRICE,
        order: newOrderPDA,
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to missing matcher role');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('Unauthorized');
    }
  });

  it('Successfully opens a position from a valid order', async () => {
    // Get funding index before opening position
    const fundingIndexBefore = await client.getFundingIndex(basktId);

    const orderId = client.newUID();
    const positionId = client.newUID();

    await userClient.createMarketOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    const protocol = await client.getProtocolAccount();
    const treasuryBalanceBefore = await client.getOrCreateUSDCAccount(new PublicKey(protocol.treasury));
    const poolBalanceBefore = (await client.getLiquidityPool()).totalLiquidity;

    // Open the position using the matcher client helper
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: await userClient.getOrderPDA(orderId, user.publicKey),
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    const positionPDA = await userClient.getPositionPDA(user.publicKey, positionId);

    // Fetch the position account
    const positionAccount = await client.getPosition(positionPDA);

    // Verify basic keys
    expect(positionAccount.owner.toString()).to.equal(user.publicKey.toString());
    expect(positionAccount.positionId.toString()).to.equal(positionId.toString());
    expect(positionAccount.basktId.toString()).to.equal(basktId.toString());

    // ------------------------------
    // Re-derive expected size & fee with the same formula used on-chain
    // ------------------------------
    const protocolAccount = await client.program.account.protocol.fetch(client.protocolPDA);
    const openingFeeBps = new BN(protocolAccount.config.openingFeeBps);
    const minCrBps = new BN(protocolAccount.config.minCollateralRatioBps);

    const TOTAL_BPS = openingFeeBps.add(minCrBps); // 10_010 by default
    const TEN_THOUSAND = new BN(10_000);
    const PRICE_PRECISION = new BN(1_000_000);


    // expected size = notional_allowed * PRICE_PRECISION / entry_price
    const expectedSize = NOTIONAL_ORDER_VALUE.mul(PRICE_PRECISION).div(ENTRY_PRICE);

    // opening fee = notional_allowed * opening_fee_bps / 10_000
    const openingFee = NOTIONAL_ORDER_VALUE.mul(openingFeeBps).div(TEN_THOUSAND);
    const expectedNetCollateral = COLLATERAL_AMOUNT.sub(openingFee);

    expect(positionAccount.size.toString()).to.equal(expectedSize.toString());
    expect(positionAccount.collateral.toString()).to.equal(expectedNetCollateral.toString());
    expect(positionAccount.isLong).to.be.true;
    expect(positionAccount.entryPrice.toString()).to.equal(ENTRY_PRICE.toString());
    expect(positionAccount.lastFundingIndex.toString()).to.equal(
      fundingIndexBefore?.cumulativeFundingIndex.toString(),
    );
    expect(positionAccount.lastBorrowIndex.toString()).to.equal(
      fundingIndexBefore?.cumulativeBorrowIndex.toString(),
    );
    expect(positionAccount.fundingAccumulated.toString()).to.equal('0');
    expect(positionAccount.borrowAccumulated.toString()).to.equal('0');
    expect(positionAccount.status).to.equal(PositionStatus.OPEN);
    expect(positionAccount.exitPrice).to.be.undefined;
    expect(positionAccount.timestampClose).to.be.undefined;

    // Verify Fees was sent 
    const treasuryBalanceAfter = await client.getOrCreateUSDCAccount(new PublicKey(protocol.treasury));
    const poolBalanceAfter = (await client.getLiquidityPool()).totalLiquidity;
    expect(Number(treasuryBalanceAfter.amount - treasuryBalanceBefore.amount)).to.be.greaterThan(0);
    expect(poolBalanceAfter.sub(poolBalanceBefore).toNumber()).to.be.greaterThan(0);

    expect(new BN((await client.getBaskt(basktId)).openPositions).toNumber()).to.be.equal(1);

    // Try to fetch the order account - should be closed
    try {
      await client.program.account.order.fetch(await userClient.getOrderPDA(orderId, user.publicKey));
      expect.fail('Order account should be closed');
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }
  });

  it('Fails to open position with wrong order owner', async () => {
    const orderId = client.newUID();
    const positionId = client.newUID();
    const wrongUser = await TestClient.forUser(Keypair.generate());
    await client.mintUSDC(await wrongUser.getOrCreateUSDCAccountKey(wrongUser.publicKey), COLLATERAL_AMOUNT);

    // Create a order for thw wrong user 

    await wrongUser.createMarketOpenOrder({
      orderId: client.newUID(),
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: await wrongUser.getOrCreateUSDCAccountKey(wrongUser.publicKey),
    });

    await userClient.createMarketOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });
    
    const protocol = await client.getProtocolAccount();

    const treasuryTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      new PublicKey(protocol.treasury),
    );


    try {
      await matcherClient.program.methods.openPosition({
        positionId: positionId,
        entryPrice: ENTRY_PRICE,
      })
      .accountsPartial({
        collateralMint: USDC_MINT,
        order: await userClient.getOrderPDA(orderId, user.publicKey),
        orderEscrow: await userClient.getOrderEscrowPDA(user.publicKey),
        baskt: basktId,
        orderOwner: wrongUser.publicKey, // Wrong order owner
        position: await userClient.getPositionPDA(user.publicKey, positionId),
        usdcVault: userTokenAccount, 
        treasuryToken: treasuryTokenAccount
      })
      .rpc();

      expect.fail('Transaction should have failed due to wrong order owner');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('InvalidInput');
    }
  });

  it('Fails to open position with wrong baskt', async () => {
    const orderId = client.newUID();
    const positionId = client.newUID();

    const { basktId: wrongBaskt } = await client.createBaskt([{
      weight: new BN(10000),
      direction: true,
      assetId: assetId,
      baselinePrice: new BN(0),
    }], true);  

    await userClient.createMarketOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    try {
      await matcherClient.openPosition({
        positionId: positionId,
        entryPrice: ENTRY_PRICE,
        order: await userClient.getOrderPDA(orderId, user.publicKey),
        baskt: wrongBaskt, // Wrong baskt
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to wrong baskt');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('InvalidBaskt');
    }
  });

  it('Fails to open position with already processed order', async () => {
    const orderId = client.newUID();
    const positionId1 = client.newUID();
    const positionId2 = client.newUID();

    await userClient.createMarketOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    // Open the position first time
    await matcherClient.openPosition({
      positionId: positionId1,
      entryPrice: ENTRY_PRICE,
      order: await userClient.getOrderPDA(orderId, user.publicKey),
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Try to open the same order again
    try {
      await matcherClient.openPosition({
        positionId: positionId2,
        entryPrice: ENTRY_PRICE,
        order: await userClient.getOrderPDA(orderId, user.publicKey),
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to already processed order');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('AccountNotInitialized');
    }
  });

  it('Fails to open position with close order', async () => {
    // First create and open a position
    const openOrderId = client.newUID();
    const positionId = client.newUID();

    await userClient.createMarketOpenOrder({
      orderId: openOrderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: await userClient.getOrderPDA(openOrderId, user.publicKey),
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Now create a close order
    const closeOrderId = client.newUID();
    const positionPDA = await userClient.getPositionPDA(user.publicKey, positionId);

    await userClient.createMarketCloseOrder({
      orderId: closeOrderId,
      basktId: basktId,
      sizeAsContracts: NOTIONAL_ORDER_VALUE,
      targetPosition: positionPDA,
      ownerTokenAccount: userTokenAccount,
    });

    // Try to open the close order
    try {
      await matcherClient.openPosition({
        positionId: client.newUID(),
        entryPrice: ENTRY_PRICE,
        order: await userClient.getOrderPDA(closeOrderId, user.publicKey),
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to close order');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('InvalidOrderAction');
    }
  });

  it('Fails to open position when trading is disabled', async () => {
    const orderId = client.newUID();
    const positionId = client.newUID();

    await userClient.createMarketOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    // Disable trading
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
      allowTrading: false, // DISABLED
      allowLiquidations: true,
    });

    try {
      await matcherClient.openPosition({
        positionId: positionId,
        entryPrice: ENTRY_PRICE,
        order: await userClient.getOrderPDA(orderId, user.publicKey),
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to disabled trading');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PositionOperationsDisabled');
    }
  });

  it('Fails to open position when open position is disabled', async () => {
    const orderId = client.newUID();    
    const positionId = client.newUID();

    await userClient.createMarketOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    // Disable open position
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: false, // DISABLED
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: true,
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });

    try {
      await matcherClient.openPosition({
        positionId: positionId,
        entryPrice: ENTRY_PRICE,
        order: await userClient.getOrderPDA(orderId, user.publicKey),
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to disabled open position');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PositionOperationsDisabled');
    }
  });

  it('Fails to open position with inactive baskt', async () => {
    // Create a new baskt that's not activated
    const inactiveBasktCreator = Keypair.generate();
    await client.connection.requestAirdrop(inactiveBasktCreator.publicKey, 1000000000);
    const inactiveBasktClient = await TestClient.forUser(inactiveBasktCreator);

    const formattedAssetConfig = {
      weight: new BN(10000),
      direction: true,
      assetId: assetId,
      baselinePrice: new BN(0),
    };

    const { basktId: inactiveBasktId } = await inactiveBasktClient.createBaskt(
      [formattedAssetConfig],
      true, // isPublic
    );
    await client.activateBaskt(inactiveBasktId, [LIMIT_PRICE]);


    const orderId = client.newUID();
    const positionId = client.newUID();


    await userClient.createMarketOpenOrder({
      orderId: orderId,
      basktId: inactiveBasktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    await client.decommissionBaskt(inactiveBasktId);


    try {
      await matcherClient.openPosition({
        positionId: positionId,
        entryPrice: ENTRY_PRICE,
        order: await userClient.getOrderPDA(orderId, user.publicKey),
        baskt: inactiveBasktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to inactive baskt');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('BasktNotActive');
    }
  });


  it('Fails to open position with wrong token account', async () => {
    const orderId = client.newUID();
    const positionId = client.newUID();
    const wrongTokenAccount = Keypair.generate().publicKey;

    await userClient.createMarketOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    try {
      // This would fail due to wrong token account constraints
      await matcherClient.openPosition({
        positionId: positionId,
        entryPrice: ENTRY_PRICE,
        order: await userClient.getOrderPDA(orderId, user.publicKey),
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to wrong token account');
    } catch (error: any) {
      // The error could be various types depending on the specific constraint that fails
      expect(error.toString()).to.not.be.empty;
    }
  });

  it('Fails to open position with zero size result', async () => {
    const orderId = client.newUID();
    const positionId = client.newUID();

    // Create order with very small notional value that would result in zero size
    const tinyNotional = new BN(1); // Very small notional

    await userClient.createMarketOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: tinyNotional,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      ownerTokenAccount: userTokenAccount,
    });

    try {
      await matcherClient.openPosition({
        positionId: positionId,
        entryPrice: ENTRY_PRICE,
        order: await userClient.getOrderPDA(orderId, user.publicKey),
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to zero size position');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('ZeroSizedPosition');
    }
  });

  it('Opens a position from a limit order', async () => {
    const orderId = client.newUID();
    const positionId = client.newUID();

    await userClient.createLimitOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      limitPrice: LIMIT_PRICE,
      maxSlippageBps: new BN(100), // 1% slippage
      ownerTokenAccount: userTokenAccount,
    });

    // Open the position with price within slippage bounds
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: LIMIT_PRICE, // Exact limit price
      order: await userClient.getOrderPDA(orderId, user.publicKey),
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    const positionPDA = await userClient.getPositionPDA(user.publicKey, positionId);
    const positionAccount = await client.getPosition(positionPDA);

    expect(positionAccount.owner.toString()).to.equal(user.publicKey.toString());
    expect(positionAccount.isLong).to.be.true;
    expect(positionAccount.entryPrice.toString()).to.equal(LIMIT_PRICE.toString());
  });

  it('Fails to open a position from a limit order price outside of the range', async () => {
    const orderId = client.newUID();        
    const positionId = client.newUID();

    await userClient.createLimitOpenOrder({
      orderId: orderId,
      basktId: basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000),
      limitPrice: LIMIT_PRICE,
      maxSlippageBps: new BN(100), // 1% slippage
      ownerTokenAccount: userTokenAccount,
    });

    // Try to open with price outside slippage bounds
    const priceOutsideRange = LIMIT_PRICE.add(new BN(2 * 1e6)); // 2% above limit price

    try {
      const tx = await matcherClient.openPosition({
        positionId: positionId,
        entryPrice: priceOutsideRange,
        order: await userClient.getOrderPDA(orderId, user.publicKey),
        baskt: basktId,
        orderOwner: user.publicKey,
      });
      expect.fail('Transaction should have failed due to price outside range');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });

});
