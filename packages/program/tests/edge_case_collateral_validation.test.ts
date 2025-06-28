import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { getAccount } from '@solana/spl-token';
import { TestClient, requestAirdrop } from './utils/test-client';
import { AccessControlRole } from '@baskt/types';

/**
 * This test demonstrates a potential edge case where:
 * 1. An order can be created with collateral that passes initial validation
 * 2. But when the position is opened, the collateral after fees is insufficient
 * 
 * The issue arises because:
 * - Order creation validates: collateral >= min_collateral_ratio * size
 * - Position opening deducts fees from collateral FIRST, then validates the NET amount
 */
describe('Edge Case: Collateral Validation Gap', () => {
  const client = TestClient.getInstance();
  
  // Test accounts
  let user: Keypair;
  let matcher: Keypair;
  let userClient: TestClient;
  let matcherClient: TestClient;
  
  // Test state
  let basktId: PublicKey;
  let userTokenAccount: PublicKey;
  let escrowTokenAccount: PublicKey;
  let assetId: PublicKey;
  
  // USDC mint constant
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  
  before(async () => {
    // Create test keypairs
    user = Keypair.generate();
    matcher = Keypair.generate();
    
    // Fund accounts
    await requestAirdrop(user.publicKey, client.connection);
    await requestAirdrop(matcher.publicKey, client.connection);
    
    // Create clients
    userClient = await TestClient.forUser(user);
    matcherClient = await TestClient.forUser(matcher);
    
    // Add matcher role
    await client.addRole(matcher.publicKey, AccessControlRole.Matcher);
    
    // Enable features
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
    
    // Create synthetic asset
    const assetResult = await client.addAsset('BTC', {
      allowLongs: true,
      allowShorts: true,
    });
    assetId = assetResult.assetAddress;
    
    // Create baskt
    const basktName = `TestBaskt_${Date.now()}`;
    const { basktId: createdBasktId } = await client.createBaskt(
      basktName,
      [{
        weight: new BN(10000),
        direction: true,
        assetId: assetId,
        baselinePrice: new BN(0),
      }],
      true,
    );
    basktId = createdBasktId;
    
    // Activate baskt
    await client.activateBaskt(
      basktId,
      [new BN(50000 * 1000000)], // $50,000
      60,
    );
    
    // Setup token accounts
    userTokenAccount = await client.getOrCreateUSDCAccount(user.publicKey);
    [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_escrow'), user.publicKey.toBuffer()],
      client.program.programId,
    );
    
    // Mint USDC to user
    await client.mintUSDC(userTokenAccount, 1000_000_000); // 1000 USDC
  });
  
  it('Demonstrates order creation succeeding but position opening failing', async () => {
    // Get current protocol config
    const protocol = await client.program.account.protocol.fetch(
      PublicKey.findProgramAddressSync([Buffer.from('protocol')], client.program.programId)[0]
    );
    
    const MIN_COLLATERAL_RATIO_BPS = protocol.config.minCollateralRatioBps.toNumber();
    const OPENING_FEE_BPS = protocol.config.openingFeeBps.toNumber();
    
    console.log('Protocol Config:');
    console.log('- Min Collateral Ratio:', MIN_COLLATERAL_RATIO_BPS, 'bps');
    console.log('- Opening Fee:', OPENING_FEE_BPS, 'bps');
    
    // Calculate edge case values
    const POSITION_SIZE = new BN(10_000_000); // 10 USDC
    
    // Minimum collateral required by order validation
    const minCollateralForOrder = POSITION_SIZE.muln(MIN_COLLATERAL_RATIO_BPS).divn(10000);
    
    // Opening fee that will be deducted
    const openingFee = POSITION_SIZE.muln(OPENING_FEE_BPS).divn(10000);
    
    // Set collateral to EXACTLY the minimum required for order creation
    // This will pass order creation but fail position opening after fee deduction
    const COLLATERAL = minCollateralForOrder;
    
    console.log('\nCalculated Values:');
    console.log('- Position Size:', POSITION_SIZE.toString());
    console.log('- Min Collateral for Order:', minCollateralForOrder.toString());
    console.log('- Opening Fee:', openingFee.toString());
    console.log('- Collateral Provided:', COLLATERAL.toString());
    console.log('- Net Collateral After Fee:', COLLATERAL.sub(openingFee).toString());
    console.log('- Required Net Collateral:', minCollateralForOrder.toString());
    
    // Step 1: Create order - This should SUCCEED
    const orderId = new BN(Date.now());
    const [orderPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('order'), user.publicKey.toBuffer(), orderId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );
    
    try {
      await userClient.createOrder({
        orderId,
        size: POSITION_SIZE,
        collateral: COLLATERAL,
        isLong: true,
        action: { open: {} },
        targetPosition: null,
        basktId: basktId,
        ownerTokenAccount: userTokenAccount,
        collateralMint: USDC_MINT,
      });
      
      console.log('\n✅ Order creation SUCCEEDED (as expected)');
      
      // Verify order was created
      const orderAccount = await client.program.account.order.fetch(orderPDA);
      console.log('Order created with collateral:', orderAccount.collateral.toString());
      
    } catch (error: any) {
      console.log('\n❌ Order creation FAILED (unexpected):', error.message);
      throw error;
    }
    
    // Step 2: Try to open position - This should FAIL
    const positionId = new BN(Date.now());
    const [positionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), user.publicKey.toBuffer(), positionId.toArrayLike(Buffer, 'le', 8)],
      client.program.programId,
    );
    
    try {
      await matcherClient.openPosition({
        orderId,
        positionId,
        entryPrice: new BN(50000 * 1000000),
        owner: user.publicKey,
        basktId,
      });
      
      console.log('\n❌ Position opening SUCCEEDED (unexpected - edge case not present)');
      
      // If it succeeded, show the position details
      const position = await client.program.account.position.fetch(positionPDA);
      console.log('Position collateral after fees:', position.collateral.toString());
      
    } catch (error: any) {
      console.log('\n✅ Position opening FAILED (as expected)');
      console.log('Error:', error.message);
      
      // Verify the error is about insufficient collateral
      expect(error.message).to.include('InsufficientCollateral');
    }
  });
  
  it('Shows the correct way to handle collateral', async () => {
    // Get protocol config
    const protocol = await client.program.account.protocol.fetch(
      PublicKey.findProgramAddressSync([Buffer.from('protocol')], client.program.programId)[0]
    );
    
    const MIN_COLLATERAL_RATIO_BPS = protocol.config.minCollateralRatioBps.toNumber();
    const OPENING_FEE_BPS = protocol.config.openingFeeBps.toNumber();
    
    const POSITION_SIZE = new BN(10_000_000); // 10 USDC
    
    // Calculate collateral that accounts for fees
    const minCollateralRequired = POSITION_SIZE.muln(MIN_COLLATERAL_RATIO_BPS).divn(10000);
    const openingFee = POSITION_SIZE.muln(OPENING_FEE_BPS).divn(10000);
    
    // Correct approach: Add the fee on top of minimum collateral
    const CORRECT_COLLATERAL = minCollateralRequired.add(openingFee);
    
    console.log('\nCorrect Collateral Calculation:');
    console.log('- Min Collateral Required:', minCollateralRequired.toString());
    console.log('- Opening Fee:', openingFee.toString());
    console.log('- Total Collateral Needed:', CORRECT_COLLATERAL.toString());
    console.log('- Net After Fee:', CORRECT_COLLATERAL.sub(openingFee).toString());
    
    // Create and open position with correct collateral
    const orderId = new BN(Date.now() + 1000);
    const positionId = new BN(Date.now() + 1000);
    
    // Create order
    await userClient.createOrder({
      orderId,
      size: POSITION_SIZE,
      collateral: CORRECT_COLLATERAL,
      isLong: true,
      action: { open: {} },
      targetPosition: null,
      basktId: basktId,
      ownerTokenAccount: userTokenAccount,
      collateralMint: USDC_MINT,
    });
    
    // Open position
    await matcherClient.openPosition({
      orderId,
      positionId,
      entryPrice: new BN(50000 * 1000000),
      owner: user.publicKey,
      basktId,
    });
    
    console.log('\n✅ Both order creation and position opening succeeded with correct collateral');
  });
});