import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { AccessControlRole } from '@baskt/types';
import { initializeProtocolAndRoles, getGlobalTestAccounts } from '../utils/test-setup';

describe('Add Collateral to Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters
  const ORDER_SIZE = new BN(10_000_000); // 10 units
  const INITIAL_COLLATERAL = new BN(11_000_000); // 11 USDC (110% of 10-unit order)
  const ADDITIONAL_COLLATERAL = new BN(2_000_000); // 2 USDC
  const ENTRY_PRICE = new BN(100_000_000); // NAV starts at 100 with 6 decimals
  const TICKER = 'BTC';

  // Test accounts
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let otherUser: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let otherUserClient: TestClient;

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
  const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

  before(async () => {
    // Initialize protocol and roles using centralized setup
    const globalAccounts = await initializeProtocolAndRoles(client);
    treasury = globalAccounts.treasury;
    matcher = globalAccounts.matcher;

    // Create test-specific accounts
    user = Keypair.generate();
    otherUser = Keypair.generate();

    // Fund the test-specific accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(otherUser.publicKey, client.connection);

    // Create user clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    otherUserClient = await TestClient.forUser(otherUser);

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
    const basktName = `TestBaskt_AddColl_${Date.now()}`;

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
    // Since weight is 100% (10000 bps), the asset price should equal the target NAV
    await client.activateBaskt(
      basktId,
      [new BN(100_000_000)], // NAV = 100 with 6 decimals
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

    // Mint USDC tokens to user
    await client.mintUSDC(
      userTokenAccount,
      INITIAL_COLLATERAL.add(ADDITIONAL_COLLATERAL).muln(5).toNumber() // 5x for multiple tests
    );

    // Generate unique IDs for order and position
    orderId = new BN(Date.now());
    positionId = new BN(Date.now() + 1);

    // Find the order and position PDAs
    [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId
    );

    // Create an open order for testing
    await userClient.createOrder({
      orderId,
      size: ORDER_SIZE,
      collateral: INITIAL_COLLATERAL,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: collateralMint,
    });

    // Open the position using the matcher client helper
    await matcherClient.openPosition({
      positionId: positionId,
      entryPrice: ENTRY_PRICE,
      order: orderPDA,
      position: positionPDA,
      fundingIndex: fundingIndexPDA,
      baskt: basktId,
    });
  });

  it('Successfully adds collateral to a position', async () => {
    // Get position state before adding collateral
    const positionBefore = await client.program.account.position.fetch(positionPDA);

    // Derive the position escrow token account PDA
    const [positionEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), positionPDA.toBuffer()],
      client.program.programId
    );

    // Get token balances before adding collateral
    const userTokenBefore = await getAccount(client.connection, userTokenAccount);

    // Add collateral via TestClient helper
    await userClient.addCollateral({
      position: positionPDA,
      additionalCollateral: ADDITIONAL_COLLATERAL,
      ownerTokenAccount: userTokenAccount,
    });

    // Get position state after adding collateral
    const positionAfter = await client.program.account.position.fetch(positionPDA);

    // Get token balances after adding collateral
    const userTokenAfter = await getAccount(client.connection, userTokenAccount);
    const positionEscrowAfter = await getAccount(client.connection, positionEscrow);

    // Verify position collateral was updated
    const expectedCollateral = new BN(positionBefore.collateral.toString()).add(ADDITIONAL_COLLATERAL);
    expect(positionAfter.collateral.toString()).to.equal(expectedCollateral.toString());

    // Verify token balances changed correctly
    const userBalanceDiff = new BN(userTokenBefore.amount.toString()).sub(new BN(userTokenAfter.amount.toString()));

    // Verify user's token balance decreased by the additional collateral amount
    expect(userBalanceDiff.toString()).to.equal(ADDITIONAL_COLLATERAL.toString());

    // Verify position escrow has the additional collateral
    expect(positionEscrowAfter.amount.toString()).to.equal(ADDITIONAL_COLLATERAL.add(INITIAL_COLLATERAL).toString());
  });

  it('Fails to add zero collateral', async () => {
    // Try to add zero collateral (should fail)
    try {
      await userClient.addCollateral({
        position: positionPDA,
        additionalCollateral: new BN(0),
        ownerTokenAccount: userTokenAccount,
      });

      expect.fail("Transaction should have failed due to zero collateral");
    } catch (error: any) {
      expect(error.toString()).to.include('InsufficientCollateral.');
    }
  });

  it('Fails when non-owner tries to add collateral', async () => {
    // Try to add collateral as a different user (should fail)
    try {
      await otherUserClient.addCollateral({
        position: positionPDA,
        additionalCollateral: ADDITIONAL_COLLATERAL,
        ownerTokenAccount: userTokenAccount,
      });

      expect.fail("Transaction should have failed due to unauthorized access");
    } catch (error: any) {
      expect(error.toString()).to.include('ConstraintSeeds.');
    }
  });

  it('Fails when add collateral feature is disabled', async () => {
    // Disable the add collateral feature
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: false, // Disable the add collateral feature
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });

    // Try to add collateral (should fail due to feature flag)
    try {
      await userClient.addCollateral({
        position: positionPDA,
        additionalCollateral: ADDITIONAL_COLLATERAL,
        ownerTokenAccount: userTokenAccount,
      });

      expect.fail("Transaction should have failed due to disabled feature");
    } catch (error: unknown) {
      expect((error as Error).message).to.include('FeatureDisabled');
    }

    // Re-enable the feature for subsequent tests
    await client.updateFeatureFlags({
      allowAddLiquidity: true,
      allowRemoveLiquidity: true,
      allowOpenPosition: true,
      allowClosePosition: true,
      allowPnlWithdrawal: true,
      allowCollateralWithdrawal: true,
      allowAddCollateral: true, // Re-enable
      allowBasktCreation: true,
      allowBasktUpdate: true,
      allowTrading: true,
      allowLiquidations: true,
    });
  });
});
