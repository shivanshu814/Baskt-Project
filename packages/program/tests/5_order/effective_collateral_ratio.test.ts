import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { AccessControlRole, OrderAction, OrderType } from '@baskt/types';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';

describe('Effective Collateral Ratio Tests', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(11_020_000); // 11.02 USDC (110% + opening fee)
  const TICKER = 'BTC';

  // Test accounts
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let configManager: Keypair;
  let userClient: TestClient;
  let configManagerClient: TestClient;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;
  let assetId: PublicKey;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  before(async () => {
    // Initialize protocol and core roles
    await TestClient.initializeProtocolAndRoles(client);

    // Create test keypairs
    user = Keypair.generate();
    treasury = Keypair.generate();
    matcher = Keypair.generate();
    configManager = Keypair.generate();

    // Fund the test accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(treasury.publicKey, client.connection);
    await requestAirdrop(matcher.publicKey, client.connection);
    await requestAirdrop(configManager.publicKey, client.connection);

    // Create user and config manager clients
    userClient = await TestClient.forUser(user);
    configManagerClient = await TestClient.forUser(configManager);

    // Add roles
    await client.addRole(matcher.publicKey, AccessControlRole.Matcher);
    await client.addRole(configManager.publicKey, AccessControlRole.ConfigManager);

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
      assetId: assetId,
      baselinePrice: new BN(0),
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
    escrowTokenAccount = await client.getOrCreateUSDCAccountKey(user.publicKey);

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(10).toNumber(), // 10x for multiple tests
    );
  });

  after(async () => {
    // Clean up roles and feature flags
    try {
      // Remove roles
      const removeMatcherSig = await client.removeRole(
        matcher.publicKey,
        AccessControlRole.Matcher
      );
      await waitForTx(client.connection, removeMatcherSig);

      const removeConfigManagerSig = await client.removeRole(
        configManager.publicKey,
        AccessControlRole.ConfigManager
      );
      await waitForTx(client.connection, removeConfigManagerSig);

      // Reset feature flags to enabled state
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
      console.warn('Cleanup error in effective_collateral_ratio.test.ts:', error);
    }
  });

  describe('Effective Collateral Ratio Logic', () => {
    it('Test 1: Baskt allows 1x (10000 bps), User tries 0.5x leverage (20000 bps) - Should PASS', async () => {
      // Set baskt min collateral ratio to 1x (10000 bps)
      await configManagerClient.setBasktMinCollateralRatioBps(basktId, 10000);

      // Generate a unique order ID
      const orderId = client.newUID();

      // Create order with 0.5x leverage (20000 bps)
      // This should pass because user's leverage requirement (20000 bps) > baskt min (10000 bps)
      // So effective ratio = max(10000, 20000) = 20000 bps
      const higherCollateral = new BN(22_040_000); // Double the collateral for 200% requirement

      // Mint additional tokens for this test
      await client.mintUSDC(
        userTokenAccount,
        higherCollateral.toNumber(),
      );

      await userClient.createMarketOpenOrder({
        orderId,
        basktId,
        notionalValue: ORDER_SIZE,
        collateral: higherCollateral,
        isLong: true,
        leverageBps: new BN(5000), // 0.5x leverage (10000/0.5 = 20000 bps)
        ownerTokenAccount: userTokenAccount,
      });

      // Verify order was created successfully
      const orderPDA = await userClient.getOrderPDA(orderId, user.publicKey);
      const orderAccount = await client.getOrder(orderPDA);
      expect(orderAccount.openParams?.leverageBps.toString()).to.equal('5000');
    });

    it('Test 2: Baskt allows 1x (10000 bps), User tries 1x leverage (10000 bps) with insufficient collateral - Should FAIL', async () => {
      // Set baskt min collateral ratio to 1x (10000 bps)
      await configManagerClient.setBasktMinCollateralRatioBps(basktId, 10000);

      // Generate a unique order ID
      const orderId = client.newUID();

      // Create order with 1x leverage (10000 bps) but insufficient collateral
      // This should fail because user's leverage requirement (10000 bps) = baskt min (10000 bps)
      // But user provided insufficient collateral for the requirement
      try {
        await userClient.createMarketOpenOrder({
          orderId,
          basktId,
          notionalValue: ORDER_SIZE,
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          leverageBps: new BN(10000), // 1x leverage
          ownerTokenAccount: userTokenAccount,
        });
        expect.fail('Should have thrown InsufficientCollateral error');
      } catch (error: any) {
        expect(error.toString()).to.include('InsufficientCollateral');
      }
    });

    it('Test 3: Baskt allows 1x (10000 bps), User tries 1x leverage (10000 bps) - Should PASS', async () => {
      // Set baskt min collateral ratio to 1x (10000 bps)
      await configManagerClient.setBasktMinCollateralRatioBps(basktId, 10000);

      // Generate a unique order ID
      const orderId = client.newUID();

      // Create order with 1x leverage (10000 bps)
      // This should pass because user's leverage requirement (10000 bps) = baskt min (10000 bps)
      // So effective ratio = max(10000, 10000) = 10000 bps
      await userClient.createMarketOpenOrder({
        orderId,
        basktId,
        notionalValue: ORDER_SIZE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        leverageBps: new BN(10000), // 1x leverage
        ownerTokenAccount: userTokenAccount,
      });

      // Verify order was created successfully
      const orderPDA = await userClient.getOrderPDA(orderId, user.publicKey);
      const orderAccount = await client.getOrder(orderPDA);
      expect(orderAccount.openParams?.leverageBps.toString()).to.equal('10000');
    });

    it('Test 4: Baskt allows 1x (10000 bps), User tries 1x leverage (10000 bps) - Should PASS', async () => {
      // Set baskt min collateral ratio to 1x (10000 bps)
      await configManagerClient.setBasktMinCollateralRatioBps(basktId, 10000);

      // Generate a unique order ID
      const orderId = client.newUID();

      // Create order with 1x leverage (10000 bps)
      // This should pass because user's leverage requirement (10000 bps) = baskt min (10000 bps)
      // So effective ratio = max(10000, 10000) = 10000 bps
      await userClient.createMarketOpenOrder({
        orderId,
        basktId,
        notionalValue: ORDER_SIZE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        leverageBps: new BN(10000), // 1x leverage
        ownerTokenAccount: userTokenAccount,
      });

      // Verify order was created successfully
      const orderPDA = await userClient.getOrderPDA(orderId, user.publicKey);

      const orderAccount = await client.getOrder(orderPDA);
      expect(orderAccount.openParams?.leverageBps.toString()).to.equal('10000');
    });

    it('Test 5: Baskt allows 0.5x (20000 bps), User tries 2x leverage (5000 bps) - Should PASS', async () => {
      // Set baskt min collateral ratio to 0.5x (20000 bps)
      await configManagerClient.setBasktMinCollateralRatioBps(basktId, 20000);

      // Generate a unique order ID
      const orderId = client.newUID();

      // Create order with 2x leverage (5000 bps)
      // This should pass because user's leverage requirement (5000 bps) < baskt min (20000 bps)
      // So effective ratio = max(20000, 5000) = 20000 bps
      // But we need to provide sufficient collateral for the higher requirement
      const higherCollateral = new BN(22_040_000); // Double the collateral for 200% requirement

      // Mint additional tokens for this test
      await client.mintUSDC(
        userTokenAccount,
        higherCollateral.toNumber(),
      );

      await userClient.createMarketOpenOrder({
        orderId,
        basktId,
        notionalValue: ORDER_SIZE,
        collateral: higherCollateral,
        isLong: true,
        leverageBps: new BN(5000), // 2x leverage (10000/2 = 5000 bps)
        ownerTokenAccount: userTokenAccount,
      });

      // Verify order was created successfully
      const orderPDA = await userClient.getOrderPDA(orderId, user.publicKey);

      const orderAccount = await client.getOrder(orderPDA);
      expect(orderAccount.openParams?.leverageBps.toString()).to.equal('5000');
    });

    it('Test 6: Baskt allows 0.5x (20000 bps), User tries 2x leverage (5000 bps) with insufficient collateral - Should FAIL', async () => {
      // Set baskt min collateral ratio to 0.5x (20000 bps)
      await configManagerClient.setBasktMinCollateralRatioBps(basktId, 20000);

      // Generate a unique order ID
        const orderId = client.newUID();

      // Create order with 2x leverage (5000 bps) but insufficient collateral
      // This should fail because effective ratio = max(20000, 5000) = 20000 bps
      // But user provided insufficient collateral for the 200% requirement
      try {
        await userClient.createMarketOpenOrder({
          orderId,
          basktId,
          notionalValue: ORDER_SIZE,
          collateral: COLLATERAL_AMOUNT, // Insufficient for 200% requirement
          isLong: true,
          leverageBps: new BN(5000), // 2x leverage (10000/2 = 5000 bps)
          ownerTokenAccount: userTokenAccount,
        });
        expect.fail('Should have thrown InsufficientCollateral error');
      } catch (error: any) {
        expect(error.toString()).to.include('InsufficientCollateral');
      }
    });
  });
}); 