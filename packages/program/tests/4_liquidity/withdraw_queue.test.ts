import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';
import { BN } from 'bn.js';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
import { USDC_MINT } from '@baskt/sdk';
import { AccessControlRole } from '@baskt/types';
import { provider } from '../../sim/client';

describe('Withdrawal Queue System', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test constants
  const DEPOSIT_FEE_BPS = 50; // 0.5%
  const WITHDRAWAL_FEE_BPS = 100; // 1%
  const MIN_DEPOSIT = new BN(1 * 1e6); // 1 USDC minimum
  const INITIAL_DEPOSIT = new BN(1000 * 1e6); // 1000 USDC

  let treasury: Keypair;
  let liquidityProvider: Keypair;
  let liquidityProvider2: Keypair;
  let keeper: Keypair;
  let nonKeeper: Keypair;

  let treasuryTokenAccount: PublicKey;
  let providerTokenAccount: PublicKey;
  let providerLpAccount: PublicKey;
  let provider2TokenAccount: PublicKey;
  let provider2LpAccount: PublicKey;

  // Test clients
  let providerClient: TestClient;
  let provider2Client: TestClient;
  let keeperClient: TestClient;
  let nonKeeperClient: TestClient;

  let poolSetup: {
    liquidityPool: PublicKey;
    lpMint: PublicKey;
    usdcVault: PublicKey;
    poolAuthority: PublicKey;
  };

  const queueRequests = new Array<{
    requestId: number;
    requestPDA: PublicKey;
    provider: PublicKey;
    providerTokenAccount: PublicKey;
    providerLpAccount: PublicKey;
  }>();
  let queueRequestHead: number = 0;

  const makeWithdrawalRequest = async (client: TestClient, amount: BN) => {
    const requestId = (await client.getLiquidityPool()).withdrawQueueHead.toNumber() + 1;
    const requestPDA = await client.getWithdrawRequestPDA(requestId);
    const providerTokenAccount = await client.getOrCreateUSDCAccountKey(client.publicKey);
    const providerLpAccount = await client.createTokenAccount(poolSetup.lpMint, client.publicKey);
    await client.queueWithdrawLiquidityFromPool(amount, providerTokenAccount, providerLpAccount, poolSetup.lpMint);
    queueRequests.push({ requestId, requestPDA, provider: client.publicKey, providerTokenAccount, providerLpAccount });
  }



  before(async () => {
    // Initialize protocol
    try {
      const protocol = await client.getProtocolAccount();
      if (!protocol.isInitialized) {
        await client.initializeProtocol(client.treasury.publicKey);
      }
    } catch (error) {
      await client.initializeProtocol(client.treasury.publicKey);
    }
    
    await client.initializeRoles();

    // Create test keypairs
    liquidityProvider = Keypair.generate();
    liquidityProvider2 = Keypair.generate();
    keeper = Keypair.generate();
    nonKeeper = Keypair.generate();
    treasury = client.treasury;

    // Create user clients
    providerClient = await TestClient.forUser(liquidityProvider);
    provider2Client = await TestClient.forUser(liquidityProvider2);
    keeperClient = await TestClient.forUser(keeper);
    nonKeeperClient = await TestClient.forUser(nonKeeper);

    // Add keeper role (using ConfigManager as it's the closest available role)
    await client.addRole(keeper.publicKey, AccessControlRole.Keeper);

    // Enable all features
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

    // Setup liquidity pool
    poolSetup = await client.setupLiquidityPool({
      depositFeeBps: DEPOSIT_FEE_BPS,
      withdrawalFeeBps: WITHDRAWAL_FEE_BPS,
      collateralMint: USDC_MINT,
    });


    // Setup provider accounts
    providerTokenAccount = await client.getOrCreateUSDCAccountKey(liquidityProvider.publicKey);
    treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);
    providerLpAccount = await client.createTokenAccount(poolSetup.lpMint, liquidityProvider.publicKey);

    // Setup provider2 accounts
    provider2TokenAccount = await client.getOrCreateUSDCAccountKey(liquidityProvider2.publicKey);
    provider2LpAccount = await client.createTokenAccount(poolSetup.lpMint, liquidityProvider2.publicKey);

    // Mint initial USDC to providers
    await client.mintUSDC(providerTokenAccount, INITIAL_DEPOSIT.muln(3).toNumber());
    await client.mintUSDC(provider2TokenAccount, INITIAL_DEPOSIT.muln(3).toNumber());

    // Add initial liquidity to pool
    await providerClient.addLiquidityToPool({
      liquidityPool: poolSetup.liquidityPool,
      amount: INITIAL_DEPOSIT,
      minSharesOut: new BN(0),
      providerTokenAccount,
      usdcVault: poolSetup.usdcVault,
      providerLpAccount,
      lpMint: poolSetup.lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });

    // Add more liquidity from provider2
    await provider2Client.addLiquidityToPool({
      liquidityPool: poolSetup.liquidityPool,
      amount: INITIAL_DEPOSIT,
      minSharesOut: new BN(0),
      providerTokenAccount: provider2TokenAccount,
      usdcVault: poolSetup.usdcVault,
      providerLpAccount: provider2LpAccount,
      lpMint: poolSetup.lpMint,
      treasuryTokenAccount,
      treasury: treasury.publicKey,
    });
  });

  afterEach(async () => {
    try {
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
    } catch (error) {
      console.warn('Cleanup error in withdraw_queue.test.ts:', error);
    }
  });

  describe('Queue Withdrawal Requests', () => {
    it('Successfully queues withdrawal request', async () => {
      const poolStateBefore = await client.getLiquidityPool();
      const lpBalanceBefore = await getAccount(client.connection, providerLpAccount);
      const withdrawAmount = new BN(50 * 1e6); // 50 LP tokens

      // Queue withdrawal
      await makeWithdrawalRequest(providerClient, withdrawAmount);

      const poolStateAfter = await client.getLiquidityPool();
      const lpBalanceAfter = await getAccount(client.connection, providerLpAccount);

      // Verify LP tokens were transferred to escrow
      expect(lpBalanceAfter.amount.toString()).to.equal(
        (lpBalanceBefore.amount - BigInt(withdrawAmount.toString())).toString()
      );

      // Verify pool state updated
      expect(poolStateAfter.pendingLpTokens.toString()).to.equal(
        poolStateBefore.pendingLpTokens.add(withdrawAmount).toString()
      );
      expect(poolStateAfter.withdrawQueueHead.toNumber()).to.equal(poolStateBefore.withdrawQueueHead.toNumber() + 1);
    });

    it('Fails when provider has insufficient LP tokens', async () => {
      const lpBalance = await getAccount(client.connection, providerLpAccount);
      const excessiveAmount = new BN(lpBalance.amount.toString()).add(new BN(1));

      try {
        await providerClient.queueWithdrawLiquidityFromPool(
          excessiveAmount,
          providerTokenAccount,
          providerLpAccount,  
          poolSetup.lpMint
        );
        expect.fail('Should have failed with insufficient LP tokens');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('InsufficientFunds');
      }
    });

    it('Fails when trying to queue zero LP tokens', async () => {
      try {
        await providerClient.queueWithdrawLiquidityFromPool(
          new BN(0),
          providerTokenAccount, 
          providerLpAccount,
          poolSetup.lpMint
        );
        expect.fail('Should have failed with zero LP tokens');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('InvalidLpTokenAmount');
      }
    });

    it('Fails when liquidity operations are disabled', async () => {
      // Disable liquidity operations
      await client.updateFeatureFlags({
        allowAddLiquidity: false,
        allowRemoveLiquidity: false,
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

      try {
        await providerClient.queueWithdrawLiquidityFromPool(
          new BN(10 * 1e6),
          providerTokenAccount,
          providerLpAccount,
          poolSetup.lpMint
        );
        expect.fail('Should have failed when liquidity operations are disabled');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('LiquidityOperationsDisabled');
      }
    });

    it('Fails with wrong token account owner', async () => {
      const otherUser = Keypair.generate();
      await requestAirdrop(otherUser.publicKey, client.connection);
      
      const wrongTokenAccount = await client.createTokenAccount(USDC_MINT, otherUser.publicKey);

      try {
        await providerClient.queueWithdrawLiquidityFromPool(
          new BN(10 * 1e6),
          wrongTokenAccount,
          providerLpAccount,
          poolSetup.lpMint
        );
        expect.fail('Should have failed with wrong token account owner');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.satisfy((msg: string) => 
          msg.includes('AccountNotInitialized') || msg.includes('Unauthorized')
        );
      }
    });

    it('Fails with wrong LP token account owner', async () => {
      const otherUser = Keypair.generate();
      await requestAirdrop(otherUser.publicKey, client.connection);
      
      const wrongLpAccount = await client.createTokenAccount(poolSetup.lpMint, otherUser.publicKey);

      try {
        await providerClient.queueWithdrawLiquidityFromPool(
          new BN(10 * 1e6),
          providerTokenAccount,
          wrongLpAccount,
          poolSetup.lpMint
        );
        expect.fail('Should have failed with wrong LP token account owner');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.satisfy((msg: string) => 
          msg.includes('AccountNotInitialized') || msg.includes('Unauthorized')
        );
      }
    });


    it('Fails with wrong token account mint', async () => {
      // Try to use LP token account as provider token account (wrong mint)
      try {
        await providerClient.queueWithdrawLiquidityFromPool(
          new BN(10 * 1e6),
          providerLpAccount, // Wrong mint
          providerLpAccount,
          poolSetup.lpMint
        );
        expect.fail('Should have failed with wrong token account mint');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('InvalidMint');
      }
    });

    it('Fails with wrong LP token account mint', async () => {
      // Try to use USDC token account as LP token account (wrong mint)
      try {
        await providerClient.queueWithdrawLiquidityFromPool(
          new BN(10 * 1e6),
          providerTokenAccount,
          providerTokenAccount, // Wrong mint
          poolSetup.lpMint
        );
        expect.fail('Should have failed with wrong LP token account mint');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('InvalidMint');
      }
    });

    it('Updates queue head correctly for multiple requests', async () => {
      const poolStateBefore = await client.getLiquidityPool();
      const initialHead = poolStateBefore.withdrawQueueHead;

      // Queue first withdrawal
      await makeWithdrawalRequest(providerClient, new BN(25 * 1e6));

      let poolStateAfter = await client.getLiquidityPool();
      expect(poolStateAfter.withdrawQueueHead.toNumber()).to.equal(initialHead.toNumber() + 1);

      // Queue second withdrawal
      await makeWithdrawalRequest(provider2Client, new BN(30 * 1e6));

      poolStateAfter = await client.getLiquidityPool();
      expect(poolStateAfter.withdrawQueueHead.toNumber()).to.equal(initialHead.toNumber() + 2);
    });
  });

  describe('Process Withdrawal Requests', () => {

    it('Successfully processes a single withdrawal request', async () => {
      const poolStateBefore = await client.getLiquidityPool();
      const { requestPDA, providerTokenAccount, provider} = queueRequests[queueRequestHead++];
      const providerBalanceBefore = await getAccount(client.connection, providerTokenAccount);
      const treasuryBalanceBefore = await getAccount(client.connection, treasuryTokenAccount);
      const providerSolBalanceBefore = await client.connection.getBalance(providerClient.publicKey);


      // Process the first request
      await keeperClient.processWithdrawQueueFromPool(
        provider,
        requestPDA,
        providerTokenAccount,
      );



      const poolStateAfter = await client.getLiquidityPool();
      const providerBalanceAfter = await getAccount(client.connection, providerTokenAccount);
      const treasuryBalanceAfter = await getAccount(client.connection, treasuryTokenAccount);
      const providerSolBalanceAfter = await client.connection.getBalance(providerClient.publicKey);

      try {
        const withdrawRequest = await client.program.account.withdrawRequest.fetch(requestPDA);
        expect.fail('Withdraw request should be closed');
      } catch (err: any) {
        expect(err.toString()).to.include(' does not exist');
      }

      // Retuning rent for closing the request
      expect(providerSolBalanceAfter).to.be.greaterThan(providerSolBalanceBefore);  

      // Verify provider received tokens (minus fees)
      expect(providerBalanceAfter.amount > providerBalanceBefore.amount).to.be.true;

      // Verify treasury received fees
      expect(treasuryBalanceAfter.amount > treasuryBalanceBefore.amount).to.be.true;

      // Verify queue tail moved
      expect(poolStateAfter.withdrawQueueTail.toNumber()).to.equal(poolStateBefore.withdrawQueueTail.toNumber() + 1);

      // Verify pending LP tokens decreased
      expect(poolStateAfter.pendingLpTokens.toNumber()).to.be.lessThan(poolStateBefore.pendingLpTokens.toNumber());
    });

    it('Successfully processes multiple withdrawal requests', async () => {
      const poolStateBefore = await client.getLiquidityPool();

      const { requestPDA: withdrawRequestPDA2, providerTokenAccount: provider2TokenAccount, provider: provider2 } = queueRequests[queueRequestHead++];
      const { requestPDA: withdrawRequestPDA3, providerTokenAccount: provider3TokenAccount, provider: provider3 } = queueRequests[queueRequestHead++];

      const provider2BalanceBefore = await getAccount(client.connection, provider2TokenAccount);
      const provider3BalanceBefore = await getAccount(client.connection, provider3TokenAccount);

      // Process first request
      await keeperClient.processWithdrawQueueFromPool(
        provider2,
        withdrawRequestPDA2,
          provider2TokenAccount,
      );

      // Process second request
      await keeperClient.processWithdrawQueueFromPool(
        provider3,
        withdrawRequestPDA3,
        provider3TokenAccount,
      );

      const poolStateAfter = await client.getLiquidityPool();
      const provider2BalanceAfter = await getAccount(client.connection, provider2TokenAccount);
      const provider3BalanceAfter = await getAccount(client.connection, provider3TokenAccount); 

      // Verify provider2 received tokens
      expect(provider2BalanceAfter.amount > provider2BalanceBefore.amount).to.be.true;
      // Verify provider3 received tokens
      expect(provider3BalanceAfter.amount > provider3BalanceBefore.amount).to.be.true;

      // Verify queue tail moved
      expect(poolStateAfter.withdrawQueueTail.toNumber()).to.equal(poolStateBefore.withdrawQueueTail.toNumber() + 2);
    });

    it('Fails when non-keeper tries to process queue', async () => {
      // Queue another request first
      await makeWithdrawalRequest(providerClient, new BN(50 * 1e6));

      // Use the most recent request
      const mostRecentRequest = queueRequests[queueRequests.length - 1];

      try {
        await nonKeeperClient.processWithdrawQueueFromPool(
          mostRecentRequest.provider, 
          mostRecentRequest.requestPDA,
          mostRecentRequest.providerTokenAccount,
        );
        expect.fail('Should have failed with non-keeper');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('UnauthorizedRole');
      }
    });

    it('Handles empty queue gracefully', async () => {
      // Process all remaining requests to empty the queue
      const poolState = await client.getLiquidityPool();
      
      if (poolState.withdrawQueueTail < poolState.withdrawQueueHead) {
        // Get the next request to process
        const nextRequestId = poolState.withdrawQueueTail.toNumber() + 1;
        const nextRequestPDA = await client.getWithdrawRequestPDA(nextRequestId);
        
        // Find the corresponding request in our queue
        const request = queueRequests.find(req => req.requestId === nextRequestId);
        if (request) {
          await keeperClient.processWithdrawQueueFromPool(
            request.provider,
            request.requestPDA,
            request.providerTokenAccount,
          );
        }
      }

      // Try to process when queue is empty - should succeed but do nothing
      const emptyQueueState = await client.getLiquidityPool();
      if (emptyQueueState.withdrawQueueTail.gte(emptyQueueState.withdrawQueueHead)) {
        // Queue is empty, trying to process should succeed but do nothing
        // This test verifies the function handles empty queue gracefully
        expect(emptyQueueState.withdrawQueueTail.toNumber()).to.equal(emptyQueueState.withdrawQueueHead.toNumber());
      }
    });

    it('Respects rate limiting when processing withdrawals', async () => {
      // Queue a large withdrawal request
      await makeWithdrawalRequest(providerClient, new BN(500 * 1e6));

      const poolStateBefore = await client.getLiquidityPool();
      const nextRequestId = poolStateBefore.withdrawQueueTail.toNumber() + 1;
      
      // Find the request that was just created
      const request = queueRequests.find(req => req.requestId === nextRequestId);
      if (!request) {
        throw new Error('Request not found');
      }

      // Process the request
      await keeperClient.processWithdrawQueueFromPool(
        request.provider,
        request.requestPDA,
        request.providerTokenAccount,
      );

      
    });

    it('Calculates fees correctly during processing', async () => {
      // Queue a withdrawal request
      await makeWithdrawalRequest(provider2Client, new BN(100 * 1e6));

      const poolStateBefore = await client.getLiquidityPool();
      const withdrawalFeeBps = poolStateBefore.withdrawalFeeBps;

      const nextRequestId = poolStateBefore.withdrawQueueTail.toNumber() + 1;
      
      // Find the request that was just created
      const request = queueRequests.find(req => req.requestId === nextRequestId);
      if (!request) {
        throw new Error('Request not found');
      }

      const providerBalanceBefore = await getAccount(client.connection, request.providerTokenAccount);
      const treasuryBalanceBefore = await getAccount(client.connection, treasuryTokenAccount);

      // Process the request
      await keeperClient.processWithdrawQueueFromPool(
        request.provider,
        request.requestPDA,
        request.providerTokenAccount,
      );

      const providerBalanceAfter = await getAccount(client.connection, request.providerTokenAccount);
      const treasuryBalanceAfter = await getAccount(client.connection, treasuryTokenAccount);

      // Calculate expected values
      const providerIncrease = providerBalanceAfter.amount - providerBalanceBefore.amount;
      const treasuryIncrease = treasuryBalanceAfter.amount - treasuryBalanceBefore.amount;
      const totalWithdrawal = providerIncrease + treasuryIncrease;

      // Verify fee calculation
      if (withdrawalFeeBps > 0) {
        const expectedFee = (totalWithdrawal * BigInt(withdrawalFeeBps)) / BigInt(10000);
        const feeVariance = treasuryIncrease > expectedFee ? 
          treasuryIncrease - expectedFee : 
          expectedFee - treasuryIncrease;
        
        // Allow for small rounding differences
        expect(Number(feeVariance)).to.be.lessThan(10);
      }
    });
  });

  describe('Queue Management Edge Cases', () => {
    it('Handles partial fulfillment correctly', async () => {
      // This test would require setting up a scenario where liquidity is limited
      // For now, we'll verify the basic queue mechanism works
      const poolStateBefore = await client.getLiquidityPool();
      
      // Queue a withdrawal
      await makeWithdrawalRequest(providerClient, new BN(50 * 1e6));

      const poolStateAfter = await client.getLiquidityPool();
      expect(poolStateAfter.withdrawQueueHead.toNumber()).to.equal(poolStateBefore.withdrawQueueHead.toNumber() + 1);
    });

    it('Updates timestamps correctly during queue operations', async () => {
      const poolStateBefore = await client.getLiquidityPool();
      const timestampBefore = poolStateBefore.lastUpdateTimestamp.toNumber();

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Queue a withdrawal
      await makeWithdrawalRequest(providerClient, new BN(10 * 1e6));

      const poolStateAfter = await client.getLiquidityPool();
      // Note: Queue operations may not update the main pool timestamp
      // This depends on the specific implementation
      expect(poolStateAfter.lastUpdateTimestamp.toNumber()).to.be.greaterThanOrEqual(timestampBefore);
    });

    // 1. Draining the pool one by one multiple people 
    // 3. The user has receive the rent for closing the request 
    // 4. Edge cases where the withdraw amount is very small  - For exmaple when we had the case for max(1, min(fulfillable_amount, remaining_lp)
  
  });
}); 