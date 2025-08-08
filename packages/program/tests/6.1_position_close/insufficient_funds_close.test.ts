import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { OrderAction, OrderType } from '@baskt/types';
import { PRICE_PRECISION } from '@baskt/sdk';
import { BPS_DIVISOR } from '../utils/fee-utils';

describe('Insufficient Funds Close Position', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test parameters - designed to create insufficient funds scenario
  const NOTIONAL_ORDER_VALUE = new BN(100 * 1e6); // 100 USDC (large position for significant profit)
  const ENTRY_PRICE = BASELINE_PRICE; // NAV starts at 1 with 6 decimals
  const PROFITABLE_EXIT_PRICE = ENTRY_PRICE.add(new BN(50 * 1e6)); // 51 for 50x profit
  const TICKER = 'BTC';
  const COLLATERAL_AMOUNT = new BN(120 * 1e6); // 120 USDC (sufficient for large position)

  const MINIMAL_POOL_LIQUIDITY = new BN(100 * 1e6); // 100 USDC

  // Calculate position size in contracts (NOTIONAL_ORDER_VALUE * PRICE_PRECISION / ENTRY_PRICE)
  const POSITION_SIZE_CONTRACTS = NOTIONAL_ORDER_VALUE.mul(PRICE_PRECISION).div(ENTRY_PRICE);

  // Test accounts from centralized setup
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
  let treasuryTokenAccount: PublicKey;
  let assetId: PublicKey;

  // Liquidity pool accounts for Closing tests
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
    nonMatcher = testSetup.nonMatcher;
    userClient = testSetup.userClient;
    matcherClient = testSetup.matcherClient;
    nonMatcherClient = testSetup.nonMatcherClient;
    basktId = testSetup.basktId;
    collateralMint = testSetup.collateralMint;
    userTokenAccount = testSetup.userTokenAccount;
    assetId = testSetup.assetId;
    lpMint = testSetup.lpMint;
    liquidityPool = testSetup.liquidityPool;
    usdcVault = testSetup.usdcVault;

    // Get treasury from protocol
    treasury = client.treasury;
    treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);

    // Mint additional USDC for the large position test
    await client.mintUSDC(
      userTokenAccount,
      COLLATERAL_AMOUNT.muln(2).toNumber(), // 2x collateral for safety
    );

    // Create a separate provider for MINIMAL liquidity to avoid role conflicts
    const liquidityProviderClient = await TestClient.forUser(Keypair.generate());

    // Create token accounts for liquidity provider
    const liquidityProviderTokenAccount = await client.getOrCreateUSDCAccountKey(
      liquidityProviderClient.publicKey,
    );
    const liquidityProviderLpAccount = await client.createTokenAccount(
      lpMint,
      liquidityProviderClient.publicKey,
    );

    // Mint MINIMAL USDC to liquidity provider (insufficient for large profits)
    await client.mintUSDC(liquidityProviderTokenAccount, MINIMAL_POOL_LIQUIDITY.toNumber());

    // Add MINIMAL liquidity using the liquidity provider (only 1,000 USDC)
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: MINIMAL_POOL_LIQUIDITY, // Only 1,000 USDC - insufficient for large profit
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
    // Reset feature flags to enabled state after each test using centralized helper
    await TestClient.resetFeatureFlags(client);
  });

  it('Fails to close position when liquidity pool has insufficient funds for profit payout', async () => {
    // Get current pool vault balance to calculate required profit that exceeds available funds
    const vaultBefore = await getAccount(client.connection, usdcVault);
    const currentVaultBalance = new BN(vaultBefore.amount.toString());

    const notionalValue = currentVaultBalance;
    const collateralAmount = notionalValue.muln(120).divn(100);

    const exitPrice = ENTRY_PRICE.muln(300).divn(100);

    console.log('notionalValue', notionalValue.toString());
    console.log('collateralAmount', collateralAmount.toString());
    console.log('ENTRY_PRICE', ENTRY_PRICE.toString());
    console.log('exitPrice', exitPrice.toString());
    console.log('POSITION_SIZE_CONTRACTS', POSITION_SIZE_CONTRACTS.toString());
    console.log("Vault Balance", vaultBefore.amount.toString());


    // Create and open a large position that will generate massive profit
    const largePositionId = client.newUID();

    const largePositionPDA = await client.getPositionPDA(user.publicKey, largePositionId);

    // Create and open the large position
    await matcherClient.createAndOpenMarketPosition({
        userClient,
        orderId: client.newUID(),
        positionId: largePositionId,
        basktId,
        notionalValue: notionalValue, 
        collateral: collateralAmount, 
        isLong: true, 
        entryPrice: ENTRY_PRICE,
        ownerTokenAccount: userTokenAccount,
        leverageBps: new BN(10000), // 1x leverage
      });

    const positionAfterOpen = await client.getPosition(largePositionPDA);

    // Attempt to close the position - this should FAIL due to insufficient pool funds
    try {
        await matcherClient.createAndCloseMarketPosition({
            userClient, 
            orderId: client.newUID(),
            position: largePositionPDA,
            positionId: largePositionId,
            basktId,
            exitPrice: exitPrice,
            sizeAsContracts: positionAfterOpen.size,
            ownerTokenAccount: userTokenAccount,  
        });
        const vaultAfter = await getAccount(client.connection, usdcVault);
        console.log("Vault Balance After Close", vaultAfter.amount.toString());

        expect.fail(
            'Transaction should have failed due to insufficient pool funds for profit payout',
        );
    } catch (error: any) {
      console.log('Insufficient funds error:', error.message);
      // Verify this is specifically the SPL Token insufficient funds error (0x1)
      expect(error.message).to.include('custom program error: 0x1');

      // Verify the error message contains the specific insufficient funds text from logs
      expect(error.message).to.include('Program log: Error: insufficient funds');
    }

    // Verify position still exists (transaction failed, so position wasn't closed)
    const positionAfterFailedClose = await client.getPosition(largePositionPDA);
    expect(positionAfterFailedClose.size.toString()).to.equal(positionAfterOpen.size.toString());

    // Verify pool state unchanged (no transfers occurred due to failure)
    const vaultAfter = await getAccount(client.connection, usdcVault);
    const openingFee = (await client.getProtocolAccount()).config.openingFeeBps;
    const openingFeeAmount = openingFee.mul(notionalValue).div(BPS_DIVISOR);
    const treasuryCut = (await client.getProtocolAccount()).config.treasuryCutBps;
    const treasuryCutAmount = treasuryCut.mul(openingFeeAmount).div(BPS_DIVISOR);
    const expectedVaultBalance = new BN(vaultBefore.amount).add(openingFeeAmount).sub(treasuryCutAmount);
    expect(vaultAfter.amount.toString()).to.equal(expectedVaultBalance.toString());
  });
});
