import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient } from '../utils/test-client';
import { BASELINE_PRICE } from '../utils/test-constants';
import { PRICE_PRECISION } from '@baskt/sdk';
import { BPS_DIVISOR } from '../utils/fee-utils';

describe('Bad Debt Accounting', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  const MINIMAL_COLLATERAL = new BN(23 * 1e6); 
  const TICKER = 'BTC';


  // Test accounts from centralized setup
  let user: Keypair;
  let treasury: Keypair;
  let matcher: Keypair;
  let liquidator: Keypair;
  let nonMatcher: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  let liquidatorClient: TestClient;
  let nonMatcherClient: TestClient;

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

    // Assign all the returned values from setup
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
    liquidityPool = testSetup.liquidityPool;
    lpMint = testSetup.lpMint;
    usdcVault = testSetup.usdcVault;

    // Get global accounts
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);
    treasury = client.treasury;
    liquidator = globalAccounts.liquidator;

    // Create treasury token account
    treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);

    // Create liquidator client
    liquidatorClient = await TestClient.forUser(liquidator);

    // Mint USDC tokens to user for the bad debt scenario
    await client.mintUSDC(
      userTokenAccount,
      MINIMAL_COLLATERAL.muln(500).toNumber(), 
    );

    // Create a separate provider for substantial liquidity to avoid role conflicts
    const liquidityProviderClient = await TestClient.forUser(Keypair.generate());

    // Create token accounts for liquidity provider
    const liquidityProviderTokenAccount = await client.getOrCreateUSDCAccountKey(
      liquidityProviderClient.publicKey,
    );
    const liquidityProviderLpAccount = await client.createTokenAccount(
      lpMint,
      liquidityProviderClient.publicKey,
    );

    // Mint substantial USDC to liquidity provider for bad debt coverage
    await client.mintUSDC(liquidityProviderTokenAccount, 50_000 * 1e6); // 50,000 USDC

    // Add liquidity using the liquidity provider
    await liquidityProviderClient.addLiquidityToPool({
      liquidityPool,
      amount: new BN(50_000 * 1e6), // deposit 50,000 USDC
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
    // Reset feature flags using centralized method
    await TestClient.resetFeatureFlags(client);
  });

  it('Properly accounts for bad debt when position losses exceed collateral: SHORT', async () => {

    const positionId = client.newUID();    
    const positionPDA = await client.getPositionPDA(user.publicKey, positionId);

    const NOTIONAL_VALUE = new BN(20 * 1e6); // 20 USDC notional
    const MINIMAL_COLLATERAL = new BN(23 * 1e6); // 23 USDC collateral (minimal for maximum leverage)
    const ENTRY_PRICE = BASELINE_PRICE; 
    const LIQUIDATION_PRICE = ENTRY_PRICE.add(new BN(150 * 1e6)); // 251 

    
    
    // Create and open SHORT position with minimal collateral
    await matcherClient.createAndOpenMarketPosition({ 
      userClient,
      orderId: client.newUID(),
      positionId,
      basktId,
      notionalValue: NOTIONAL_VALUE, // 20 USDC notional
      collateral: MINIMAL_COLLATERAL, // 23 USDC collateral (minimal for maximum leverage)
      isLong: false, // SHORT position - will lose money when price increases
      entryPrice: ENTRY_PRICE,
      ownerTokenAccount: userTokenAccount,
      leverageBps: new BN(10000), // 1x leverage
    });
    const snapshotBefore = await client.snapshotPositionBalances(positionPDA, user.publicKey);

    // Liquidate the position at the catastrophic price
    await liquidatorClient.liquidatePosition({
      position: positionPDA,
      exitPrice: LIQUIDATION_PRICE, // 151 - catastrophic for SHORT position
      baskt: basktId,
      ownerTokenAccount: userTokenAccount,
      treasury: treasury.publicKey,
      treasuryTokenAccount: treasuryTokenAccount,
    });

    const snapshotAfter = await client.snapshotPositionBalances(positionPDA, user.publicKey);

    await client.verifyClose({
      snapshotBefore,
      snapshotAfter,
      basktId,
      collateralRatioBps: new BN(10000),
      entryPrice: ENTRY_PRICE,
      exitPrice: LIQUIDATION_PRICE,
      sizeClosed: snapshotBefore.positionAccount!.size,
      isBadDebt: true,
    });

  });

});
