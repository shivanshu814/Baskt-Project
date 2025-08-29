import { expect } from 'chai';
import { describe, before, it, after } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { BN } from 'bn.js';
import { AccessControlRole, OnchainAssetConfig } from '@baskt/types';
// Using TestClient static method instead of importing from test-setup
import {
  validateBasktPending,
  validateBasktActive,
  validateBasktDecommissioning,
  validateBasktClosed,
} from '../utils/baskt-lifecycle-helpers';
import { BASELINE_PRICE } from '../utils/test-constants';

describe('Close Baskt - Core Logic', () => {
  const client = TestClient.getInstance();

  // Role-based test users
  let basktManager: Keypair;
  let fundingManager: Keypair;
  let regularUser: Keypair;

  // Test assets
  let btcAssetId: PublicKey;
  let ethAssetId: PublicKey;


  before(async () => {
    // Initialize protocol and roles
    const globalAccounts = await TestClient.initializeProtocolAndRoles(client);

    // Assign role-based users
    basktManager = client.basktManager;
    fundingManager = globalAccounts.fundingManager;
    regularUser = Keypair.generate();

    // Create test assets
    const btcResult = await client.addAsset('BTC');
    const ethResult = await client.addAsset('ETH');
    btcAssetId = btcResult.assetAddress;
    ethAssetId = ethResult.assetAddress;

  });



  /**
   * Helper to create baskt in specific lifecycle state
   * Follows the exact baskt lifecycle: pending -> active -> decommissioning -> settled -> closed
   */
  async function createBasktInState(
    name: string,
    targetState: 'pending' | 'active' | 'decommissioning' | 'closed',
    fundingRate: number = 0,
  ): Promise<{ basktId: PublicKey }> {
    // Create baskt with standard asset allocation
    const assets: OnchainAssetConfig[] = [
      {
        assetId: btcAssetId,
        direction: true,
        weight: new BN(7000), // 70% BTC
        baselinePrice: new BN(0),
      },
      {
        assetId: ethAssetId,
        direction: true,
        weight: new BN(3000), // 30% ETH
        baselinePrice: new BN(0),
      },
    ];

    const { basktId } = await client.executeWithRetry(() =>
      client.createBaskt(assets, true),
    );

    if (targetState === 'pending') {
      return { basktId };
    }

    // Activate baskt
    const btcPrice = new BN(50000_000000); // $50,000
    const ethPrice = new BN(3000_000000); // $3,000
    await client.executeWithRetry(() => client.activateBaskt(basktId, [btcPrice, ethPrice]));

    if (targetState === 'active') {
      return { basktId };
    }

    // Decommission baskt (BasktManager only)
    const basktManagerClient = await TestClient.forUser(basktManager);
    await client.executeWithRetry(() => basktManagerClient.decommissionBaskt(basktId));

    if (targetState === 'decommissioning') {
      return { basktId };
    }

    // Update funding index (FundingManager only)
    const fundingManagerClient = await TestClient.forUser(fundingManager);
    await client.executeWithRetry(() =>
      fundingManagerClient.updateMarketIndices(basktId, new BN(fundingRate), new BN(0)),
    );

    // Close baskt (BasktManager only)
    await client.executeWithRetry(() => basktManagerClient.closeBaskt(basktId));

    return { basktId };
  }

  describe('Successful Close Operations', () => {
    it('Successfully closes settled baskt with zero open positions', async () => {
      // Create settled baskt
      const { basktId } = await createBasktInState('CloseSuccess', 'decommissioning');

      // Verify pre-conditions
      const basktBefore = await client.getBasktRaw(basktId);
      const decommissioningValidation = validateBasktDecommissioning(basktBefore.status);
      expect(decommissioningValidation.isValid).to.be.true;
      expect(basktBefore.openPositions.toString()).to.equal('0');


      // Close baskt (BasktManager only)
      const basktManagerClient = await TestClient.forUser(basktManager);
      const txSignature = await client.executeWithRetry(() =>
        basktManagerClient.closeBaskt(basktId),
      );
      expect(txSignature).to.be.a('string');

      // Verify final state
      const closedValidation = await validateBasktClosed(client, basktId);
      expect(closedValidation.isValid).to.be.true;
  
    });

  });

  describe('State Constraint Validation', () => {
    it('Rejects close on Pending baskt with InvalidBasktState', async () => {
      const { basktId } = await createBasktInState('PendingReject', 'pending');

      // Attempt close on pending baskt - must fail
      const basktManagerClient = await TestClient.forUser(basktManager);
      try {
        await basktManagerClient.closeBaskt(basktId);
        expect.fail('Should have thrown InvalidBasktState error');
      } catch (error: unknown) {
        expect((error as Error).message).to.contains('InvalidBasktState');
      }

      // Verify state unchanged
      const basktAfter = await client.getBasktRaw(basktId);
      const pendingValidation = validateBasktPending(basktAfter.status);
      expect(pendingValidation.isValid).to.be.true;
    });



  });

  describe('Authorization Constraints', () => {
    it('Rejects close by regular user with Unauthorized error', async () => {
      const { basktId } = await createBasktInState('RegularUserReject', 'decommissioning');

      // Attempt close with regular user - must fail
      const regularUserClient = await TestClient.forUser(regularUser);
      try {
        await regularUserClient.closeBaskt(basktId);
        expect.fail('Should have thrown Unauthorized error');
      } catch (error: unknown) {
        expect((error as Error).message).to.contain('Unauthorized');
      }

      // Verify state unchanged
      const basktAfter = await client.getBasktRaw(basktId);
      const decommissioningValidation = validateBasktDecommissioning(basktAfter.status);
      expect(decommissioningValidation.isValid).to.be.true;
    });
    it('Allows close by BasktManager (correct role)', async () => {
      const { basktId } = await createBasktInState('BasktManagerSuccess', 'decommissioning');

      // Close with BasktManager - must succeed
      const basktManagerClient = await TestClient.forUser(basktManager);
      const txSignature = await basktManagerClient.closeBaskt(basktId);
      expect(txSignature).to.be.a('string');

      // Verify successful close
      const closedValidation = await validateBasktClosed(client, basktId);
      expect(closedValidation.isValid).to.be.true;
    });
  });

  describe('Integration Tests', () => {
    it('Executes complete baskt lifecycle ending with close', async () => {
      // Create baskt with standard asset allocation
      const assetConfigs: OnchainAssetConfig[] = [
        {
          assetId: btcAssetId,
          direction: true,
          weight: new BN(7000), // 70% BTC
          baselinePrice: new BN(0),
        },
        {
          assetId: ethAssetId,
          direction: true,
          weight: new BN(3000), // 30% ETH
          baselinePrice: new BN(0),
        },
      ];

      // 1. Create baskt (Pending state)
      const { basktId } = await client.executeWithRetry(() =>
        client.createBaskt(assetConfigs, true),
      );

      let baskt = await client.getBasktRaw(basktId);
      const pendingValidation = validateBasktPending(baskt.status);
      expect(pendingValidation.isValid).to.be.true;
      expect(baskt.openPositions.toString()).to.equal('0');

      // 2. Activate baskt
      const btcPrice = new BN(50000_000000); // $50,000
      const ethPrice = new BN(3000_000000); // $3,000
      await client.executeWithRetry(() => client.activateBaskt(basktId, [btcPrice, ethPrice]));

      baskt = await client.getBasktRaw(basktId);
      const activeValidation = validateBasktActive(baskt.status);
      expect(activeValidation.isValid).to.be.true;
      expect(baskt.baselineNav.gt(new BN(0))).to.be.true;

      // 3. Decommission baskt (BasktManager only)
      const basktManagerClient = await TestClient.forUser(basktManager);
      await client.executeWithRetry(() => basktManagerClient.decommissionBaskt(basktId));

      baskt = await client.getBasktRaw(basktId);
      const decommissioningValidation = validateBasktDecommissioning(baskt.status);
      expect(decommissioningValidation.isValid).to.be.true;


      await client.executeWithRetry(() => basktManagerClient.closeBaskt(basktId));

      const closedValidation = await validateBasktClosed(client, basktId);
      expect(closedValidation.isValid).to.be.true;
    });

    it('Demonstrates PositionsStillOpen constraint with actual position', async () => {
      // 1. Create and activate baskt
      const assets: OnchainAssetConfig[] = [
        {
          assetId: btcAssetId,
          direction: true,
          weight: new BN(10000), // 100% BTC for simplicity
          baselinePrice: new BN(0),
        },
      ];
  
      const { basktId } = await client.createBaskt( assets, true);
  
      // Activate baskt
      const btcPrice = new BN(500_000000); // $500 (adjusted for $1 baseline)
      await client.activateBaskt(basktId, [btcPrice]);
  
      // Setup liquidity pool for position operations
      const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      await client.setupLiquidityPool({
        depositFeeBps: 0,
        withdrawalFeeBps: 0,
        collateralMint: USDC_MINT,
      });
      const positionOwner = await TestClient.forUser(Keypair.generate() );
      const matcher = await TestClient.forUser(Keypair.generate());
      const ENTRY_PRICE = new BN(BASELINE_PRICE); // $1

      const NOTIONAL_VALUE = new BN(1 * 1e6); // 1 USDC
      const COLLATERAL_AMOUNT = new BN(200 * 1e6); // 200 USDC
  
      // Create token accounts for position owner and treasury
      const ownerTokenAccount = await client.getOrCreateUSDCAccountKey(positionOwner.publicKey);
      const treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(client.treasury.publicKey);
      await client.mintUSDC(ownerTokenAccount, COLLATERAL_AMOUNT.muln(2));
 
      await client.addRole(matcher.publicKey, AccessControlRole.Matcher);
      // 2. Create and open position
      const orderId = client.newUID();
      const positionId = client.newUID();
  
      // Find PDAs
      const orderPDA = await client.getOrderPDA(orderId, positionOwner.publicKey);
  
      const positionPDA = await client.getPositionPDA(positionOwner.publicKey, positionId);
      
  

      
      // Create order with proper limit price matching the expected execution price (NAV = $1)
      await matcher.createAndOpenMarketPosition({
        orderId,
        notionalValue: NOTIONAL_VALUE,
        collateral: COLLATERAL_AMOUNT,
        isLong: true,
        entryPrice: ENTRY_PRICE,
        ownerTokenAccount: ownerTokenAccount,
        leverageBps: new BN(10000),
        userClient: positionOwner,
        positionId: positionId,
        basktId: basktId,
      });
  
   
      // 3. Decommission baskt
      const basktManagerClient = await TestClient.forUser(basktManager);
      await basktManagerClient.decommissionBaskt(basktId);
  
      const basktAfterDecommission = await client.getBasktRaw(basktId);
      expect(basktAfterDecommission.openPositions.toString()).to.equal('1');
  
      // 4. Attempt to close with open position - MUST FAIL
      try {
        await basktManagerClient.closeBaskt(basktId);
        expect.fail('Should have thrown PositionsStillOpen error');
      } catch (error: any) {
        // Use specific error validation instead of string matching
        expect((error as Error).message).to.contain('PositionsStillOpen');
      }
  
  
      // 5. Close position (this decrements open_positions)
      // Create close order 
      const closeOrderId = client.newUID();
      const position = await client.getPosition(await client.getPositionPDA(positionOwner.publicKey, positionId));
  
      await matcher.createAndCloseMarketPosition({
        orderId: closeOrderId,
        position: positionPDA,
        userClient: positionOwner,
        positionId: positionId,
        basktId: basktId,
        exitPrice: ENTRY_PRICE,
        sizeAsContracts: position.size,
        ownerTokenAccount: ownerTokenAccount,
      }); 
  
      // Verify position was closed and open_positions decremented
      const basktAfterClose = await client.getBasktRaw(basktId);
      expect(basktAfterClose.openPositions.toString()).to.equal('0');
  
      // 6. Now close baskt should succeed
      await basktManagerClient.closeBaskt(basktId);
  
      const closedValidation = await validateBasktClosed(client, basktId);
      expect(closedValidation.isValid).to.be.true;
    });

  });
});
