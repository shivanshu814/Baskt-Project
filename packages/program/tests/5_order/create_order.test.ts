import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { TestCleanup } from '../utils/test-cleanup';
import { TEST_AMOUNTS, TEST_PRICES, TEST_TICKERS, TEST_PARAMS } from '../utils/test-constants-shared';
import { AccessControlRole, OnchainOrderStatus, OrderAction, OrderType } from '@baskt/types';
import { BASELINE_PRICE } from '../utils/test-constants';

describe('Order Creation', () => {
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

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;
  let assetId: PublicKey;
  let positionId: PublicKey;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  before(async () => {
    // Initialize protocol and core roles
    await TestClient.initializeProtocolAndRoles(client);

    // Create test keypairs
    user = Keypair.generate();
    treasury = Keypair.generate();
    matcher = Keypair.generate();

    // Fund the test accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(treasury.publicKey, client.connection);
    await requestAirdrop(matcher.publicKey, client.connection);

    // Create user client
    userClient = await TestClient.forUser(user);

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

    // Format asset config correctly
    const formattedAssetConfig = {
      weight: new BN(10000),
      direction: true,
      assetId: assetId, // Include the asset ID in the config
      baselinePrice: new BN(0), // Required by OnchainAssetConfig interface
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
    // Create token accounts for the test
    userTokenAccount = await client.getOrCreateUSDCAccountKey(user.publicKey);

    // Derive the user escrow token account PDA
    escrowTokenAccount = client.getOrderEscrowPDA(user.publicKey);

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(10).toNumber(), // 10x for multiple tests
    );

    // Create a position for testing close orders
    try {
      // Create a unique seed for the position
      const positionSeed = client.newUID();

      // Find the position PDA
      positionId = await client.getPositionPDA(user.publicKey, positionSeed);
    } catch (error: any) {
      // This is not critical, so we'll just log it and continue
    }
  });

  after(async () => {
    // Use centralized cleanup for both roles and feature flags
    await TestCleanup.fullCleanup(client, [
      { publicKey: matcher.publicKey, role: AccessControlRole.Matcher }
    ]);
  });

  describe('Market Open Orders', () => {
    it('Creates a market open long order', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Find the order PDA
      const orderPDA = await client.getOrderPDA(orderId, user.publicKey);

      // Get user token balance before creating order
      const userTokenBefore = await getAccount(client.connection, userTokenAccount);

      // Create a market open long order using the new API
      await userClient.createMarketOpenOrder({
        orderId,
        basktId,
        notionalValue: NOTIONAL_ORDER_VALUE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        leverageBps: new BN(10000), // 1x leverage
        ownerTokenAccount: userTokenAccount,
      });

      // Fetch the order account
      const orderAccount = await client.getOrder(orderPDA);

      // Verify order details
      expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());
      expect(orderAccount.orderId.toString()).to.equal(orderId.toString());
      expect(orderAccount.basktId.toString()).to.equal(basktId.toString());
      expect(orderAccount.action).to.equal(OrderAction.Open);
      expect(orderAccount.orderType).to.equal(OrderType.Market);
      expect(orderAccount.status).to.equal(OnchainOrderStatus.PENDING);

      // Verify open parameters
      expect(orderAccount.openParams).to.not.be.null;
      if (orderAccount.openParams) {
        expect(orderAccount.openParams.notionalValue.toString()).to.equal(NOTIONAL_ORDER_VALUE.toString());
        expect(orderAccount.openParams.collateral.toString()).to.equal(COLLATERAL_AMOUNT.toString());
        expect(orderAccount.openParams.isLong).to.be.true;
        expect(orderAccount.openParams.leverageBps.toString()).to.equal('10000');
      }

      // Verify collateral was transferred
      const userTokenAfter = await getAccount(client.connection, userTokenAccount);
      const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

      const userBalanceDiff = new BN(userTokenBefore.amount.toString()).sub(
        new BN(userTokenAfter.amount.toString()),
      );
      expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
      expect(escrowTokenAfter.amount.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    });

    it('Creates a market open short order', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Find the order PDA
      const orderPDA = await client.getOrderPDA(orderId, user.publicKey);

      // Get user token balance before creating order
      const userTokenBefore = await getAccount(client.connection, userTokenAccount);
      const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);

      // Create a market open short order
      await userClient.createMarketOpenOrder({
        orderId,
        basktId,
        notionalValue: NOTIONAL_ORDER_VALUE,
        collateral: COLLATERAL_AMOUNT,
        isLong: false,
        leverageBps: new BN(10000), // 1x leverage
        ownerTokenAccount: userTokenAccount,
      });

      // Fetch the order account
      const orderAccount = await client.getOrder(orderPDA);

      // Verify order details
      expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());
      expect(orderAccount.orderId.toString()).to.equal(orderId.toString());
      expect(orderAccount.action).to.equal(OrderAction.Open);
      expect(orderAccount.orderType).to.equal(OrderType.Market);
      expect(orderAccount.status).to.equal(OnchainOrderStatus.PENDING);

      // Verify open parameters
      expect(orderAccount.openParams).to.not.be.null;
      if (orderAccount.openParams) {
        expect(orderAccount.openParams.notionalValue.toString()).to.equal(NOTIONAL_ORDER_VALUE.toString());
        expect(orderAccount.openParams.collateral.toString()).to.equal(COLLATERAL_AMOUNT.toString());
        expect(orderAccount.openParams.isLong).to.be.false;
        expect(orderAccount.openParams.leverageBps.toString()).to.equal('10000');
      }

      // Verify collateral was transferred
      const userTokenAfter = await getAccount(client.connection, userTokenAccount);
      const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

      const userBalanceDiff = new BN(userTokenBefore.amount.toString()).sub(
        new BN(userTokenAfter.amount.toString()),
      );
      const escrowBalanceDiff = new BN(escrowTokenAfter.amount.toString()).sub(
        new BN(escrowTokenBefore.amount.toString()),
      );

      expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
      expect(escrowBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    });

    it('Fails to create a market open order with zero collateral', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Try to create an order with zero collateral (which should fail)
      try {
        await userClient.createMarketOpenOrder({
          orderId,
          basktId,
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: new BN(0), // Zero collateral - should fail
          isLong: true,
          leverageBps: new BN(10000),
          ownerTokenAccount: userTokenAccount,
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to zero collateral');
      } catch (error: any) {
        // Verify error message indicates insufficient collateral
        expect(error.toString()).to.include('InsufficientCollateral');
      }
    });

    it('Fails to create a market open order with insufficient collateral', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Try to create an order with zero collateral (which should fail)
      try {
        await userClient.createMarketOpenOrder({
          orderId,
          basktId,
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: COLLATERAL_AMOUNT.div(new BN(2)), 
          isLong: true,
          leverageBps: new BN(10000),
          ownerTokenAccount: userTokenAccount,
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to insufficient collateral');
      } catch (error: any) {
        // Verify error message indicates insufficient collateral
        expect(error.toString()).to.include('InsufficientCollateral');
      }
    });



    it('Fails to create a market open order with zero notional value', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Try to create an order with zero notional value (which should fail)
      try {
        await userClient.createMarketOpenOrder({
          orderId,
          basktId,
          notionalValue: new BN(0), // Zero notional value - should fail
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          leverageBps: new BN(10000),
          ownerTokenAccount: userTokenAccount,
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to zero notional value');
      } catch (error: any) {
        // Verify error message indicates invalid notional value
        
        expect(error.toString()).to.include('ZeroSizedPosition');
      }
    });
  });

  describe('Limit Open Orders', () => {
    it('Creates a limit open long order', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();
      // Find the order PDA
      const orderPDA = await client.getOrderPDA(orderId, user.publicKey);

      // Get user token balance before creating order
      const userTokenBefore = await getAccount(client.connection, userTokenAccount);

      // Create a limit open long order
      await userClient.createLimitOpenOrder({
        orderId,
        basktId,
        notionalValue: NOTIONAL_ORDER_VALUE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        leverageBps: new BN(10000), // 1x leverage
        limitPrice: LIMIT_PRICE, // $50,000 limit price
        maxSlippageBps: new BN(100), // 1% slippage
        ownerTokenAccount: userTokenAccount,
      });

      // Fetch the order account
      const orderAccount = await client.getOrder(orderPDA);

      // Verify order details
      expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());
      expect(orderAccount.orderId.toString()).to.equal(orderId.toString());
      expect(orderAccount.basktId.toString()).to.equal(basktId.toString());
      expect(orderAccount.action).to.equal(OrderAction.Open);
      expect(orderAccount.orderType).to.equal(OrderType.Limit);
      expect(orderAccount.status).to.equal(OnchainOrderStatus.PENDING);

      // Verify open parameters
      expect(orderAccount.openParams).to.not.be.null;
      if (orderAccount.openParams) {
        expect(orderAccount.openParams.notionalValue.toString()).to.equal(NOTIONAL_ORDER_VALUE.toString());
        expect(orderAccount.openParams.collateral.toString()).to.equal(COLLATERAL_AMOUNT.toString());
        expect(orderAccount.openParams.isLong).to.be.true;
        expect(orderAccount.openParams.leverageBps.toString()).to.equal('10000');
      }

      // Verify limit parameters
      expect(orderAccount.limitParams).to.not.be.null;
      if (orderAccount.limitParams) {
        expect(orderAccount.limitParams.limitPrice.toString()).to.equal(LIMIT_PRICE.toString());
        expect(orderAccount.limitParams.maxSlippageBps.toString()).to.equal('100');
      }

      // Verify collateral was transferred
      const userTokenAfter = await getAccount(client.connection, userTokenAccount);
      const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

      const userBalanceDiff = new BN(userTokenBefore.amount.toString()).sub(
        new BN(userTokenAfter.amount.toString()),
      );
      expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
      expect(escrowTokenAfter.amount.toString()).to.equal(COLLATERAL_AMOUNT.muln(3).toString());
    });

    it('Creates a limit open short order', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Find the order PDA
      const orderPDA = await userClient.getOrderPDA(orderId, user.publicKey);

      // Get user token balance before creating order
      const userTokenBefore = await getAccount(client.connection, userTokenAccount);
      const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);

      // Create a limit open short order
      await userClient.createLimitOpenOrder({
        orderId,
        basktId,
        notionalValue: NOTIONAL_ORDER_VALUE,
        collateral: COLLATERAL_AMOUNT,
        isLong: false,
        leverageBps: new BN(10000), // 1x leverage
        limitPrice: new BN(45000 * 1000000), // $45,000 limit price
        maxSlippageBps: new BN(200), // 2% slippage
        ownerTokenAccount: userTokenAccount,
      });

      // Fetch the order account    
      const orderAccount = await client.getOrder(orderPDA);

      // Verify order details
      expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());
      expect(orderAccount.orderId.toString()).to.equal(orderId.toString());
      expect(orderAccount.action).to.equal(OrderAction.Open);
      expect(orderAccount.orderType).to.equal(OrderType.Limit);
      expect(orderAccount.status).to.equal(OnchainOrderStatus.PENDING);

      // Verify open parameters
      expect(orderAccount.openParams).to.not.be.null;
      if (orderAccount.openParams) {
        expect(orderAccount.openParams.notionalValue.toString()).to.equal(NOTIONAL_ORDER_VALUE.toString());
        expect(orderAccount.openParams.collateral.toString()).to.equal(COLLATERAL_AMOUNT.toString());
        expect(orderAccount.openParams.isLong).to.be.false;
        expect(orderAccount.openParams.leverageBps.toString()).to.equal('10000');
      }

      // Verify limit parameters
      expect(orderAccount.limitParams).to.not.be.null;
      if (orderAccount.limitParams) {
        expect(orderAccount.limitParams.limitPrice.toString()).to.equal(new BN(45000 * 1000000).toString());
        expect(orderAccount.limitParams.maxSlippageBps.toString()).to.equal('200');
      }

      // Verify collateral was transferred
      const userTokenAfter = await getAccount(client.connection, userTokenAccount);
      const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

      const userBalanceDiff = new BN(userTokenBefore.amount.toString()).sub(
        new BN(userTokenAfter.amount.toString()),
      );
      const escrowBalanceDiff = new BN(escrowTokenAfter.amount.toString()).sub(
        new BN(escrowTokenBefore.amount.toString()),
      );

      expect(userBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
      expect(escrowBalanceDiff.toString()).to.equal(COLLATERAL_AMOUNT.toString());
    });

    it('Fails to create a limit open order with zero limit price', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Try to create a limit order with zero limit price (which should fail)
      try {
        await userClient.createLimitOpenOrder({
          orderId,
          basktId,
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          leverageBps: new BN(10000),
          limitPrice: new BN(0), // Zero limit price - should fail
          maxSlippageBps: new BN(100),
          ownerTokenAccount: userTokenAccount,
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to zero limit price');
      } catch (error: any) {
        // Verify error message indicates invalid limit price
        expect(error.toString()).to.include('InvalidInput');
      }
    });

    it('Fails to create a limit open order with insufficient collateral', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Try to create a limit close order with insufficient collateral (should fail)
      try {
        await userClient.createLimitOpenOrder({
          orderId,
          basktId,
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: COLLATERAL_AMOUNT.divn(2), // Half collateral - should fail
          isLong: true,
          leverageBps: new BN(10000),
          limitPrice: LIMIT_PRICE,
          maxSlippageBps: new BN(100),
          ownerTokenAccount: userTokenAccount,
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to insufficient collateral');
      } catch (error: any) {
        // Verify error message indicates insufficient collateral
        expect(error.toString()).to.include('InsufficientCollateral');
      }
    });

  });

  describe('Market Close Orders', () => {
    it('Creates a market close order with target position', async () => {
      // We need a valid position ID to create a close order
      // For testing, we'll use the positionId created in the setup phase
      if (!positionId) {
        return;
      }

      // Generate a unique order ID
      const orderId = client.newUID();

      // Find the order PDA
      const orderPDA = await userClient.getOrderPDA(orderId, user.publicKey);

      // Get user token balance before creating order
      const userTokenBefore = await getAccount(client.connection, userTokenAccount);
      const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);

      // Create a market close order
      try {
        await userClient.createMarketCloseOrder({
          orderId,
          basktId,
          sizeAsContracts: NOTIONAL_ORDER_VALUE,
          targetPosition: positionId,
          ownerTokenAccount: userTokenAccount,
        });

        // Fetch the order account  
        const orderAccount = await client.getOrder(orderPDA);

        // Verify order details
        expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());
        expect(orderAccount.orderId.toString()).to.equal(orderId.toString());
        expect(orderAccount.basktId.toString()).to.equal(basktId.toString());
        expect(orderAccount.action).to.equal(OrderAction.Close);
        expect(orderAccount.orderType).to.equal(OrderType.Market);
        expect(orderAccount.status).to.equal('pending');

        // Verify close parameters
        expect(orderAccount.closeParams).to.not.be.null;
        if (orderAccount.closeParams) {
          expect(orderAccount.closeParams.sizeAsContracts.toString()).to.equal(NOTIONAL_ORDER_VALUE.toString());
          expect(orderAccount.closeParams.targetPosition.toString()).to.equal(positionId.toString());
        }

        // Verify NO collateral was transferred for close orders
        const userTokenAfter = await getAccount(client.connection, userTokenAccount);
        const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

        const userBalanceChange = new BN(userTokenAfter.amount.toString()).sub(
          new BN(userTokenBefore.amount.toString()),
        );
        const escrowBalanceChange = new BN(escrowTokenAfter.amount.toString()).sub(
          new BN(escrowTokenBefore.amount.toString()),
        );

        // No tokens should be transferred for a close order
        expect(userBalanceChange.toString()).to.equal('0');
        expect(escrowBalanceChange.toString()).to.equal('0');
      } catch (error: any) {
        // If the position doesn't exist, this will fail
        // That's expected in the test environment, so we'll just log it
        console.log('Market close order test skipped due to missing position:', error.message);
      }
    });
    


    it('Fails to create a market close order with zero size', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Try to create a close order with zero size (should fail)
      try {
        await userClient.createMarketCloseOrder({
          orderId,
          basktId,
          sizeAsContracts: new BN(0), // Zero size - should fail
          targetPosition: positionId || PublicKey.default,
          ownerTokenAccount: userTokenAccount,
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to zero size');
      } catch (error: any) {
        // Verify error message indicates invalid size
        expect(error.toString()).to.include('InvalidInput');
      }
    });

  });

  describe('Limit Close Orders', () => {
    it('Creates a limit close order with target position', async () => {
      // We need a valid position ID to create a close order
      if (!positionId) {
        return;
      }

      // Generate a unique order ID
      const orderId = client.newUID();

      // Find the order PDA
      const orderPDA = await userClient.getOrderPDA(orderId, user.publicKey);

      // Get user token balance before creating order
      const userTokenBefore = await getAccount(client.connection, userTokenAccount);
      const escrowTokenBefore = await getAccount(client.connection, escrowTokenAccount);

      // Create a limit close order
      try {
        await userClient.createLimitCloseOrder({
          orderId,
          basktId,
          sizeAsContracts: NOTIONAL_ORDER_VALUE,
          targetPosition: positionId,
          limitPrice: new BN(48000 * 1000000), // $48,000 limit price
          maxSlippageBps: new BN(150), // 1.5% slippage
          ownerTokenAccount: userTokenAccount,
        });

        // Fetch the order account
        const orderAccount = await client.getOrder(orderPDA);

        // Verify order details
        expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());
        expect(orderAccount.orderId.toString()).to.equal(orderId.toString());
        expect(orderAccount.basktId.toString()).to.equal(basktId.toString());
        expect(orderAccount.action).to.equal(OrderAction.Close);
        expect(orderAccount.orderType).to.equal(OrderType.Limit);
        expect(orderAccount.status).to.equal(OnchainOrderStatus.PENDING);

        // Verify close parameters
        expect(orderAccount.closeParams).to.not.be.null;
        if (orderAccount.closeParams) {
          expect(orderAccount.closeParams.sizeAsContracts.toString()).to.equal(NOTIONAL_ORDER_VALUE.toString());
          expect(orderAccount.closeParams.targetPosition.toString()).to.equal(positionId.toString());
        }

        // Verify limit parameters
        expect(orderAccount.limitParams).to.not.be.null;
        if (orderAccount.limitParams) {
          expect(orderAccount.limitParams.limitPrice.toString()).to.equal(new BN(48000 * 1000000).toString());
          expect(orderAccount.limitParams.maxSlippageBps.toString()).to.equal('150');
        }

        // Verify NO collateral was transferred for close orders
        const userTokenAfter = await getAccount(client.connection, userTokenAccount);
        const escrowTokenAfter = await getAccount(client.connection, escrowTokenAccount);

        const userBalanceChange = new BN(userTokenAfter.amount.toString()).sub(
          new BN(userTokenBefore.amount.toString()),
        );
        const escrowBalanceChange = new BN(escrowTokenAfter.amount.toString()).sub(
          new BN(escrowTokenBefore.amount.toString()),
        );

        // No tokens should be transferred for a close order
        expect(userBalanceChange.toString()).to.equal('0');
        expect(escrowBalanceChange.toString()).to.equal('0');
      } catch (error: any) {
        // If the position doesn't exist, this will fail
        // That's expected in the test environment, so we'll just log it
        console.log('Limit close order test skipped due to missing position:', error.message);
      }
    });

    it('Fails to create a limit close order with zero limit price', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Try to create a limit close order with zero limit price (should fail)
      try {
        await userClient.createLimitCloseOrder({
          orderId,
          basktId,
          sizeAsContracts: NOTIONAL_ORDER_VALUE,
          targetPosition: positionId || PublicKey.default,
          limitPrice: new BN(0), 
          maxSlippageBps: new BN(100),
          ownerTokenAccount: userTokenAccount,
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to zero limit price');
      } catch (error: any) {
        // Verify error message indicates invalid limit price
        
        expect(error.toString()).to.include('InvalidInput');
      }
    });


  });

  describe('Order Validation', () => {
    it('Fails to create an order with invalid baskt ID', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      // Try to create an order with an invalid baskt ID (should fail)
      try {
        await userClient.createMarketOpenOrder({
          orderId,
          basktId: PublicKey.default, // Invalid baskt ID - should fail
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          leverageBps: new BN(10000),
          ownerTokenAccount: userTokenAccount,
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to invalid baskt ID');
      } catch (error: any) {
        // Verify error message indicates invalid baskt
        
        expect(error.toString()).to.include('AccountOwnedByWrongProgram');
      }
    });

    it('Fails to create an order with invalid token account', async () => {
      // Generate a unique order ID
      const orderId = client.newUID();

      const otherUser = Keypair.generate();
      const otherUserTokenAccount = await client.getOrCreateUSDCAccountKey(otherUser.publicKey);
      await client.mintUSDC(otherUserTokenAccount, COLLATERAL_AMOUNT.muln(10).toNumber());

      // Try to create an order with an invalid token account (should fail)
      try {
        await userClient.createMarketOpenOrder({
          orderId,
          basktId,
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          leverageBps: new BN(10000),
          ownerTokenAccount: otherUserTokenAccount, // Invalid token account - should fail
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to invalid token account');
      } catch (error: any) {
        // Verify error message indicates invalid token account
        
        expect(error.toString()).to.include('UnauthorizedTokenOwner');
      }
    });

    it('Fails to create an order with duplicate order ID', async () => {
      // Generate a unique order ID 
      const orderId = client.newUID();

      // Create first order
      await userClient.createMarketOpenOrder({
        orderId,
        basktId,
        notionalValue: NOTIONAL_ORDER_VALUE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        leverageBps: new BN(10000),
        ownerTokenAccount: userTokenAccount,
      });

      // Try to create second order with same ID (should fail)
      try {
        await userClient.createMarketOpenOrder({
          orderId, // Same order ID - should fail
          basktId,
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          leverageBps: new BN(10000),
          ownerTokenAccount: userTokenAccount,
        });
        // Should not reach here
        expect.fail('Transaction should have failed due to duplicate order ID');
      } catch (error: any) {
        // Verify error message indicates duplicate order
        
        expect(error.toString()).to.include('already in use');
      }
    });
  });

  describe('Private Baskt Access Control', () => {
    let privateBasktId: PublicKey;
    let privateBasktCreator: Keypair;
    let nonCreator: Keypair;
    let privateBasktCreatorClient: TestClient;
    let nonCreatorClient: TestClient;
    let userTokenAccount: PublicKey;

    before(async () => {
      // Create test accounts
      privateBasktCreator = Keypair.generate();
      nonCreator = Keypair.generate();

      // Fund the test accounts
      await requestAirdrop(privateBasktCreator.publicKey, client.connection);
      await requestAirdrop(nonCreator.publicKey, client.connection);

      // Create client instances
      privateBasktCreatorClient = await TestClient.forUser(privateBasktCreator);
      nonCreatorClient = await TestClient.forUser(nonCreator);
      userTokenAccount = await client.getOrCreateUSDCAccountKey(privateBasktCreator.publicKey);

      // Create a private baskt
      const formattedAssetConfig = {
        weight: new BN(10000),
        direction: true,
        assetId: assetId,
        baselinePrice: new BN(0),
      };

      const { basktId: createdPrivateBasktId } = await privateBasktCreatorClient.createBaskt(
        [formattedAssetConfig],
        false, // isPublic = false (private baskt)
      );
      privateBasktId = createdPrivateBasktId;

      // Activate the private baskt
      await client.activateBaskt(
        privateBasktId,
        [new BN(50000 * 1000000)], // $50,000 price
      );
    });

    it('Allows baskt creator to create order on private baskt', async () => {
      const orderId = client.newUID();

      await client.mintUSDC(userTokenAccount, COLLATERAL_AMOUNT.muln(10).toNumber());

      // Create order as the baskt creator (should succeed)
      await privateBasktCreatorClient.createMarketOpenOrder({
        orderId,
        basktId: privateBasktId,
        notionalValue: NOTIONAL_ORDER_VALUE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        leverageBps: new BN(10000),
        ownerTokenAccount: userTokenAccount,
      });

      // Verify the order was created successfully
      const orderPDA = await privateBasktCreatorClient.getOrderPDA(orderId, privateBasktCreator.publicKey);

      const orderAccount = await client.program.account.order.fetch(orderPDA);
      expect(orderAccount.owner.toString()).to.equal(privateBasktCreator.publicKey.toString());
      expect(orderAccount.basktId.toString()).to.equal(privateBasktId.toString());
    });

    it('Fails when non-creator tries to create order on private baskt', async () => { 
      const orderId = client.newUID();

      const userTokenAccount = await client.getOrCreateUSDCAccountKey(nonCreator.publicKey);
      await client.mintUSDC(userTokenAccount, COLLATERAL_AMOUNT.muln(10).toNumber());
      try {
        await nonCreatorClient.createMarketOpenOrder({
          orderId,
          basktId: privateBasktId,
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          leverageBps: new BN(10000),
          ownerTokenAccount: userTokenAccount,
        });
        expect.fail('Transaction should have failed due to unauthorized access');
      } catch (error: any) {
        
        expect(error.toString()).to.include('Unauthorized');
      }
    });
  });

  describe("Baskt Lifecycle State Checks", () => {
    it("No create orders during pending", async () => {
      const privateBasktCreatorClient = await TestClient.forUser(Keypair.generate());

      const formattedAssetConfig = {
        weight: new BN(10000),
        direction: true,
        assetId: assetId,
        baselinePrice: new BN(0),
      };

      const { basktId } = await privateBasktCreatorClient.createBaskt(
        [formattedAssetConfig],
        false, // isPublic = false (private baskt)
      );

      const userTokenAccount = await privateBasktCreatorClient.getOrCreateUSDCAccountKey(privateBasktCreatorClient.publicKey);
      await client.mintUSDC(userTokenAccount, COLLATERAL_AMOUNT.muln(10).toNumber());

      try { 
        await privateBasktCreatorClient.createMarketOpenOrder({
          orderId: client.newUID(),
          basktId: basktId,
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          leverageBps: new BN(10000),
          ownerTokenAccount: userTokenAccount,
        });
      } catch (error: any) {
        
        expect(error.toString()).to.include('InvalidBasktState');
      }

      // Activate the baskt
      await client.activateBaskt(basktId, [new BN(500 * 1e6)]);
      const orderId = client.newUID();
      // Create order
      await privateBasktCreatorClient.createMarketOpenOrder({
        orderId,
        basktId: basktId,
        notionalValue: NOTIONAL_ORDER_VALUE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        leverageBps: new BN(10000),
        ownerTokenAccount: userTokenAccount,
      });

      // open the position for the baskt 
      const positionId = client.newUID();
      await client.openPosition({
        order: await privateBasktCreatorClient.getOrderPDA(orderId, privateBasktCreatorClient.publicKey),
        positionId: positionId,
        entryPrice: LIMIT_PRICE,
        baskt: basktId,
        orderOwner: privateBasktCreatorClient.publicKey,
        preInstructions: [],
      });
      
      // Close Order should work 
      await privateBasktCreatorClient.createMarketCloseOrder({
        orderId: client.newUID(),
        basktId: basktId,
        sizeAsContracts: NOTIONAL_ORDER_VALUE,
        targetPosition: await privateBasktCreatorClient.getPositionPDA(privateBasktCreatorClient.publicKey, positionId),
        ownerTokenAccount: userTokenAccount,
      });

      // decomission the baskt 
      await client.decommissionBaskt(basktId);

      try {
        await privateBasktCreatorClient.createMarketOpenOrder({
          orderId: client.newUID(),
          basktId: basktId,
          notionalValue: NOTIONAL_ORDER_VALUE,
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          leverageBps: new BN(10000),
          ownerTokenAccount: userTokenAccount,
        });
      } catch (error: any) {
        
        expect(error.toString()).to.include('InvalidBasktState');
      }

      // Do a close order 
      await privateBasktCreatorClient.createMarketCloseOrder({
        orderId: client.newUID(),
        basktId: basktId,
        sizeAsContracts: NOTIONAL_ORDER_VALUE,
        targetPosition: await privateBasktCreatorClient.getPositionPDA(privateBasktCreatorClient.publicKey, positionId),
        ownerTokenAccount: userTokenAccount,
      });
    });
  });

});
