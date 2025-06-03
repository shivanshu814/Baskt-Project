import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { AccessControlRole } from '@baskt/types';
import { initializeProtocolAndRoles } from '../utils/test-setup';
import { initializeProtocolRegistry } from '../utils/protocol_setup';

describe('Oracle Price Validation Edge Cases', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(15_000_000); // 15 USDC
  const ENTRY_PRICE = new BN(100_000_000); // NAV starts at 100 with 6 decimals
  const TICKER = 'BTC';

  // Oracle price NAV = 100 with 6 decimals = 100_000_000
  // 25% deviation = ±25_000_000
  // Valid range for regular operations: 75_000_000 to 125_000_000
  // 20% deviation = ±20_000_000
  // Valid range for liquidation: 80_000_000 to 120_000_000

  // Boundary test prices
  const ORACLE_PRICE_6_DECIMALS = new BN(100_000_000);

  // Regular operation boundaries (25%)
  const REGULAR_LOWER_BOUNDARY = new BN(75_000_000); // Exactly 25% below
  const REGULAR_UPPER_BOUNDARY = new BN(125_000_000); // Exactly 25% above
  const REGULAR_INVALID_LOW = new BN(74_999_999); // Just below 25%
  const REGULAR_INVALID_HIGH = new BN(125_000_001); // Just above 25%

  // Liquidation boundaries (20%)
  const LIQUIDATION_LOWER_BOUNDARY = new BN(80_000_000); // Exactly 20% below
  const LIQUIDATION_UPPER_BOUNDARY = new BN(120_000_000); // Exactly 20% above
  const LIQUIDATION_INVALID_LOW = new BN(79_999_999); // Just below 20%
  const LIQUIDATION_INVALID_HIGH = new BN(120_000_001); // Just above 20%

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
  let fundingIndexPDA: PublicKey;

  // Liquidity pool accounts
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let tokenVault: PublicKey;
  let providerLpAccount: PublicKey;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  before(async () => {
    // Initialize protocol and roles using centralized setup
    const globalAccounts = await initializeProtocolAndRoles(client);
    treasury = globalAccounts.treasury;
    matcher = globalAccounts.matcher;
    liquidator = globalAccounts.liquidator;

    // Verify treasury role was added successfully
    const hasTreasuryRole = await client.hasRole(treasury.publicKey, AccessControlRole.Treasury);
    if (!hasTreasuryRole) {
      throw new Error('Treasury role was not added successfully');
    }

    // Create test user
    user = Keypair.generate();
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

    // Create a baskt with the asset
    const basktName = `TestBaskt_Oracle_${Date.now()}`;
    const formattedAssetConfig = {
      weight: new BN(10000),
      direction: true,
      assetId: assetId,
      baselinePrice: new BN(0),
    };

    const { basktId: createdBasktId } = await client.createBaskt(
      basktName,
      [formattedAssetConfig],
      true,
    );
    basktId = createdBasktId;

    // Activate the baskt with initial prices
    // Since weight is 100% (10000 bps), the asset price should equal the target NAV
    await client.activateBaskt(
      basktId,
      [new BN(100_000_000)], // NAV = 100 with 6 decimals
      60, // maxPriceAgeSec
    );

    // Find and initialize the funding index PDA
    [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId,
    );

    await client.program.methods
      .initializeFundingIndex()
      .accounts({
        authority: client.getPublicKey(),
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        protocol: client.protocolPDA,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    // Use the USDC mock token for collateral
    collateralMint = USDC_MINT;

    // Create token accounts
    userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);
    treasuryTokenAccount = await client.getOrCreateUSDCAccount(treasury.publicKey);

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(20).toNumber(), // 20x for multiple tests
    );

    // Set up liquidity pool
    ({ liquidityPool, lpMint, tokenVault } = await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint,
    }));

    // Initialize the protocol registry after liquidity pool setup
    await initializeProtocolRegistry(client);

    providerLpAccount = await userClient.createTokenAccount(lpMint, user.publicKey);

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
    await client.mintUSDC(liquidityProviderTokenAccount, COLLATERAL_AMOUNT.muln(10));

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: COLLATERAL_AMOUNT.muln(10),
      minSharesOut: new BN(1),
      providerTokenAccount: liquidityProviderTokenAccount,
      tokenVault,
      providerLpAccount: liquidityProviderLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });
  });

  it('Opens position at exact 25% deviation boundaries', async () => {
    // Test exact boundary values for regular operations (25% deviation)

    // Test upper boundary
    const upperOrderId = new BN(Date.now());
    const upperPositionId = new BN(Date.now() + 1);

    const [upperOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), upperOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [upperPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        upperPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: upperOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should succeed at exactly 25% above oracle price
    await matcherClient.openPosition({
      positionId: upperPositionId,
      entryPrice: REGULAR_UPPER_BOUNDARY,
      order: upperOrderPDA,
      position: upperPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    const upperPosition = await client.program.account.position.fetch(upperPositionPDA);
    expect(upperPosition.entryPrice.toString()).to.equal(REGULAR_UPPER_BOUNDARY.toString());

    // Test lower boundary
    const lowerOrderId = new BN(Date.now() + 10);
    const lowerPositionId = new BN(Date.now() + 11);

    const [lowerOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), lowerOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [lowerPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        lowerPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: lowerOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should succeed at exactly 25% below oracle price
    await matcherClient.openPosition({
      positionId: lowerPositionId,
      entryPrice: REGULAR_LOWER_BOUNDARY,
      order: lowerOrderPDA,
      position: lowerPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    const lowerPosition = await client.program.account.position.fetch(lowerPositionPDA);
    expect(lowerPosition.entryPrice.toString()).to.equal(REGULAR_LOWER_BOUNDARY.toString());
  });

  it('Fails to open position just outside 25% deviation boundaries', async () => {
    // Test just outside boundary values for regular operations

    // Test just above upper boundary
    const highOrderId = new BN(Date.now() + 20);
    const highPositionId = new BN(Date.now() + 21);

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

    // Should fail just above 25% boundary
    try {
      await matcherClient.openPosition({
        positionId: highPositionId,
        entryPrice: REGULAR_INVALID_HIGH,
        order: highOrderPDA,
        position: highPositionPDA,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
      });

      expect.fail('Should have failed just above 25% boundary');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }

    // Test just below lower boundary
    const lowOrderId = new BN(Date.now() + 30);
    const lowPositionId = new BN(Date.now() + 31);

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

    // Should fail just below 25% boundary
    try {
      await matcherClient.openPosition({
        positionId: lowPositionId,
        entryPrice: REGULAR_INVALID_LOW,
        order: lowOrderPDA,
        position: lowPositionPDA,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
      });

      expect.fail('Should have failed just below 25% boundary');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });

  it('Liquidates position at exact 20% deviation boundaries', async () => {
    // Test exact boundary values for liquidation operations (20% deviation)
    // Use minimal collateral to ensure position is liquidatable
    const MINIMAL_COLLATERAL = new BN(11_000_000); // 11 USDC (110% of 10-unit order) - minimum required

    // Test upper boundary - for a short position to be liquidatable when price goes up
    const upperOrderId = new BN(Date.now() + 40);
    const upperPositionId = new BN(Date.now() + 41);

    const [upperOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), upperOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [upperPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        upperPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create and open SHORT position (will be liquidatable when price rises)
    await userClient.createOrder({
      orderId: upperOrderId,
      size: ORDER_SIZE,
      collateral: MINIMAL_COLLATERAL,
      isLong: false, // SHORT position
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    await matcherClient.openPosition({
      positionId: upperPositionId,
      entryPrice: ENTRY_PRICE,
      order: upperOrderPDA,
      position: upperPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should succeed at exactly 20% above oracle price for liquidation
    await liquidatorClient.liquidatePosition({
      position: upperPositionPDA,
      exitPrice: LIQUIDATION_UPPER_BOUNDARY,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Test lower boundary - for a long position to be liquidatable when price goes down
    const lowerOrderId = new BN(Date.now() + 50);
    const lowerPositionId = new BN(Date.now() + 51);

    const [lowerOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), lowerOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [lowerPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        lowerPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    // Create and open LONG position (will be liquidatable when price falls)
    await userClient.createOrder({
      orderId: lowerOrderId,
      size: ORDER_SIZE,
      collateral: MINIMAL_COLLATERAL,
      isLong: true, // LONG position
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    await matcherClient.openPosition({
      positionId: lowerPositionId,
      entryPrice: ENTRY_PRICE,
      order: lowerOrderPDA,
      position: lowerPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should succeed at exactly 20% below oracle price for liquidation
    await liquidatorClient.liquidatePosition({
      position: lowerPositionPDA,
      exitPrice: LIQUIDATION_LOWER_BOUNDARY,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });
  });

  it('Fails to liquidate position just outside 20% deviation boundaries', async () => {
    // Test just outside boundary values for liquidation operations

    // Test just above upper boundary
    const highOrderId = new BN(Date.now() + 60);
    const highPositionId = new BN(Date.now() + 61);

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

    await matcherClient.openPosition({
      positionId: highPositionId,
      entryPrice: ENTRY_PRICE,
      order: highOrderPDA,
      position: highPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should fail just above 20% boundary for liquidation
    try {
      await liquidatorClient.liquidatePosition({
        position: highPositionPDA,
        exitPrice: LIQUIDATION_INVALID_HIGH,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Should have failed just above 20% liquidation boundary');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }

    // Test just below lower boundary
    const lowOrderId = new BN(Date.now() + 70);
    const lowPositionId = new BN(Date.now() + 71);

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

    await matcherClient.openPosition({
      positionId: lowPositionId,
      entryPrice: ENTRY_PRICE,
      order: lowOrderPDA,
      position: lowPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should fail just below 20% boundary for liquidation
    try {
      await liquidatorClient.liquidatePosition({
        position: lowPositionPDA,
        exitPrice: LIQUIDATION_INVALID_LOW,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Should have failed just below 20% liquidation boundary');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });

  it('Validates that 22% deviation works for open/close but fails for liquidation', async () => {
    // Price at 22% deviation: valid for regular ops (25% bound) but invalid for liquidation (20% bound)
    const edgeCasePrice = new BN(122_000_000); // 22% above oracle price (100)

    // Test opening position (should succeed)
    const openOrderId = new BN(Date.now() + 80);
    const openPositionId = new BN(Date.now() + 81);

    const [openOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), openOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    const [openPositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        openPositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: openOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should succeed with 22% deviation for opening
    await matcherClient.openPosition({
      positionId: openPositionId,
      entryPrice: edgeCasePrice,
      order: openOrderPDA,
      position: openPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    const position = await client.program.account.position.fetch(openPositionPDA);
    expect(position.entryPrice.toString()).to.equal(edgeCasePrice.toString());

    // Test closing position with same price (should succeed)
    const closeOrderId = new BN(Date.now() + 90);

    const [closeOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), closeOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: closeOrderId,
      size: ORDER_SIZE,
      collateral: new BN(0),
      isLong: true,
      action: { close: {} },
      targetPosition: openPositionPDA,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Should succeed with 22% deviation for closing
    await matcherClient.closePosition({
      orderPDA: closeOrderPDA,
      position: openPositionPDA,
      exitPrice: edgeCasePrice,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Now test liquidation with same price (should fail)
    const liquidateOrderId = new BN(Date.now() + 100);
    const liquidatePositionId = new BN(Date.now() + 101);

    const [liquidateOrderPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        user.publicKey.toBuffer(),
        liquidateOrderId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    const [liquidatePositionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        user.publicKey.toBuffer(),
        liquidatePositionId.toArrayLike(Buffer, 'le', 8),
      ],
      client.program.programId,
    );

    await userClient.createOrder({
      orderId: liquidateOrderId,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    await matcherClient.openPosition({
      positionId: liquidatePositionId,
      entryPrice: ENTRY_PRICE,
      order: liquidateOrderPDA,
      position: liquidatePositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Should fail with 22% deviation for liquidation
    try {
      await liquidatorClient.liquidatePosition({
        position: liquidatePositionPDA,
        exitPrice: edgeCasePrice,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail('Liquidation should have failed with 22% deviation');
    } catch (error: any) {
      expect(error.error?.errorName || error.toString()).to.include('PriceOutOfBounds');
    }
  });
});
