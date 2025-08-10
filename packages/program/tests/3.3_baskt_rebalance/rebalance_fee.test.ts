import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { calculateLiquidationPrice, calculateLiquidationPriceInternal, PRICE_PRECISION } from '@baskt/sdk';
import { AccessControlRole, PositionStatus } from '@baskt/types';

describe('Rebalance Fee Application', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const NOTIONAL_ORDER_VALUE = new BN(10 * 1e6); // 10 USDC
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at 1 with 6 decimals
  const EXIT_PRICE_PROFIT = ENTRY_PRICE.add(new BN(2 * 1e5)); // 1 for profitable close
  const REBALANCE_FEE_PER_UNIT = new BN(100); // Scaled by BPS_DIVISOR
  const TICKER = 'BTC';

  // Calculate proper collateral amount
  const COLLATERAL_AMOUNT = new BN(12 * 1e6); // 12 USDC with 6 decimals

  // Calculate position size in contracts
  const POSITION_SIZE_CONTRACTS = NOTIONAL_ORDER_VALUE.mul(PRICE_PRECISION).div(ENTRY_PRICE);

  // Test accounts from centralized setup
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let liquidator: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let liquidatorClient: TestClient;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let assetId: PublicKey;

  // Liquidity pool accounts
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
    userClient = testSetup.userClient;
    matcherClient = testSetup.matcherClient;
    basktId = testSetup.basktId;
    collateralMint = testSetup.collateralMint;
    userTokenAccount = testSetup.userTokenAccount;
    assetId = testSetup.assetId;
    lpMint = testSetup.lpMint;
    liquidityPool = testSetup.liquidityPool;
    usdcVault = testSetup.usdcVault;

    await client.addRole(matcher.publicKey, AccessControlRole.Rebalancer);

    // Get global accounts
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);
    treasury = client.treasury;
    liquidator = globalAccounts.liquidator;
    liquidatorClient = await TestClient.forUser(liquidator);
    treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);

    // Mint additional USDC for multiple tests
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(10).toNumber(), // 10x for multiple tests
    );

    // Set up a liquidity pool for closing positions
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
    await client.mintUSDC(liquidityProviderTokenAccount, NOTIONAL_ORDER_VALUE.muln(100));

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: NOTIONAL_ORDER_VALUE.muln(100), // deposit 100x notional
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
    // Reset feature flags to enabled state after each test
    await TestClient.resetFeatureFlags(client);
  });

  it('Successfully applies rebalance fee when closing position after rebalance', async () => {
    // Create and open a position
    const orderId = client.newUID();
    const positionId = client.newUID();
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);

    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId,
      positionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });

    // Get baskt before rebalance
    const basktBefore = await client.program.account.baskt.fetch(basktId);
    const rebalanceFeeIndexBefore = basktBefore.rebalanceFeeIndex.cumulativeIndex;

    // Perform rebalance with 1% fee
    const assetConfigs = [
      {
        assetId,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: ENTRY_PRICE,
      },
    ];

    await matcherClient.rebalanceBaskt(
      basktId,
      assetConfigs,
      new BN(150 * 1e6), // new NAV = $1.50
      REBALANCE_FEE_PER_UNIT,
    );

    // Verify rebalance fee index was updated
    const basktAfter = await client.program.account.baskt.fetch(basktId);
    const rebalanceFeeIndexAfter = basktAfter.rebalanceFeeIndex.cumulativeIndex;
    expect(rebalanceFeeIndexAfter.sub(rebalanceFeeIndexBefore).toString()).to.equal(REBALANCE_FEE_PER_UNIT.toString());

    // Take snapshot before close
    const snapshotBefore = await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId);

    // Create close order and close the position
    const closeOrderId = client.newUID();
    const tx = await matcherClient.createAndCloseMarketPosition({
      orderId: closeOrderId,
      basktId,
      position: positionPDA,
      ownerTokenAccount: userTokenAccount,
      exitPrice: EXIT_PRICE_PROFIT,
      userClient,
      positionId,
      sizeAsContracts: POSITION_SIZE_CONTRACTS,
    });

    // Take snapshot after close
    const snapshotAfter = await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId);

    // Verify using the comprehensive verifyClose function with rebalance fee
    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_PROFIT,
      sizeClosed: POSITION_SIZE_CONTRACTS,
      snapshotBefore,
      snapshotAfter,
      basktId,
      rebalanceFeePerUnitDiff: rebalanceFeeIndexAfter.sub(rebalanceFeeIndexBefore), // This is the fee index difference
    });
  });

  it('Applies full rebalance fee even for partial closes', async () => {
    // Create and open a position
    const orderId = client.newUID();
    const positionId = client.newUID();
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);

    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId,
      positionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });

    // Perform rebalance with 1% fee
    const assetConfigs = [
      {
        assetId,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: ENTRY_PRICE,
      },
    ];

    const basktBefore = await client.getBaskt(basktId);
    const rebalanceFeeIndexBefore = new BN(basktBefore.rebalanceFeeIndex.cumulativeIndex);

    await matcherClient.rebalanceBaskt(
      basktId,
      assetConfigs,
      new BN(150 * 1e6), // new NAV = $150
      REBALANCE_FEE_PER_UNIT,
    );

    const basktAfter = await client.getBaskt(basktId);
    const rebalanceFeeIndexAfter = new BN(basktAfter.rebalanceFeeIndex.cumulativeIndex);

    // Take snapshot before partial close
    const snapshotBefore = await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId);

    const sizeToClose = POSITION_SIZE_CONTRACTS.div(new BN(2)); // 50%

    await matcherClient.createAndCloseMarketPosition({
      orderId: client.newUID(),
      basktId,
      position: positionPDA,
      ownerTokenAccount: userTokenAccount,
      exitPrice: EXIT_PRICE_PROFIT,
      userClient,
      positionId,
      sizeAsContracts: sizeToClose,
    });

    // Take snapshot after partial close
    const snapshotAfter = await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId);

    // Verify using the comprehensive verifyClose function with full rebalance fee
    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: EXIT_PRICE_PROFIT,
      sizeClosed: sizeToClose,
      snapshotBefore,
      snapshotAfter,
      basktId,
      rebalanceFeePerUnitDiff: rebalanceFeeIndexAfter.sub(rebalanceFeeIndexBefore), // Full fee even for partial close
    });

    // Verify position still exists but with reduced size
    const positionAfter = await client.getPosition(positionPDA);
    const newRebalanceFeeIndex = positionAfter.lastRebalanceFeeIndex;

    expect(positionAfter.size.toString()).to.equal(sizeToClose.toString());
    expect(positionAfter.status).to.deep.equal(PositionStatus.OPEN);

    // Verify the rebalance fee was applied correctly
    expect(newRebalanceFeeIndex.gt(rebalanceFeeIndexBefore)).to.be.true;
    expect(newRebalanceFeeIndex.sub(rebalanceFeeIndexBefore).toString()).to.equal(REBALANCE_FEE_PER_UNIT.toString());

  });

  it('Applies rebalance fee during liquidation', async () => {
    // Create and open a position with minimal collateral for liquidation
    const orderId = client.newUID();
    const positionId = client.newUID();
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);

    const minimalCollateral = NOTIONAL_ORDER_VALUE.mul(new BN(12)).div(new BN(10)); // 1% collateral


    await matcherClient.createAndOpenMarketPosition({
      userClient,
      orderId,
      positionId,
      basktId,
      notionalValue: NOTIONAL_ORDER_VALUE,
      collateral: minimalCollateral,
      isLong: false, // Short position for liquidation test
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });

    // Perform rebalance with 1% fee
    const assetConfigs = [
      {
        assetId,
        direction: true,
        weight: new BN(10000), // 100% BTC
        baselinePrice: ENTRY_PRICE,
      },
    ];

    const basktBefore = await client.getBaskt(basktId);
    const rebalanceFeeIndexBefore = new BN(basktBefore.rebalanceFeeIndex.cumulativeIndex);

    await matcherClient.rebalanceBaskt(
      basktId,
      assetConfigs,
      new BN(150 * 1e6), // new NAV = $1.50
      REBALANCE_FEE_PER_UNIT,
    );

    const basktAfter = await client.getBaskt(basktId);
    const rebalanceFeeIndexAfter = new BN(basktAfter.rebalanceFeeIndex.cumulativeIndex);

    // Take snapshot before liquidation
    const snapshotBefore = await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId);


    // Liquidate the position at a price that makes it liquidatable
    const liquidationPrice = calculateLiquidationPriceInternal(
      ENTRY_PRICE,
      minimalCollateral,
      snapshotBefore.positionAccount!.size,
      new BN(500), // 50% liquidation threshold
      false,
      new BN(0),
      new BN(50), // 0.5% liquidation fee
    ).add(new BN(1e6));

    console.log("liquidationPrice", liquidationPrice.toString());

    const tx =await liquidatorClient.liquidatePosition({
      position: positionPDA,
      exitPrice: liquidationPrice,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Take snapshot after liquidation
    const snapshotAfter = await client.snapshotPositionBalances(positionPDA, user.publicKey, basktId);

    // Get liquidation fee from protocol config
    const protocolConfig = await client.getProtocolAccount();
    const liquidationFeeBps = protocolConfig.config.liquidationFeeBps;

    // Verify using the comprehensive verifyClose function with rebalance fee
    await client.verifyClose({
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: liquidationPrice,
      sizeClosed: POSITION_SIZE_CONTRACTS,
      snapshotBefore,
      snapshotAfter,
      basktId,
      feeBps: liquidationFeeBps,
      rebalanceFeePerUnitDiff: rebalanceFeeIndexAfter.sub(rebalanceFeeIndexBefore),
      isLiquidation: true,
    });
  });

});
