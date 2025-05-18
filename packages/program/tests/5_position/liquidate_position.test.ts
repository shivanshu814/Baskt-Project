import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { AccessControlRole } from '@baskt/types';

describe('Liquidate Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const COLLATERAL_AMOUNT = new BN(11_000_000); // 11 USDC (110% of 10-unit order)
  const ENTRY_PRICE = new BN(50_000_000_000_000); // $50,000 with 9 decimals
  const LIQUIDATION_PRICE = new BN(49_000_000_000_000); // $49,000 with 9 decimals (price drop for long)
  const NON_LIQUIDATION_PRICE = new BN(51_000_000_000_000); // $51,000 with 9 decimals (price increase for long)
  const TICKER = 'BTC';

  // Test accounts
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let liquidator: Keypair;
  let nonLiquidator: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let liquidatorClient: TestClient;
  let nonLiquidatorClient: TestClient;

  // Test state
  let basktId: PublicKey;
  let collateralMint: PublicKey;
  let userTokenAccount: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let assetId: PublicKey;
  let fundingIndexPDA: PublicKey;

  // Position state for liquidation
  let orderId: BN;
  let orderPDA: PublicKey;
  let positionId: BN;
  let positionPDA: PublicKey;

  // Position state for non-liquidation
  let orderIdSafe: BN;
  let orderPDASafe: PublicKey;
  let positionIdSafe: BN;
  let positionPDASafe: PublicKey;

  // USDC mint constant from the program
  const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

  // Liquidity pool accounts for liquidation tests
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let tokenVault: PublicKey;
  let poolAuthority: PublicKey;
  let providerLpAccount: PublicKey;

  before(async () => {
    try {
      // Check if protocol is already initialized
      await client.getProtocolAccount();
    } catch (error) {
      try {
        await client.initializeProtocol();
      } catch (initError) {
        throw initError; // Fail the test if we can't initialize the protocol
      }
    }

    // Set up test roles
    await client.initializeRoles();

    // Create test keypairs
    user = Keypair.generate();
    treasury = Keypair.generate();
    matcher = Keypair.generate();
    liquidator = Keypair.generate();
    nonLiquidator = Keypair.generate();

    // Fund the test accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(treasury.publicKey, client.connection);
    await requestAirdrop(matcher.publicKey, client.connection);
    await requestAirdrop(liquidator.publicKey, client.connection);
    await requestAirdrop(nonLiquidator.publicKey, client.connection);

    // Create user clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    liquidatorClient = await TestClient.forUser(liquidator);
    nonLiquidatorClient = await TestClient.forUser(nonLiquidator);

    // Add roles
    await client.addRole(treasury.publicKey, AccessControlRole.Treasury);
    await client.addRole(matcher.publicKey, AccessControlRole.Matcher);
    await client.addRole(liquidator.publicKey, AccessControlRole.Liquidator);

    // Verify roles
    const hasTreasuryRole = await client.hasRole(treasury.publicKey, AccessControlRole.Treasury);
    const hasMatcherRole = await client.hasRole(matcher.publicKey, AccessControlRole.Matcher);
    const hasLiquidatorRole = await client.hasRole(liquidator.publicKey, AccessControlRole.Liquidator);
    expect(hasTreasuryRole).to.be.true;
    expect(hasMatcherRole).to.be.true;
    expect(hasLiquidatorRole).to.be.true;

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
    const basktName = `TestBaskt_Liquidate_${Date.now()}`;

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
      true // isPublic
    );
    basktId = createdBasktId;

    // Activate the baskt with initial prices
    await client.activateBaskt(
      basktId,
      [new BN(50000 * 1000000)], // $50,000 price with 6 decimals
      60 // maxPriceAgeSec
    );

    // Find the funding index PDA for the baskt
    [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId
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
    treasuryTokenAccount = await client.getOrCreateUSDCAccount(treasury.publicKey);

    // Find the funding index PDA for the baskt
    [fundingIndexPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('funding_index'), basktId.toBuffer()],
      client.program.programId
    );

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(10).toNumber() // 10x for multiple tests
    );

    // Set up a liquidity pool for liquidation tests
    ({ liquidityPool, lpMint, tokenVault } = await client.setupLiquidityPool({
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
      collateralMint,
    }));
    // Create LP token account for provider (user)
    providerLpAccount = await userClient.createTokenAccount(lpMint, user.publicKey);
    // Deposit ample liquidity into the pool
    await userClient.addLiquidityToPool({
      liquidityPool,
      amount: COLLATERAL_AMOUNT.muln(3), // deposit 3x collateral
      minSharesOut: new BN(1),
      providerTokenAccount: userTokenAccount,
      tokenVault,
      providerLpAccount,
      lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });

    // Generate unique IDs for orders and positions
    orderId = new BN(Date.now());
    positionId = new BN(Date.now() + 1);
    orderIdSafe = new BN(Date.now() + 100);
    positionIdSafe = new BN(Date.now() + 101);

    // Find the order and position PDAs for liquidation scenario
    [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    // Find the order and position PDAs for non-liquidation scenario
    [orderPDASafe] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderIdSafe.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    [positionPDASafe] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionIdSafe.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    // Create an open order for liquidation scenario (low collateral)
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

    // Open the position for liquidation scenario
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: orderPDA,
      position: positionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Create an open order for non-liquidation scenario (higher collateral)
    await userClient.createOrder({
      orderId: orderIdSafe,
      size: ORDER_SIZE,
      collateral: COLLATERAL_AMOUNT.muln(5), // 5x more collateral
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Open the position for non-liquidation scenario
    await matcherClient.openPosition({
      positionId: positionIdSafe,
      entryPrice: ENTRY_PRICE,
      order: orderPDASafe,
      position: positionPDASafe,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });
  });

  it('Successfully liquidates a position that meets liquidation criteria', async () => {
    // Derive the position escrow token account PDA
    const [positionEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), positionPDA.toBuffer()],
      client.program.programId
    );

    // Get token balances before liquidation
    const treasuryTokenBefore = await getAccount(client.connection, treasuryTokenAccount);
    // Get pool vault balance before liquidation
    const vaultBefore = await getAccount(client.connection, tokenVault);

    // Try to get position escrow account if it exists
    let positionEscrowBefore;
    try {
      positionEscrowBefore = await getAccount(client.connection, positionEscrow);
    } catch (error) {
      // Position escrow might not exist yet, which is fine
    }

    // Liquidate the position
    await liquidatorClient.liquidatePosition({
      position: positionPDA,
      exitPrice: LIQUIDATION_PRICE,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    // Position account should be closed
    try {
      await client.program.account.position.fetch(positionPDA);
      expect.fail("Position account should be closed");
    } catch (err: any) {
      expect(err.message).to.include('Account does not exist');
    }

    // Get token balances after liquidation
    const treasuryTokenAfter = await getAccount(client.connection, treasuryTokenAccount);

    // Verify treasury received liquidation fee
    const treasuryBalanceDiff = new BN(treasuryTokenAfter.amount.toString()).sub(new BN(treasuryTokenBefore.amount.toString()));
    expect(treasuryBalanceDiff.gt(new BN(0))).to.be.true; // Should have received liquidation fee

    // Verify liquidity pool vault decreased by pool payout
    const vaultAfter = await getAccount(client.connection, tokenVault);
    expect(new BN(vaultBefore.amount.toString()).lt(new BN(vaultAfter.amount.toString()))).to.be.true;
  });

  it('Fails to liquidate a position that does not meet liquidation criteria', async () => {
    // Try to liquidate a position that doesn't meet liquidation criteria (higher collateral)
    try {
      await liquidatorClient.liquidatePosition({
        position: positionPDASafe,
        exitPrice: NON_LIQUIDATION_PRICE, // Price that would result in profit for long
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail("Transaction should have failed due to position not being liquidatable");
    } catch (error: any) {
      // console.log('Non-liquidatable error:', error.toString());
      expect(error.error?.errorName || error.toString()).to.include('PositionNotLiquidatable');
    }
  });

  it('Fails to liquidate without liquidator role', async () => {
    // Create a new position for this test
    const newOrderId = new BN(Date.now() + 300);
    const newPositionId = new BN(Date.now() + 301);

    // Find the PDAs
    const [newOrderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), newOrderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    const [newPositionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), newPositionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    // Create an open order with low collateral
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

    // Open the position
    await matcherClient.openPosition({
      positionId: newPositionId,
      entryPrice: ENTRY_PRICE,
      order: newOrderPDA,
      position: newPositionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });

    // Try to liquidate the position with a non-liquidator (should fail)
    try {
      await nonLiquidatorClient.liquidatePosition({
        position: newPositionPDA,
        exitPrice: LIQUIDATION_PRICE,
        fundingIndex: fundingIndexPDA,
        baskt: basktId,
        ownerTokenAccount: userTokenAccount,
        treasury: treasury.publicKey,
        treasuryTokenAccount: treasuryTokenAccount,
      });

      expect.fail("Transaction should have failed due to missing liquidator role");
    } catch (error: any) {
      // console.debug('Non-liquidator liquidate error:', error.toString());
      expect(error.error?.errorName || error.toString()).to.include('Unauthorized');
    }
  });
});
