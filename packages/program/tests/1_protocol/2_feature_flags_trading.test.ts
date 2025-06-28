import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
// Using TestClient static method instead of importing from test-setup
import { BN } from '@coral-xyz/anchor';
import { AccessControlRole } from '@baskt/types';
import { BASELINE_PRICE } from '../utils/test-constants';

describe('protocol feature flags - trading operations', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  // Test users
  let matcher: Keypair;
  let liquidator: Keypair;
  let user: Keypair;

  let matcherClient: TestClient;
  let liquidatorClient: TestClient;
  let userClient: TestClient;

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(11_150_000); // 11.15 USDC (enough for 100% collateral + fees)
  const TICKER = 'BTC_FF';

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let assetId: PublicKey;

  // Helper method to reset all feature flags to enabled state
  const resetFeatureFlags = async (): Promise<string> => {
    return await client.updateFeatureFlags({
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
  };

  // Ensure proper cleanup and state settling after each test
  afterEach(async () => {
    const resetSig = await resetFeatureFlags();
    await waitForTx(client.connection, resetSig);
    await waitForNextSlot(client.connection);
  });

  before(async () => {
    // Ensure protocol and core roles are initialized so subsequent operations succeed
    await TestClient.initializeProtocolAndRoles(client);

    // Create test keypairs
    user = Keypair.generate();
    matcher = Keypair.generate();
    liquidator = Keypair.generate();

    // Fund the test accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(client.treasury.publicKey, client.connection);
    await requestAirdrop(matcher.publicKey, client.connection);
    await requestAirdrop(liquidator.publicKey, client.connection);

    // Create clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    liquidatorClient = await TestClient.forUser(liquidator);

    // Add roles
    await client.addRole(matcher.publicKey, AccessControlRole.Matcher);
    await client.addRole(liquidator.publicKey, AccessControlRole.Liquidator);

    // Enable all features initially
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

    // Create and activate baskt
    const basktName = `TestBaskt_FF_${Date.now()}`;
    const formattedAssetConfig = {
      weight: new BN(10000),
      direction: true,
      assetId: assetId,
      baselinePrice: new BN(0),
    };

    const { basktId: createdBasktId } = await client.createBaskt(
      basktName,
      [formattedAssetConfig],
      true, // isPublic
    );
    basktId = createdBasktId;

    // Activate the baskt
    await client.activateBaskt(
      basktId,
      [BASELINE_PRICE], // NAV = $1 with 6 decimals (baskt oracle will be set to this)
      60, // maxPriceAgeSec
    );

    // Initialize the funding index
    await client.program.methods
      .initializeFundingIndex()
      .accounts({
        authority: client.getPublicKey(),
        baskt: basktId,
      })
      .rpc();

    // Setup token accounts
    collateralMint = USDC_MINT;
    userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(20).toNumber(), // 20x for multiple tests
    );

    // Setup liquidity pool and add initial liquidity
    const liquidityAmount = new BN(1_000_000_000); // 1000 USDC
    const adminTokenAccount = await client.getOrCreateUSDCAccount(client.publicKey);

    // Mint USDC to admin for liquidity
    await client.mintUSDC(adminTokenAccount, liquidityAmount.toNumber());

    // Setup liquidity pool (required for positions to work)
    await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint,
    });

    // Create treasury token account (required for opening fees)
    await client.getOrCreateUSDCAccount(client.treasury.publicKey);
  });

  describe('create order feature flag', () => {
    it('Should allow creating order when allow_trading is enabled', async () => {
      // Ensure trading is enabled
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

      // Create order should succeed
      const orderId = new BN(Date.now());

      await userClient.createOrder({
        orderId,
        size: ORDER_SIZE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        action: { open: {} },
        targetPosition: null,
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
        limitPrice: BASELINE_PRICE, // Set reasonable limit price matching NAV
        orderType: { limit: {} },
      });

      // Find the order PDA to verify it was created
      const [orderPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
        client.program.programId,
      );

      // Verify order exists
      const orderAccount = await client.program.account.order.fetch(orderPDA);
      expect(orderAccount.owner.toString()).to.equal(user.publicKey.toString());

      // Cancel the order to clean up
      await userClient.cancelOrder({
        orderPDA,
        ownerTokenAccount: userTokenAccount,
      });
    });

    it('Should fail to create order when allow_trading is disabled', async () => {
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
      // Small delay to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create order should fail
      const orderId = new BN(Date.now() + 1);

      try {
        await userClient.createOrder({
          orderId,
          size: ORDER_SIZE,
          collateral: COLLATERAL_AMOUNT,
          isLong: true,
          action: { open: {} },
          targetPosition: null,
          basktId: basktId,
          ownerTokenAccount: userTokenAccount,
          collateralMint: collateralMint,
          limitPrice: BASELINE_PRICE, // Set reasonable limit price matching NAV
          orderType: { limit: {} },
        });
        expect.fail('Should have failed due to disabled feature flag');
      } catch (error: any) {
        expect(error.toString()).to.include('TradingDisabled');
      }
    });

    it('Should fail to cancel order when allow_trading is disabled', async () => {
      // First enable trading to create an order
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
        allowTrading: true, // ENABLED
        allowLiquidations: true,
      });

      // Create an order
      const orderId = new BN(Date.now() + 2);

      await userClient.createOrder({
        orderId,
        size: ORDER_SIZE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        action: { open: {} },
        targetPosition: null,
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
        limitPrice: BASELINE_PRICE, // Set reasonable limit price matching NAV
        orderType: { limit: {} },
      });

      // Find the order PDA
      const [orderPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
        client.program.programId,
      );

      // Now disable trading
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

      // Cancel order should fail
      try {
        await userClient.cancelOrder({
          orderPDA,
          ownerTokenAccount: userTokenAccount,
        });
        expect.fail('Should have failed due to disabled feature flag');
      } catch (error: any) {
        expect(error.toString()).to.include('TradingDisabled');
      }
    });
  });

  describe('open position feature flag', () => {
    let orderId: BN;
    let orderPDA: PublicKey;

    before(async () => {
      // Enable all flags to create an order
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

      // Create an order for testing
      orderId = new BN(Date.now() + 1000);

      await userClient.createOrder({
        orderId,
        size: ORDER_SIZE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        action: { open: {} },
        targetPosition: null,
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
        limitPrice: BASELINE_PRICE, // Set reasonable limit price matching NAV
        orderType: { limit: {} },
      });

      [orderPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
        client.program.programId,
      );
    });

    it('Should fail to open position when allow_open_position is disabled', async () => {
      // Disable opening positions
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

      const positionId = new BN(Date.now());
      const entryPrice = BASELINE_PRICE; // NAV is $1

      try {
        await matcherClient.openPosition({
          positionId,
          entryPrice,
          order: orderPDA,
          baskt: basktId,
          orderOwner: user.publicKey,
        });
        expect.fail('Should have failed due to disabled feature flag');
      } catch (error: any) {
        expect(error.toString()).to.include('PositionOperationsDisabled');
      }
    });

    it('Should fail to open position when allow_trading is disabled', async () => {
      // Enable open position but disable trading
      await client.updateFeatureFlags({
        allowAddLiquidity: true,
        allowRemoveLiquidity: true,
        allowOpenPosition: true, // ENABLED
        allowClosePosition: true,
        allowPnlWithdrawal: true,
        allowCollateralWithdrawal: true,
        allowAddCollateral: true,
        allowBasktCreation: true,
        allowBasktUpdate: true,
        allowTrading: false, // DISABLED
        allowLiquidations: true,
      });

      const positionId = new BN(Date.now() + 1);
      const entryPrice = BASELINE_PRICE; // NAV is $1

      try {
        await matcherClient.openPosition({
          positionId,
          entryPrice,
          order: orderPDA,
          baskt: basktId,
          orderOwner: user.publicKey,
        });
        expect.fail('Should have failed due to disabled feature flag');
      } catch (error: any) {
        expect(error.toString()).to.include('PositionOperationsDisabled');
      }
    });
  });

  describe('close position feature flag', () => {
    let positionPDA: PublicKey;
    let positionId: BN;

    before(async () => {
      // Enable all flags to create a position
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

      // Liquidity pool should already be initialized in the main before hook

      // Create and open a position
      const orderId = new BN(Date.now() + 2000);

      await userClient.createOrder({
        orderId,
        size: ORDER_SIZE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        action: { open: {} },
        targetPosition: null,
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
        limitPrice: BASELINE_PRICE, // Set reasonable limit price matching NAV
        orderType: { limit: {} },
      });

      const [orderPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
        client.program.programId,
      );

      positionId = new BN(Date.now() + 2001);
      const entryPrice = BASELINE_PRICE; // NAV is $1, not 50,000

      // Derive position PDA
      [positionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('position'),
          user.publicKey.toBuffer(),
          positionId.toArrayLike(Buffer, 'le', 8),
        ],
        client.program.programId,
      );

      await matcherClient.openPosition({
        positionId,
        entryPrice,
        order: orderPDA,
        baskt: basktId,
        orderOwner: user.publicKey,
      });
    });

    it('Should fail to close position when allow_close_position is disabled', async () => {
      // Disable closing positions
      await client.updateFeatureFlags({
        allowAddLiquidity: true,
        allowRemoveLiquidity: true,
        allowOpenPosition: true,
        allowClosePosition: false, // DISABLED
        allowPnlWithdrawal: true,
        allowCollateralWithdrawal: true,
        allowAddCollateral: true,
        allowBasktCreation: true,
        allowBasktUpdate: true,
        allowTrading: true,
        allowLiquidations: true,
      });

      const exitPrice = new BN(101 * 1_000_000); // Price moved up from NAV $1

      // Need to create a close order first
      const closeOrderId = new BN(Date.now() + 2002);
      await userClient.createOrder({
        orderId: closeOrderId,
        size: ORDER_SIZE,
        collateral: new BN(0), // No collateral for close orders
        isLong: true,
        action: { close: {} },
        targetPosition: positionPDA,
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
        limitPrice: BASELINE_PRICE, // Set reasonable limit price matching NAV
        orderType: { limit: {} },
      });

      const [closeOrderPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('order'),
          user.publicKey.toBuffer(),
          closeOrderId.toArrayLike(Buffer, 'le', 8),
        ],
        client.program.programId,
      );

      // Get treasury token account
      const treasuryTokenAccount = await client.getOrCreateUSDCAccount(client.treasury.publicKey);

      try {
        await matcherClient.closePosition({
          orderPDA: closeOrderPDA,
          position: positionPDA,
          exitPrice,
          baskt: basktId,
          ownerTokenAccount: userTokenAccount,
          treasury: client.treasury.publicKey,
          treasuryTokenAccount: treasuryTokenAccount,
        });
        expect.fail('Should have failed due to disabled feature flag');
      } catch (error: any) {
        expect(error.toString()).to.include('PositionOperationsDisabled');
      }
    });

    it('Should fail to close position when allow_trading is disabled', async () => {
      // Enable close position but disable trading
      await client.updateFeatureFlags({
        allowAddLiquidity: true,
        allowRemoveLiquidity: true,
        allowOpenPosition: true,
        allowClosePosition: true, // ENABLED
        allowPnlWithdrawal: true,
        allowCollateralWithdrawal: true,
        allowAddCollateral: true,
        allowBasktCreation: true,
        allowBasktUpdate: true,
        allowTrading: false, // DISABLED
        allowLiquidations: true,
      });

      const exitPrice = new BN(101 * 1_000_000); // Price moved up from NAV $1

      // Need to create a close order first
      const closeOrderId = new BN(Date.now() + 2003);

      // Re-enable trading temporarily to create the close order
      await resetFeatureFlags();

      await userClient.createOrder({
        orderId: closeOrderId,
        size: ORDER_SIZE,
        collateral: new BN(0), // No collateral for close orders
        isLong: true,
        action: { close: {} },
        targetPosition: positionPDA,
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
        limitPrice: BASELINE_PRICE, // Set reasonable limit price matching NAV
        orderType: { limit: {} },
      });

      const [closeOrderPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('order'),
          user.publicKey.toBuffer(),
          closeOrderId.toArrayLike(Buffer, 'le', 8),
        ],
        client.program.programId,
      );

      // Now disable trading again
      await client.updateFeatureFlags({
        allowAddLiquidity: true,
        allowRemoveLiquidity: true,
        allowOpenPosition: true,
        allowClosePosition: true, // ENABLED
        allowPnlWithdrawal: true,
        allowCollateralWithdrawal: true,
        allowAddCollateral: true,
        allowBasktCreation: true,
        allowBasktUpdate: true,
        allowTrading: false, // DISABLED
        allowLiquidations: true,
      });

      // Get treasury token account
      const treasuryTokenAccount = await client.getOrCreateUSDCAccount(client.treasury.publicKey);

      try {
        await matcherClient.closePosition({
          orderPDA: closeOrderPDA,
          position: positionPDA,
          exitPrice,
          baskt: basktId,
          ownerTokenAccount: userTokenAccount,
          treasury: client.treasury.publicKey,
          treasuryTokenAccount: treasuryTokenAccount,
        });
        expect.fail('Should have failed due to disabled feature flag');
      } catch (error: any) {
        expect(error.toString()).to.include('PositionOperationsDisabled');
      }
    });
  });

  describe('liquidate position feature flag', () => {
    let positionPDA: PublicKey;
    let positionId: BN;

    before(async () => {
      // Enable all flags to create a risky position
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

      // Create a highly leveraged position for liquidation
      const orderId = new BN(Date.now() + 3000);
      const size = new BN(10 * 1e6); // 10 USDC
      const collateral = new BN(11.15 * 1e6); // 11.15 USDC (enough for 110% collateral + fees)

      await userClient.createOrder({
        orderId,
        size,
        collateral,
        isLong: true,
        action: { open: {} },
        targetPosition: null,
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: collateralMint,
        limitPrice: BASELINE_PRICE, // Set reasonable limit price matching NAV
        orderType: { limit: {} },
      });

      const [orderPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
        client.program.programId,
      );

      positionId = new BN(Date.now() + 3001);
      const initialPrice = BASELINE_PRICE; // NAV is $1, not 50,000

      // Derive position PDA
      [positionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('position'),
          user.publicKey.toBuffer(),
          positionId.toArrayLike(Buffer, 'le', 8),
        ],
        client.program.programId,
      );

      await matcherClient.openPosition({
        positionId,
        entryPrice: initialPrice,
        order: orderPDA,
        baskt: basktId,
        orderOwner: user.publicKey,
      });
    });

    it('Should fail to liquidate position when allow_liquidations is disabled', async () => {
      // Disable liquidations
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
        allowLiquidations: false, // DISABLED
      });

      // Price drops significantly to make position liquidatable
      const liquidationPrice = new BN(0.6 * 1e6); // 0.6 - 40% drop from NAV $1 to ensure liquidation

      // Get treasury token account
      const treasuryTokenAccount = await client.getOrCreateUSDCAccount(client.treasury.publicKey);

      try {
        await liquidatorClient.liquidatePosition({
          position: positionPDA,
          exitPrice: liquidationPrice,
          baskt: basktId,
          ownerTokenAccount: userTokenAccount,
          treasury: client.treasury.publicKey,
          treasuryTokenAccount: treasuryTokenAccount,
        });
        expect.fail('Should have failed due to disabled feature flag');
      } catch (error: any) {
        expect(error.toString()).to.include('PositionOperationsDisabled');
      }
    });
  });


});
