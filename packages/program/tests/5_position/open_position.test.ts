import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
// Using TestClient static method instead of importing from test-setup
// Chain helpers and fee utils are now used internally by TestClient methods

describe('Position Opening', () => {
  // Constants for test
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(12_000_000); // 12 USDC (enough for $1 limit price)
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at $1 with 6 decimals

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
  let fundingIndexPDA: PublicKey;

  // Order and position data
  let orderId: BN;
  let orderPDA: PublicKey;
  let positionId: BN;
  let positionPDA: PublicKey;

  before(async () => {
    // Use the centralized position test setup helper
    const testSetup = await TestClient.setupPositionTest({
      client,
      orderSize: ORDER_SIZE,
      collateralAmount: COLLATERAL_AMOUNT,
      entryPrice: ENTRY_PRICE,
      ticker: 'BTC',
      isLong: true,
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
    fundingIndexPDA = testSetup.fundingIndexPDA;
    orderId = testSetup.orderId;
    orderPDA = testSetup.orderPDA;
    positionId = testSetup.positionId;
    positionPDA = testSetup.positionPDA;
  });

  afterEach(async () => {
    // Reset feature flags to enabled state after each test using the centralized helper
    await TestClient.resetFeatureFlags(client);
  });

  it('Successfully opens a position from a valid order', async () => {
    // Get funding index before opening position
    const fundingIndexBefore = await client.program.account.fundingIndex.fetch(fundingIndexPDA);

    // Open the position using the matcher client helper
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: orderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Fetch the position account
    const positionAccount = await client.program.account.position.fetch(positionPDA);

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

    // notional_allowed = collateral * 10_000 / total_bps
    const notionalAllowed = COLLATERAL_AMOUNT.mul(TEN_THOUSAND).div(TOTAL_BPS);

    // expected size = notional_allowed * PRICE_PRECISION / entry_price
    const expectedSize = notionalAllowed.mul(PRICE_PRECISION).div(ENTRY_PRICE);

    // opening fee = notional_allowed * opening_fee_bps / 10_000
    const openingFee = notionalAllowed.mul(openingFeeBps).div(TEN_THOUSAND);
    const expectedNetCollateral = COLLATERAL_AMOUNT.sub(openingFee);

    expect(positionAccount.size.toString()).to.equal(expectedSize.toString());
    expect(positionAccount.collateral.toString()).to.equal(expectedNetCollateral.toString());
    expect(positionAccount.isLong).to.be.true;
    expect(positionAccount.entryPrice.toString()).to.equal(ENTRY_PRICE.toString());
    expect(positionAccount.entryFundingIndex.toString()).to.equal(
      fundingIndexBefore.cumulativeIndex.toString(),
    );
    expect(positionAccount.lastFundingIndex.toString()).to.equal(
      fundingIndexBefore.cumulativeIndex.toString(),
    );
    expect(positionAccount.fundingAccumulated.toString()).to.equal('0');
    expect(Object.keys(positionAccount.status)[0]).to.equal('open');
    expect(positionAccount.exitPrice).to.be.null;
    expect(positionAccount.timestampClose).to.be.null;

    // Try to fetch the order account - should be closed
    try {
      await client.program.account.order.fetch(orderPDA);
      expect.fail('Order account should be closed');
    } catch (error) {
      // This is expected - the account should be closed
      expect((error as Error).message).to.include('Account does not exist');
    }
  });

  it('Fails to open a position without matcher role', async () => {
    // Create a new order for this test
    const newOrderId = new BN(Date.now() + 100);
    const newPositionId = new BN(Date.now() + 101);

    // Find the new order and position PDAs
    const [newOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), newOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Create a new open order
    await userClient.createOrder({
      orderId: newOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: ENTRY_PRICE, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      leverageBps: new BN(10000), // 1x leverage
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
      // console.debug('Non-matcher open error:', error.toString());
      expect(error.error?.errorName || error.toString()).to.include('Unauthorized');
    }
  });

  it('Successfully opens a position with price within oracle deviation bounds (25%)', async () => {
    // Oracle price is NAV = $1 with 6 decimals = 1_000_000
    // 25% deviation = ±250_000
    // Valid range: 750_000 to 1250_000

    const validPriceHigh = new BN(1_240_000); // $1.24 - within 25% bound
    const validPriceLow = new BN(760_000); // $0.76 - within 25% bound

    // Calculate required collateral for high price ($1.24)
    // Base notional = 10 * 1.24 = 12.4 USDC, slippage = 0.62 USDC, worst-case = 13.02 USDC
    // Min collateral (100%) = 13.02 USDC, opening fee = 0.013 USDC, total = ~13.1 USDC
    const highPriceCollateral = new BN(14_000_000); // 14 USDC with buffer

    // Test with high valid price
    const highOrderId = new BN(Date.now() + 200);
    const highPositionId = new BN(Date.now() + 201);

    const [highOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), highOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [highPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        highPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: highOrderId,
      size: ORDER_SIZE,
      collateral: highPriceCollateral,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: validPriceHigh, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      leverageBps: new BN(10000), // 1x leverage
    });

    // Should succeed with valid high price
    await matcherClient.openPosition({
      positionId: highPositionId,
      entryPrice: validPriceHigh,
      order: highOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Verify position was created
    const positionAccount = await client.program.account.position.fetch(highPositionPDA);
    expect(positionAccount.entryPrice.toString()).to.equal(validPriceHigh.toString());

    // Test with low valid price
    const lowOrderId = new BN(Date.now() + 210);
    const lowPositionId = new BN(Date.now() + 211);

    const [lowOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), lowOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [lowPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        lowPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: lowOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT, // $0.76 price needs less collateral than $1
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: validPriceLow, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      leverageBps: new BN(10000), // 1x leverage
    });

    // Should succeed with valid low price
    await matcherClient.openPosition({
      positionId: lowPositionId,
      entryPrice: validPriceLow,
      order: lowOrderPDA,
      baskt: basktId,
      orderOwner: user.publicKey,
    });

    // Verify position was created
    const lowPositionAccount = await client.program.account.position.fetch(lowPositionPDA);
    expect(lowPositionAccount.entryPrice.toString()).to.equal(validPriceLow.toString());
  });

  it('Fails to open position with price outside oracle deviation bounds (>25%)', async () => {
    // Oracle price is NAV = $1 with 6 decimals = 1_000_000
    // 25% deviation = ±250_000
    // Invalid range: <750_000 or >1250_000

    const invalidPriceHigh = new BN(130_000_0); // 1.3 - outside 25% bound
    const invalidPriceLow = new BN(70_000_0); // 0.7 - outside 25% bound

    // Calculate required collateral for high price (130 USDC)
    const highPriceCollateral = new BN(1_600_000_000); // 1600 USDC with buffer

    // Test with invalid high price
    const highOrderId = new BN(Date.now() + 300);
    const highPositionId = new BN(Date.now() + 301);

    const [highOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), highOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: highOrderId,
      size: ORDER_SIZE,
      collateral: highPriceCollateral,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: invalidPriceHigh, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      leverageBps: new BN(10000), // 1x leverage
    });

    // Should fail with invalid high price
    try {
      await matcherClient.openPosition({
        positionId: highPositionId,
        entryPrice: invalidPriceHigh,
        order: highOrderPDA,
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to price outside deviation bounds');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }

    // Test with invalid low price
    const lowOrderId = new BN(Date.now() + 310);
    const lowPositionId = new BN(Date.now() + 311);

    const [lowOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), lowOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: lowOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT, // 70 USDC price needs less collateral
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: invalidPriceLow, // Set limit price to match expected execution price
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      leverageBps: new BN(10000), // 1x leverage
    });

    // Should fail with invalid low price
    try {
      await matcherClient.openPosition({
        positionId: lowPositionId,
        entryPrice: invalidPriceLow,
        order: lowOrderPDA,
        baskt: basktId,
        orderOwner: user.publicKey,
      });

      expect.fail('Transaction should have failed due to price outside deviation bounds');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });

  it('Fails to open position with zero entry price', async () => {
    const zeroOrderId = new BN(Date.now() + 400);
    const zeroPositionId = new BN(Date.now() + 401);

    const [zeroOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), zeroOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: zeroOrderId,
      size: ORDER_SIZE,
      collateral: new BN(50_000_000), // Small collateral for small limit price
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
      limitPrice: new BN(1_000), // Minimum valid limit price (0.001 USDC)
      maxSlippageBps: new BN(500), // 5% slippage tolerance
      leverageBps: new BN(10000), // 1x leverage
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
});
