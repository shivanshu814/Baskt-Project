import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { TestCleanup } from '../utils/test-cleanup';
import { TEST_AMOUNTS, TEST_PRICES, TEST_TICKERS, TEST_PARAMS } from '../utils/test-constants-shared';
import { AccessControlRole, OrderAction, OrderType } from '@baskt/types';
import { BASELINE_PRICE } from '../utils/test-constants';

describe('Order Cancellation', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const NOTIONAL_ORDER_VALUE = new BN(10 * 1e6); // 10 units
  const LIMIT_PRICE = BASELINE_PRICE; // $50,000 price with 6 decimals
  const COLLATERAL_AMOUNT = NOTIONAL_ORDER_VALUE.muln(1.1).add(new BN(1000000)); // 110% + opening fee
  const TICKER = 'BTC';

  // Test accounts
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let otherUser: Keypair;
  let otherUserClient: TestClient;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;
  let assetId: PublicKey;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  // Order state for tests
  let longOrderId: number;
  let longOrderPDA: PublicKey;
  let shortOrderId: number;
  let shortOrderPDA: PublicKey;

  before(async () => {
    // Initialize protocol and core roles
    await TestClient.initializeProtocolAndRoles(client);

    // Create test keypairs
    user = Keypair.generate();
    treasury = Keypair.generate();
    matcher = Keypair.generate();
    otherUser = Keypair.generate();

    // Fund the test accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(treasury.publicKey, client.connection);
    await requestAirdrop(matcher.publicKey, client.connection);
    await requestAirdrop(otherUser.publicKey, client.connection);
    await requestAirdrop(
      new PublicKey('6UvSQ8aRj4z1iD6eQPV6NJMdPXbMUjUzgDFKB9ExekvK'),
      client.connection,
    );
    // Create user clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    otherUserClient = await TestClient.forUser(otherUser);

    await client.addRole(user.publicKey, AccessControlRole.Matcher);

    await client.setupLiquidityPoolWithLiquidity({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      initialDeposit: new BN(10 * 1e6),
      provider: user,
    });

    // Add roles
    await client.addRole(matcher.publicKey, AccessControlRole.Matcher);

    // Enable features for testing
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

    // Create a synthetic asset
    const assetResult = await client.addAsset(TICKER, {
      allowLongs: true,
      allowShorts: true,
    });
    assetId = assetResult.assetAddress;

    // Create a baskt with the asset - use a unique name with timestamp
    // Format asset config correctly with assetId
    const formattedAssetConfig = {
      weight: new BN(10000), // 100% weight (10000 bps)
      direction: true, // Long direction
      assetId: assetId, // Include the asset ID in the config
      baselinePrice: new BN(0), // Required by OnchainAssetConfig
    };

    const { basktId: createdBasktId } = await client.createBaskt(
      [formattedAssetConfig], 
      true, // isPublic
    );
    basktId = createdBasktId;

    // Activate the baskt with initial prices
    await client.activateBaskt(
      basktId,
      [new BN(50000 * 1000000)], // $50,000 price with 6 decimals
    );

    // Use the USDC mock token for collateral
    collateralMint = USDC_MINT;

    // Create token accounts for the test using userClient so the user pays for the ATA
    userTokenAccount = await userClient.getOrCreateUSDCAccountKey(user.publicKey);

    // Derive the user escrow token account PDA
    escrowTokenAccount = client.getOrderEscrowPDA(user.publicKey);

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(10).toNumber(), // 10x for multiple tests
    );

    // Create orders that we'll cancel in our tests

    // Create a long order
    longOrderId = client.newUID();
    longOrderPDA = await userClient.getOrderPDA(longOrderId, user.publicKey);

    await userClient.createMarketOpenOrder({
      orderId: longOrderId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000), // 1x leverage
      ownerTokenAccount: userTokenAccount,
    });

    // Create a short order
    shortOrderId = client.newUID();
    shortOrderPDA = await userClient.getOrderPDA(shortOrderId, user.publicKey);

    await userClient.createMarketOpenOrder({
      orderId: shortOrderId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: false,
      leverageBps: new BN(10000), // 1x leverage
      ownerTokenAccount: userTokenAccount,
    });

    // Create the additional order
    const additionalOrderId = client.newUID();
    await userClient.createMarketOpenOrder({
      orderId: additionalOrderId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000), // 1x leverage
      ownerTokenAccount: userTokenAccount,
    });
  });

  after(async () => {
    // Use centralized cleanup for both roles and feature flags
    await TestCleanup.fullCleanup(client, [
      { publicKey: matcher.publicKey, role: AccessControlRole.Matcher }
    ]);
  });

  it('Cancels a long order and returns collateral', async () => {
    // Create a new order PDA for additional testing
    const additionalOrderId = client.newUID();

    // Create the additional order
    await userClient.createMarketOpenOrder({
      orderId: additionalOrderId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000), // 1x leverage
      ownerTokenAccount: userTokenAccount,
    });

    // Get balances before cancellation
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);

    // Cancel the long order
    await userClient.cancelOrder({
      orderPDA: longOrderPDA,
      ownerTokenAccount: userTokenAccount,
    });

    // Try to fetch the order account after cancellation
    try {
      // The order should be closed, so this should fail
      await client.program.account.order.fetch(longOrderPDA);
      expect.fail('Order account should be closed');
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }

    // Verify collateral was returned to the user
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

    const userBalanceDiff = new BN(userTokenAfter.amount.toString()).sub(
      new BN(userTokenBefore.amount.toString()),
    );
    const escrowBalanceDiff = new BN(escrowTokenBefore.amount.toString()).sub(
      new BN(escrowTokenAfter.amount.toString()),
    );

    expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    expect(escrowBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
  });

  it('Cancels a short order and returns collateral', async () => {
    // Get balances before cancellation
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);

    // Cancel the short order
    await userClient.cancelOrder({
      orderPDA: shortOrderPDA,
      ownerTokenAccount: userTokenAccount,
    });

    // Try to fetch the order account after cancellation
    try {
      // The order should be closed, so this should fail
      await client.program.account.order.fetch(shortOrderPDA);
      expect.fail('Order account should be closed');
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }

    // Verify collateral was returned to the user
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

    const userBalanceDiff = new BN(userTokenAfter.amount.toString()).sub(
      new BN(userTokenBefore.amount.toString()),
    );
    const escrowBalanceDiff = new BN(escrowTokenBefore.amount.toString()).sub(
      new BN(escrowTokenAfter.amount.toString()),
    );

    expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    expect(escrowBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
  });

  it('Fails to cancel an order by a non-owner', async () => {
    // Create a new order for testing
    const testOrderId = client.newUID();
    const testOrderPDA = await userClient.getOrderPDA(testOrderId, user.publicKey);

    // Create the test order
    await userClient.createMarketOpenOrder({
      orderId: testOrderId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000), // 1x leverage
      ownerTokenAccount: userTokenAccount,
    });

    // Try to cancel the order as a different user (which should fail)
    try {
      await otherUserClient.cancelOrder({
        orderPDA: testOrderPDA,
        ownerTokenAccount: userTokenAccount,
      });

      expect.fail('Should have thrown an error');
    } catch (error) {
      // This is expected - should fail with escrow account error for non-owner
      expect((error as Error).message).to.include('AccountNotInitialized');
    }

    // Verify order is still in pending status
    const orderAccount = await client.program.account.order.fetch(testOrderPDA);
    expect(Object.keys(orderAccount.status)[0]).to.equal('pending');

    // Clean up by cancelling with the correct owner
    await userClient.cancelOrder({
      orderPDA: testOrderPDA,
      ownerTokenAccount: userTokenAccount,
    });
  });

  it('Fails to cancel an already cancelled order', async () => {
    // Create a new order for testing
    const orderIdToCancel = client.newUID();
    const orderPDAToCancel = await userClient.getOrderPDA(orderIdToCancel, user.publicKey);

    // Create the order
    await userClient.createMarketOpenOrder({
      orderId: orderIdToCancel,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000), // 1x leverage
      ownerTokenAccount: userTokenAccount,
    });

    // Cancel the order first time
    await userClient.cancelOrder({
      orderPDA: orderPDAToCancel,
      ownerTokenAccount: userTokenAccount,
    });

    // Try to cancel the order a second time (should fail)
    try {
      await userClient.cancelOrder({
        orderPDA: orderPDAToCancel,
        ownerTokenAccount: userTokenAccount,
      });

      expect.fail('Should have thrown an error');
    } catch (error) {
      // This is expected - account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }
  });

  it('Cancels a close order (no collateral to return)', async () => {
    // First, create a position to close
    const positionOrderId = client.newUID();
    const positionId = client.newUID();
    const positionOrderPDA = await userClient.getOrderPDA(positionOrderId, user.publicKey);
    const positionPDA = await userClient.getPositionPDA(user.publicKey, positionId);

    const entryPrice = new BN(100 * 1e6);

    // Create and open a position first
    await userClient.createMarketOpenOrder({
      orderId: positionOrderId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000), // 1x leverage
      ownerTokenAccount: userTokenAccount,
    });

    // Open the position
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice,
      order: positionOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Now create a close order
    const closeOrderId = client.newUID();
    const closeOrderPDA = await userClient.getOrderPDA(closeOrderId, user.publicKey);

    // Get balances before creating close order
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);
    const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);

    // Create the close order
    await userClient.createMarketCloseOrder({
      orderId: closeOrderId,
      basktId,
      sizeAsContracts: NOTIONAL_ORDER_VALUE,
      targetPosition: positionPDA, // Target the position we just created
      ownerTokenAccount: userTokenAccount,
    });

    // Verify no collateral was transferred for close order creation
    const userTokenAfterCreation = await getAccount(client.connection, userTokenAccount);
    const escrowTokenAfterCreation = await getAccount(client.connection, escrowTokenAccount);

    const userBalanceChange = new BN(userTokenAfterCreation.amount.toString()).sub(
      new BN(userTokenBefore.amount.toString()),
    );
    const escrowBalanceChange = new BN(escrowTokenAfterCreation.amount.toString()).sub(
      new BN(escrowTokenBefore.amount.toString()),
    );

    // No tokens should be transferred for a close order creation
    expect(userBalanceChange.toString()).to.equal('0');
    expect(escrowBalanceChange.toString()).to.equal('0');

    // Cancel the close order
    await userClient.cancelOrder({
      orderPDA: closeOrderPDA,
      ownerTokenAccount: userTokenAccount,
    });

    // Try to fetch the order account after cancellation
    try {
      await client.program.account.order.fetch(closeOrderPDA);
      expect.fail('Order account should be closed');
    } catch (error) {
      expect((error as Error).message).to.include('Account does not exist');
    }

    // Verify no collateral transfer occurred during cancellation
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

    const userBalanceDiff = new BN(userTokenAfter.amount.toString()).sub(
      new BN(userTokenAfterCreation.amount.toString()),
    );
    const escrowBalanceDiff = new BN(escrowTokenAfter.amount.toString()).sub(
      new BN(escrowTokenAfterCreation.amount.toString()),
    );

    // No tokens should be transferred for close order cancellation
    expect(userBalanceDiff.toString()).to.equal('0');
    expect(escrowBalanceDiff.toString()).to.equal('0');
  });

  it('Fails to cancel order when trading is disabled', async () => {
    // Create an order first
    const orderId = client.newUID();
    const orderPDA = await userClient.getOrderPDA(orderId, user.publicKey);

    await userClient.createMarketOpenOrder({
      orderId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000), // 1x leverage
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

    // Try to cancel order (should fail)
    try {
      await userClient.cancelOrder({
        orderPDA,
        ownerTokenAccount: userTokenAccount,
      });
      expect.fail('Should have failed due to disabled trading');
    } catch (error) {
      expect((error as Error).message).to.include('TradingDisabled');
    }

    // Re-enable trading for cleanup
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
      allowTrading: true, // RE-ENABLED
      allowLiquidations: true,
    });

    // Clean up by cancelling with trading re-enabled
    await userClient.cancelOrder({
      orderPDA,
      ownerTokenAccount: userTokenAccount,
    });
  });

  it('Fails to cancel order with wrong token account', async () => {
    // Create order with user's token account
    const orderId = client.newUID();
    const orderPDA = await userClient.getOrderPDA(orderId, user.publicKey);

    await userClient.createMarketOpenOrder({
      orderId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      leverageBps: new BN(10000), // 1x leverage
      ownerTokenAccount: userTokenAccount,
    });

    // Try to cancel with different user's token account
    const otherUserTokenAccount = await otherUserClient.getOrCreateUSDCAccountKey(otherUser.publicKey);
    await client.mintUSDC(otherUserTokenAccount, COLLATERAL_AMOUNT.muln(10).toNumber());
    
    try {
      // Kept getting a blockhash mismatch error here
      const tx = await userClient.program.methods.cancelOrder().accountsPartial({
        owner: user.publicKey,
        order: orderPDA,
        ownerCollateralAccount: otherUserTokenAccount,
      }).rpc();
      expect.fail('Should have failed with wrong token account');
    } catch (error) {
      console.log(error);
      expect((error as Error).message).to.include('UnauthorizedTokenOwner');
    }

    // Clean up by cancelling with correct token account
    await userClient.cancelOrder({
      orderPDA,
      ownerTokenAccount: userTokenAccount,
    });
  });
});
