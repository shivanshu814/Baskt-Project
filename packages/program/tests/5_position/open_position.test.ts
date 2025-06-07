import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { initializeProtocolAndRoles } from '../utils/test-setup';
import { initializeProtocolRegistry } from '../utils/protocol_setup';

describe('Position Opening', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(15_000_000); // 15 USDC (assuming 6 decimals)
  const ENTRY_PRICE = new BN(100_000_000); // NAV starts at 100 with 6 decimals
  const TICKER = 'BTC';

  // Test accounts
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
  let assetId: PublicKey;
  let fundingIndexPDA: PublicKey;

  // Order and position state
  let orderId: BN;
  let orderPDA: PublicKey;
  let positionId: BN;
  let positionPDA: PublicKey;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  before(async () => {
    // Initialize protocol and roles using centralized setup
    const globalAccounts = await initializeProtocolAndRoles(client);
    treasury = globalAccounts.treasury;
    matcher = globalAccounts.matcher;

    // Create test-specific accounts
    user = Keypair.generate();
    nonMatcher = Keypair.generate();

    // Fund the test-specific accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(nonMatcher.publicKey, client.connection);

    // Create user clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    nonMatcherClient = await TestClient.forUser(nonMatcher);

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
    const basktName = `TestBaskt_OpenPos_${Date.now()}`;

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
    // Since weight is 100% (10000 bps), the asset price should equal the target NAV
    await client.activateBaskt(
      basktId,
      [new BN(100_000_000)], // NAV = 100 with 6 decimals
      60, // maxPriceAgeSec
    );

    // Find the funding index PDA for the baskt
    [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId,
    );

    // Initialize the funding index
    await client.program.methods
      .initializeFundingIndex()
      .accounts({
        authority: client.getPublicKey(),
        // @ts-ignore: fundingIndex matches IDL but TS types are out of sync
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        protocol: client.protocolPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Use the USDC mock token for collateral
    collateralMint = USDC_MINT;

    // Create token accounts for the test
    userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);

    // Find the funding index PDA for the baskt
    [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId,
    );

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(10).toNumber(), // 10x for multiple tests
    );

    // Set up a minimal liquidity pool (required for registry initialization)
    await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint,
    });

    // Initialize the protocol registry after liquidity pool setup
    await initializeProtocolRegistry(client);

    // Generate unique IDs for order and position
    orderId = new BN(Date.now());
    positionId = new BN(Date.now() + 1);

    // Find the order and position PDAs
    [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    // Create an open order for testing
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
    });
  });

  it('Successfully opens a position from a valid order', async () => {
    // Get funding index before opening position
    const fundingIndexBefore = await client.program.account.fundingIndex.fetch(fundingIndexPDA);

    // Open the position using the matcher client helper
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: orderPDA,
      position: positionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Fetch the position account
    const positionAccount = await client.program.account.position.fetch(positionPDA);

    // Verify position details
    expect(positionAccount.owner.toString()).to.equal(user.publicKey.toString());
    expect(positionAccount.positionId.toString()).to.equal(positionId.toString());
    expect(positionAccount.basktId.toString()).to.equal(basktId.toString());
    expect(positionAccount.size.toString()).to.equal(ORDER_SIZE.toString());
    expect(positionAccount.collateral.toString()).to.equal(COLLATERAL_AMOUNT.toString());
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

    const [newPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        newPositionId.toArrayLike(Buffer, 'le', 8),
      ],
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
    });

    // Try to open the position using a non-matcher client
    try {
      await nonMatcherClient.openPosition({
        positionId: newPositionId,
        entryPrice: ENTRY_PRICE,
        order: newOrderPDA,
        position: newPositionPDA,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
      });

      expect.fail('Transaction should have failed due to missing matcher role');
    } catch (error: any) {
      // console.debug('Non-matcher open error:', error.toString());
      expect(error.error?.errorName || error.toString()).to.include('Unauthorized');
    }
  });

  it('Successfully opens a position with price within oracle deviation bounds (25%)', async () => {
    // Oracle price is NAV = 100 with 6 decimals = 100_000_000
    // 25% deviation = ±25 = ±25_000_000
    // Valid range: 75_000_000 to 125_000_000

    const validPriceHigh = new BN(124_000_000); // 124 - within 25% bound
    const validPriceLow = new BN(76_000_000); // 76 - within 25% bound

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
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should succeed with valid high price
    await matcherClient.openPosition({
      positionId: highPositionId,
      entryPrice: validPriceHigh,
      order: highOrderPDA,
      position: highPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
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
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should succeed with valid low price
    await matcherClient.openPosition({
      positionId: lowPositionId,
      entryPrice: validPriceLow,
      order: lowOrderPDA,
      position: lowPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Verify position was created
    const lowPositionAccount = await client.program.account.position.fetch(lowPositionPDA);
    expect(lowPositionAccount.entryPrice.toString()).to.equal(validPriceLow.toString());
  });

  it('Fails to open position with price outside oracle deviation bounds (>25%)', async () => {
    // Oracle price is NAV = 100 with 6 decimals = 100_000_000
    // 25% deviation = ±25 = ±25_000_000
    // Invalid range: <75_000_000 or >125_000_000

    const invalidPriceHigh = new BN(130_000_000); // 130 - outside 25% bound
    const invalidPriceLow = new BN(70_000_000); // 70 - outside 25% bound

    // Test with invalid high price
    const highOrderId = new BN(Date.now() + 300);
    const highPositionId = new BN(Date.now() + 301);

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
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should fail with invalid high price
    try {
      await matcherClient.openPosition({
        positionId: highPositionId,
        entryPrice: invalidPriceHigh,
        order: highOrderPDA,
        position: highPositionPDA,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
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
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should fail with invalid low price
    try {
      await matcherClient.openPosition({
        positionId: lowPositionId,
        entryPrice: invalidPriceLow,
        order: lowOrderPDA,
        position: lowPositionPDA,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
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

    const [zeroPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        zeroPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: zeroOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should fail with zero price
    try {
      await matcherClient.openPosition({
        positionId: zeroPositionId,
        entryPrice: new BN(0),
        order: zeroOrderPDA,
        position: zeroPositionPDA,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
      });

      expect.fail('Transaction should have failed due to zero entry price');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('InvalidOraclePrice');
    }
  });
});
