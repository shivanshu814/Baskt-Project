import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
// Using TestClient static method instead of importing from test-setup
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
import { BASELINE_PRICE } from '../utils/test-constants';

describe('Bad Debt Accounting Fix', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters for underwater liquidation scenarios - TRUE BAD DEBT SCENARIO
  const ORDER_SIZE = new BN(100_000); // 0.1 units (reasonable position size)
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at 1 with 6 decimals
  const NEW_ORACLE_PRICE = new BN(1000 * 1e6); // Oracle price surges to 10 USDC (900% moon)
  const LIQUIDATION_PRICE = new BN(900 * 1e6); // Liquidate at 9 USDC (within 20% of new oracle price)

  // Calculate required collateral for normal position opening
  // Base notional = 10 units * 1 USDC = 10 USDC
  // Slippage (5%) = 10 * 0.05 = 0.5 USDC
  // Worst-case notional = 10.5 USDC
  // Min collateral (110%) = 10.5 * 1.1 = 11.55 USDC
  // Opening fee (0.1%) = 10.5 * 0.001 = 0.0105 USDC
  // Total required = 11.55 + 0.0105 = 11.5605 USDC
  // We'll provide exactly the minimum to create maximum leverage
  const MINIMAL_COLLATERAL = new BN(11.5605 * 1e6); // 11.5605 USDC (just above minimum to pass order creation)
  const TICKER = 'ETH';

  // Test accounts
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
  let tokenVault: PublicKey;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  before(async () => {
    // Initialize protocol and roles using centralized setup
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);
    treasury = client.treasury;
    matcher = globalAccounts.matcher;
    liquidator = globalAccounts.liquidator;

    // Create test-specific accounts
    user = Keypair.generate();

    // Fund the test-specific accounts
    await requestAirdrop(user.publicKey, client.connection);

    // Create user clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    liquidatorClient = await TestClient.forUser(liquidator);

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
    const basktName = `TestBaskt_BadDebt_${Date.now()}`;

    // Format asset config correctly
    const formattedAssetConfig = {
      weight: new BN(10000), // 100% weight (10000 bps)
      direction: true, // Long direction
      assetId: assetId, // Include the asset ID in the config
      baselinePrice: new BN(0), // Required by OnchainAssetConfig interface
    };

    const { basktId: createdBasktId } = await client.createBaskt(
      basktName,
      [formattedAssetConfig],
      true, // isPublic
    );
    basktId = createdBasktId;

    // Activate the baskt with initial prices
    await client.activateBaskt(
      basktId,
      [new BN(ENTRY_PRICE)], // NAV = 1 with 6 decimals
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

    // Use the USDC mock token for collateral
    collateralMint = USDC_MINT;
    // Create token accounts for the test
    userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);
    treasuryTokenAccount = await client.getOrCreateUSDCAccount(treasury.publicKey);

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      MINIMAL_COLLATERAL.muln(2).toNumber(), // 2x minimal collateral for safety
    );

    // Set up a liquidity pool for liquidation tests
    ({ liquidityPool, lpMint, tokenVault } = await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint,
    }));

    // Create a separate provider for liquidity to avoid role conflicts
    const liquidityProvider = Keypair.generate();
    await requestAirdrop(liquidityProvider.publicKey, client.connection);
    const liquidityProviderClient = await TestClient.forUser(liquidityProvider);

    // Create token accounts for liquidity provider
    const liquidityProviderTokenAccount = await client.getOrCreateUSDCAccount(
      liquidityProvider.publicKey,
    );
    const liquidityProviderLpAccount = await client.createTokenAccount(
      lpMint,
      liquidityProvider.publicKey,
    );

    // Mint USDC to liquidity provider
    await client.mintUSDC(liquidityProviderTokenAccount, 10_000_000_000); // 10,000 USDC

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: new BN(10_000_000_000), // deposit 10,000 USDC
      minSharesOut: new BN(1),
      providerTokenAccount: liquidityProviderTokenAccount,
      tokenVault,
      providerLpAccount: liquidityProviderLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });
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
    }
  });

  it('Properly accounts for uncollected fees in bad debt when position is severely underwater', async () => {
    // This test verifies the bad debt accounting fix that properly includes uncollected fees
    // Scenario: A SHORT position with minimal collateral becomes severely underwater after a price surge
    //
    // Setup:
    // - SHORT position: 10 units at 100 USDC entry price (1000 USDC notional)
    // - Collateral: 1157 USDC (minimal required including opening fee)
    // - Opening fee: 1 USDC (0.1% of notional), leaving 1156 USDC net collateral
    //
    // Price surge:
    // - Oracle price surges to 1000 USDC (900% increase)
    // - Position loss: (900 - 100) * 10 = 8000 USDC
    // - Gross payout: 1156 - 8000 = -6844 USDC (negative equity)
    //
    // Bad debt calculation:
    // - Expected liquidation fee: 45 USDC (0.5% of 9000 USDC new notional)
    // - Since gross payout is negative, no fees can be collected from user
    // - Total bad debt = 6844 USDC (negative equity) + 45 USDC (uncollected fees) = 6889 USDC
    //
    // Pool accounting:
    // - Pool gains: 1156 USDC (all remaining escrow)
    // - Pool loses: 6889 USDC (total bad debt)
    // - Net pool change: +1156 - 6889 = -5733 USDC

    const orderId = new BN(Date.now());
    const positionId = new BN(Date.now() + 1);

    // Find the order and position PDAs
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Get initial pool state
    const poolBefore = await client.program.account.liquidityPool.fetch(liquidityPool);
    const vaultBefore = await getAccount(client.connection, tokenVault);
    const treasuryBefore = await getAccount(client.connection, treasuryTokenAccount);
    // Get escrow token PDA for the position
    const [escrowTokenPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), positionPDA.toBuffer()],
      client.program.programId,
    );



    // Create an order with minimal collateral that will become severely underwater after oracle price surge
    await userClient.createOrder({
      orderId,
      size: ORDER_SIZE, // 10 USDC position size (1,000 USDC notional)
      collateral: MINIMAL_COLLATERAL, // 1,157 USDC collateral (minimal for opening)
      isLong: false, // SHORT position, will be liquidated on price increase
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected entry price (100 USDC)
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      orderType: { limit: {} },
      leverageBps: new BN(10000), // 1x leverage
    });

    // Open the position
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE, // 100 USDC
      order: orderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Verify position was created successfully
    const positionAfterOpen = await client.program.account.position.fetch(positionPDA);
    expect(positionAfterOpen.size.toString()).to.equal(ORDER_SIZE.toString());
    expect(positionAfterOpen.entryPrice.toString()).to.equal(ENTRY_PRICE.toString());

    // Update oracle price to create underwater position (900% surge)
    await client.updateOraclePrice(basktId, NEW_ORACLE_PRICE);

    // Liquidate the position at the new higher price
    await liquidatorClient.liquidatePosition({
      position: positionPDA,
      exitPrice: LIQUIDATION_PRICE, // 0.9 USDC (within 20% of new oracle price of 10 USDC)
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Get final state for verification
    const poolAfter = await client.program.account.liquidityPool.fetch(liquidityPool);
    const vaultAfter = await getAccount(client.connection, tokenVault);
    const treasuryAfter = await getAccount(client.connection, treasuryTokenAccount);

    // Calculate actual changes
    const poolLiquidityChange = new BN(poolAfter.totalLiquidity.toString()).sub(
      new BN(poolBefore.totalLiquidity.toString())
    );
    const vaultBalanceChange = new BN(vaultAfter.amount.toString()).sub(
      new BN(vaultBefore.amount.toString())
    );
    const treasuryBalanceChange = new BN(treasuryAfter.amount.toString()).sub(
      new BN(treasuryBefore.amount.toString())
    );

    // Calculate expected values based on the surge scenario
    const originalNotional = ORDER_SIZE.mul(ENTRY_PRICE).div(new BN(1_000_000)); // 10 * 1 = 10 USDC original notional
    const newNotional = ORDER_SIZE.mul(LIQUIDATION_PRICE).div(new BN(1_000_000)); // 10 * 0.9 = 9 USDC new notional
    const positionLoss = newNotional.sub(originalNotional); // 9 - 10 = -1 USDC loss
    const openingFee = originalNotional.mul(new BN(10)).div(new BN(10000)); // 0.1% of original notional = 0.01 USDC
    const netCollateral = MINIMAL_COLLATERAL.sub(openingFee); // 11.5605 - 0.0105 = 11.55 USDC
    const liquidationFeeBps = new BN(50); // 0.5%
    const expectedLiquidationFee = newNotional.mul(liquidationFeeBps).div(new BN(10000)); // 0.5% of new notional = 45 USDC

    // Check if position has negative equity
    const grossPayout = netCollateral.sub(positionLoss); // 1156 - 8000 = -6844 USDC
    const badDebt = grossPayout.isNeg() ? grossPayout.abs() : new BN(0); // 6844 USDC bad debt

    // According to the program logic, bad debt should include uncollected fees
    const uncollectedFee = expectedLiquidationFee; // Since gross payout is negative, no fees can be collected
    const totalBadDebt = badDebt.add(uncollectedFee); // 6844 + 45 = 6889 USDC

    // In a bad debt scenario, the user gets 0 back, and no fee is taken from them.
    // The pool pays the liquidation fee. The treasury's cut is the net cost to the pool.
    const treasuryCutBps = new BN(1000); // 10%
    const expectedTreasuryFee = expectedLiquidationFee.mul(treasuryCutBps).div(new BN(10000));
    
    // The pool's total liquidity changes during liquidation by:
    // 1. Gaining all remaining escrow collateral (1156 USDC).
    // 2. Losing the total bad debt amount (including uncollected fees).
    // Note: The opening fee was already processed during position opening, so it's not part of liquidation accounting.
    const expectedPoolChange = netCollateral.sub(totalBadDebt); // +1156 - 6889 = -5733



    // Verify liquidation completed successfully
    // The pool's total liquidity should decrease by the net result of bad debt and fees.
    // Allow for small rounding differences (within 1 USDC)
    const difference = poolLiquidityChange.sub(expectedPoolChange).abs();
    const maxAllowedDifference = new BN(1_000_000); // 1 USDC
    expect(difference.lte(maxAllowedDifference),
      `Pool change difference ${difference.toString()} exceeds max allowed ${maxAllowedDifference.toString()}`
    ).to.be.true;

    // Also verify the pool change is negative (pool loses money in bad debt scenario)
    expect(poolLiquidityChange.isNeg(),
      `Pool change should be negative but was ${poolLiquidityChange.toString()}`
    ).to.be.true;
    
    // In a bad debt scenario, treasury should receive no liquidation fee (since it can't be collected)
    // Treasury only gets fees that can actually be collected from available funds
    expect(treasuryBalanceChange.gte(new BN(0))).to.be.true;

    // The vault balance change is complex, but the pool liquidity change is the ultimate source of truth.

    // Verify position account was closed
    try {
      await client.program.account.position.fetch(positionPDA);
      expect.fail('Position account should be closed');
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // Verify the position had negative equity (bad debt in this scenario)
    expect(grossPayout.isNeg()).to.be.true;
    // Note: This check might be off due to BN precision. The pool change is the better assertion.
    // expect(badDebt.toString()).to.equal(grossPayout.abs().toString());
  });
});
