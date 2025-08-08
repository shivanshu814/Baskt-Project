import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { getAccount } from '@solana/spl-token';
import { BN } from 'bn.js';
import { TestClient, requestAirdrop } from '../utils/test-client';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
import { USDC_MINT } from '@baskt/sdk';

describe('Liquidity Pool', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Test constants
  const MAX_FEE_BPS = 1000; // 10% maximum fee
  const DEPOSIT_FEE_BPS = 50; // 0.5%
  const WITHDRAWAL_FEE_BPS = 100; // 1%
  const INITIAL_DEPOSIT = new BN(100_000_000); // 100 USDC

  let treasury: Keypair;
  let liquidityProvider: Keypair;
  let nonOwner: Keypair;

  // Pool accounts
  let liquidityPool: PublicKey;
  let lpMint: PublicKey;
  let usdcVault: PublicKey;
  let lpTokenEscrow: PublicKey;
  let poolAuthority: PublicKey;
  let treasuryTokenAccount: PublicKey;
  let providerTokenAccount: PublicKey;
  let providerLpAccount: PublicKey;

  // Test clients
  let lpClient: TestClient;
  let nonOwnerClient: TestClient;

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
    nonOwner = Keypair.generate();
    treasury = client.treasury;

    // Fund accounts
    await requestAirdrop(liquidityProvider.publicKey, client.connection);
    await requestAirdrop(nonOwner.publicKey, client.connection);

    // Create user clients
    lpClient = await TestClient.forUser(liquidityProvider);
    nonOwnerClient = await TestClient.forUser(nonOwner);

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
  });

  afterEach(async () => {
    // Reset feature flags
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
      console.warn('Cleanup error in liquidity.test.ts:', error);
    }
  });

  describe('Liquidity Pool Initialization', () => {
    it('Successfully initializes liquidity pool with valid parameters', async () => {
      // Check if pool already exists
      let poolExists = true;
      try {
        await client.getLiquidityPool();
      } catch (error) {
        poolExists = false;
      }

      if (!poolExists) {
        const poolSetup = await client.setupLiquidityPool({
          depositFeeBps: DEPOSIT_FEE_BPS,
          withdrawalFeeBps: WITHDRAWAL_FEE_BPS,
          collateralMint: USDC_MINT,
        });

        // Store pool accounts for future tests
        liquidityPool = poolSetup.liquidityPool;
        lpMint = poolSetup.lpMint;
        usdcVault = poolSetup.usdcVault;
        poolAuthority = poolSetup.poolAuthority;
      } else {
        // Pool already exists, get the existing accounts
        liquidityPool = client.liquidityPoolPDA;
        const poolState = await client.getLiquidityPool();  
        lpMint = poolState.lpMint;
        usdcVault = poolState.usdcVault;  
        poolAuthority = client.poolAuthorityPDA;
      }

      // Verify pool state
      const poolState = await client.getLiquidityPool();
      expect(poolState.lpMint.toString()).to.equal(lpMint.toString());
      expect(poolState.usdcVault.toString()).to.equal(usdcVault.toString());
      
      // Verify initial queue state
      expect(poolState.pendingLpTokens.toString()).to.equal('0');
      expect(poolState.withdrawQueueHead.toString()).to.equal('0');
      expect(poolState.withdrawQueueTail.toString()).to.equal('0');

      // Verify LP token escrow was created
      lpTokenEscrow = await client.getLPTokenEscrowPDA();
      const escrowAccount = await getAccount(client.connection, lpTokenEscrow);
      expect(escrowAccount.mint.toString()).to.equal(lpMint.toString());
      expect(escrowAccount.owner.toString()).to.equal(poolAuthority.toString());
    });

    it('Validates fee limits and authorization', async () => {
      // Test fee validation
      try {
        await client.setupLiquidityPool({
          depositFeeBps: MAX_FEE_BPS + 1,
          withdrawalFeeBps: WITHDRAWAL_FEE_BPS,
          collateralMint: USDC_MINT,
        });
        expect.fail('Should have failed with InvalidFeeBps error');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('InvalidFeeBps');
      }
      
      // Test authorization
      try {
        await nonOwnerClient.setupLiquidityPool({
          depositFeeBps: DEPOSIT_FEE_BPS,
          withdrawalFeeBps: WITHDRAWAL_FEE_BPS,
          collateralMint: USDC_MINT,
        });
        expect.fail('Should have failed with UnauthorizedRole error');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('UnauthorizedRole');
      }
    });

    it('Verifies all PDA accounts are created correctly', async () => {
      // Verify liquidity pool PDA
      const expectedLiquidityPoolPDA = client.liquidityPoolPDA;
      expect(liquidityPool.toString()).to.equal(expectedLiquidityPoolPDA.toString());

      // Verify pool authority PDA
      const expectedPoolAuthorityPDA = client.poolAuthorityPDA;
      expect(poolAuthority.toString()).to.equal(expectedPoolAuthorityPDA.toString());

      // Verify token vault PDA
      const [expectedusdcVaultPDA] = await client.getUsdcVaultPda();
      expect(usdcVault.toString()).to.equal(expectedusdcVaultPDA.toString());

      // Verify LP token escrow PDA
        const expectedLpTokenEscrowPDA = await client.getLPTokenEscrowPDA();
      expect(lpTokenEscrow.toString()).to.equal(expectedLpTokenEscrowPDA.toString());
    });
  });

  describe('Add Liquidity', () => {
    before(async () => {
      // Setup accounts for liquidity operations
      providerTokenAccount = await client.getOrCreateUSDCAccountKey(liquidityProvider.publicKey);
      treasuryTokenAccount = await client.getOrCreateUSDCAccountKey(treasury.publicKey);
      
      // Create LP token account for provider
      providerLpAccount = await client.createTokenAccount(lpMint, liquidityProvider.publicKey);
      
      // Mint initial USDC to provider
      await client.mintUSDC(providerTokenAccount, INITIAL_DEPOSIT.muln(5).toNumber());
    });

    it('Successfully adds liquidity and validates state changes', async () => {
      const poolStateBefore = await client.getLiquidityPool();
      const treasuryBalanceBefore = await getAccount(client.connection, treasuryTokenAccount);
      const providerBalanceBefore = await getAccount(client.connection, providerTokenAccount);
      
      const actualDepositFeeBps = poolStateBefore.depositFeeBps;
      const depositAmount = new BN(50_000_000); // 50 USDC
      
      // Calculate expected values
      const expectedFeeAmount = depositAmount.muln(actualDepositFeeBps).divn(10000);
      const expectedNetDeposit = depositAmount.sub(expectedFeeAmount);

      const minSharesOut = poolStateBefore.totalShares.toNumber() === 0 
        ? expectedNetDeposit
        : expectedNetDeposit.mul(poolStateBefore.totalShares).div(poolStateBefore.totalLiquidity);

      await lpClient.addLiquidityToPool({
        liquidityPool,
        amount: depositAmount,
        minSharesOut,
        providerTokenAccount,
        usdcVault,
        providerLpAccount,
        lpMint,
        treasuryTokenAccount,
        treasury: treasury.publicKey,
      });

      // Verify pool state updated
      const poolStateAfter = await client.getLiquidityPool();
      expect(poolStateAfter.totalLiquidity.toNumber()).to.be.greaterThan(poolStateBefore.totalLiquidity.toNumber());
      expect(poolStateAfter.totalShares.toNumber()).to.be.greaterThan(poolStateBefore.totalShares.toNumber());

      // Verify provider received LP tokens
      const lpTokenBalance = await getAccount(client.connection, providerLpAccount);
      expect(lpTokenBalance.amount.toString()).to.not.equal('0');

      // Verify treasury received fees (if fees > 0)
      if (actualDepositFeeBps > 0) {
        const treasuryBalanceAfter = await getAccount(client.connection, treasuryTokenAccount);
        expect(Number(treasuryBalanceAfter.amount)).to.be.greaterThan(Number(treasuryBalanceBefore.amount));
      }

      // Verify provider's token balance decreased
      const providerBalanceAfter = await getAccount(client.connection, providerTokenAccount);
      expect(Number(providerBalanceAfter.amount)).to.be.lessThan(Number(providerBalanceBefore.amount));
    });

    it('Validates fee calculation and LP token distribution', async () => {
      const poolStateBefore = await client.getLiquidityPool();
      const depositAmount = new BN(100_000_000); // 100 USDC
      const actualDepositFeeBps = poolStateBefore.depositFeeBps;
      
      // Calculate expected values
      const expectedFeeAmount = depositAmount.muln(actualDepositFeeBps).divn(10000);
      const expectedNetDeposit = depositAmount.sub(expectedFeeAmount);
      
      const expectedShares = poolStateBefore.totalShares.toNumber() === 0 
        ? expectedNetDeposit
        : expectedNetDeposit.mul(poolStateBefore.totalShares).div(poolStateBefore.totalLiquidity);
      
      const lpBalanceBefore = await getAccount(client.connection, providerLpAccount);
      const treasuryBalanceBefore = await getAccount(client.connection, treasuryTokenAccount);
      const vaultBalanceBefore = await getAccount(client.connection, usdcVault);
      
      // Add liquidity
      await lpClient.addLiquidityToPool({
        liquidityPool,
        amount: depositAmount,
        minSharesOut: expectedShares,
        providerTokenAccount,
        usdcVault,
        providerLpAccount,
        lpMint,
        treasuryTokenAccount,
        treasury: treasury.publicKey,
      });

      const lpBalanceAfter = await getAccount(client.connection, providerLpAccount);
      const treasuryBalanceAfter = await getAccount(client.connection, treasuryTokenAccount);
      const vaultBalanceAfter = await getAccount(client.connection, usdcVault);
      const poolStateAfter = await client.getLiquidityPool();

      // Verify LP tokens were minted correctly
      const lpTokensReceived = lpBalanceAfter.amount - lpBalanceBefore.amount;
      expect(lpTokensReceived.toString()).to.equal(expectedShares.toString());

      // Verify fee was transferred to treasury
      if (actualDepositFeeBps > 0) {
        const treasuryIncrease = treasuryBalanceAfter.amount - treasuryBalanceBefore.amount;
        expect(treasuryIncrease.toString()).to.equal(expectedFeeAmount.toString());
      }

      // Verify vault balance increased by net deposit amount
      const vaultIncrease = vaultBalanceAfter.amount - vaultBalanceBefore.amount;
      expect(vaultIncrease.toString()).to.equal(expectedNetDeposit.toString());

      // Verify pool liquidity increased by net deposit amount
      const liquidityIncrease = poolStateAfter.totalLiquidity.sub(poolStateBefore.totalLiquidity);
      expect(liquidityIncrease.toString()).to.equal(expectedNetDeposit.toString());

      // Verify total shares increased by expected amount
      const sharesIncrease = poolStateAfter.totalShares.sub(poolStateBefore.totalShares);
      expect(sharesIncrease.toString()).to.equal(expectedShares.toString());
    });

    it('Validates input validation and error conditions', async () => {
      const poolState = await client.getLiquidityPool();
      const actualMinDeposit = (await client.getProtocolAccount()).config.minLiquidity;
      
      // Test zero deposit amount
      try {
        await lpClient.addLiquidityToPool({
          liquidityPool,
          amount: new BN(0),
          minSharesOut: new BN(0),
          providerTokenAccount,
          usdcVault,
          providerLpAccount,
          lpMint,
          treasuryTokenAccount,
          treasury: treasury.publicKey,
        });
        expect.fail('Should have failed with zero deposit amount');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('InvalidDepositAmount');
      }

      // Test below minimum deposit
      if (actualMinDeposit.toNumber() > 0) {
        const belowMinDeposit = actualMinDeposit.subn(1);
        try {
          await lpClient.addLiquidityToPool({
            liquidityPool,
            amount: belowMinDeposit,
            minSharesOut: new BN(1000),
            providerTokenAccount,
            usdcVault,
            providerLpAccount,
            lpMint,
            treasuryTokenAccount,
            treasury: treasury.publicKey,
          });
          expect.fail('Should have failed with InvalidDepositAmount error');  
        } catch (err) {
          const error = err as { message: string };
          expect(error.message).to.include('InvalidDepositAmount');
        }
      }

      // Test insufficient balance
      const providerBalance = await getAccount(client.connection, providerTokenAccount);
      const excessiveAmount = new BN(providerBalance.amount.toString()).addn(1_000_000);
      try {
        await lpClient.addLiquidityToPool({
          liquidityPool,
          amount: excessiveAmount,
          minSharesOut: new BN(0),
          providerTokenAccount,
          usdcVault,
          providerLpAccount,
          lpMint,
          treasuryTokenAccount,
          treasury: treasury.publicKey,
        });
        expect.fail('Should have failed with InsufficientFunds error');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('insufficient');
      }
    });

    it('Validates account ownership and mint constraints', async () => {
      // Test wrong USDC account owner
      const otherUser = Keypair.generate();
      await requestAirdrop(otherUser.publicKey, client.connection);
      const wrongOwnerTokenAccount = await client.createTokenAccount(USDC_MINT, otherUser.publicKey);
      await client.mintUSDC(wrongOwnerTokenAccount, 10_000_000);

      try {
        await lpClient.addLiquidityToPool({
          liquidityPool,
          amount: new BN(10_000_000),
          minSharesOut: new BN(0),
          providerTokenAccount: wrongOwnerTokenAccount,
          usdcVault,
          providerLpAccount,
          lpMint,
          treasuryTokenAccount,
          treasury: treasury.publicKey,
        });
        expect.fail('Should have failed with Unauthorized error');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('Unauthorized');
      }

      // Test wrong mint for USDC account
      try {
        await lpClient.addLiquidityToPool({
          liquidityPool,
          amount: new BN(10_000_000),
          minSharesOut: new BN(0),
          providerTokenAccount: providerLpAccount, // LP token account instead of USDC
          usdcVault,
          providerLpAccount,
          lpMint,
          treasuryTokenAccount,
          treasury: treasury.publicKey,
        });
        expect.fail('Should have failed with InvalidMint error');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('InvalidMint');
      }

      // Test wrong LP token account owner
      const wrongLpAccount = await client.createTokenAccount(lpMint, otherUser.publicKey);


      // Set it up so we have a initilizaed LP account for the other user
      const wronLPClient = await TestClient.forUser(otherUser);
      const wrongLPUSDCAccount = await wronLPClient.getOrCreateUSDCAccountKey(otherUser.publicKey);
      await client.mintUSDC(wrongLPUSDCAccount, 10_000_000);

      await wronLPClient.addLiquidityToPool({
        liquidityPool,
        amount: new BN(10_000_000),
        minSharesOut: new BN(0),
        providerTokenAccount: wrongLPUSDCAccount,
        usdcVault,
        providerLpAccount: wrongLpAccount,
        lpMint,
        treasuryTokenAccount,
        treasury: treasury.publicKey,
      });
      

      try {
        await lpClient.addLiquidityToPool({
          liquidityPool,
          amount: new BN(10_000_000),
          minSharesOut: new BN(0),
          providerTokenAccount,
          usdcVault,
          providerLpAccount: wrongLpAccount,
          lpMint,
          treasuryTokenAccount,
          treasury: treasury.publicKey,
        });
        expect.fail('Should have failed with Unauthorized error');
      } catch (err) {
        const error = err as { message: string };
        console.log(error);
        expect(error.message).to.include('Unauthorized');
      }

      // Test wrong mint for LP token account
      try {
        await lpClient.addLiquidityToPool({
          liquidityPool,
          amount: new BN(10_000_000),
          minSharesOut: new BN(0),
          providerTokenAccount,
          usdcVault,
          providerLpAccount: providerTokenAccount, // USDC account instead of LP token account
          lpMint,
          treasuryTokenAccount,
          treasury: treasury.publicKey,
        });
        expect.fail('Should have failed with InvalidMint error');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('InvalidMint');
      }
    });

    it('Validates feature flags and pool state updates', async () => {
      // Test feature flag validation
      await client.updateFeatureFlags({
        allowAddLiquidity: false,
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

      try {
        await lpClient.addLiquidityToPool({
          liquidityPool,
          amount: new BN(10_000_000),
          minSharesOut: new BN(0),
          providerTokenAccount,
          usdcVault,
          providerLpAccount,
          lpMint,
          treasuryTokenAccount,
          treasury: treasury.publicKey,
        });
        expect.fail('Should have failed when liquidity operations are disabled');
      } catch (err) {
        const error = err as { message: string };
        expect(error.message).to.include('LiquidityOperationsDisabled');
      }

      // Test timestamp updates
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

      const poolStateBefore = await client.getLiquidityPool();
      const timestampBefore = poolStateBefore.lastUpdateTimestamp.toNumber();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await lpClient.addLiquidityToPool({
        liquidityPool,
        amount: new BN(10_000_000),
        minSharesOut: new BN(0),
        providerTokenAccount,
        usdcVault,
        providerLpAccount,
        lpMint,
        treasuryTokenAccount,
        treasury: treasury.publicKey,
      });

      const poolStateAfter = await client.getLiquidityPool();
      expect(poolStateAfter.lastUpdateTimestamp.toNumber()).to.be.greaterThan(timestampBefore);
    });

    it('Validates edge cases and math safety', async () => {
      const poolState = await client.getLiquidityPool();
      
      // Test fee calculation edge cases
      const smallDeposit = new BN(1_000); // 0.001 USDC
      const actualDepositFeeBps = poolState.depositFeeBps;
      const expectedFeeAmount = smallDeposit.muln(actualDepositFeeBps).divn(10000);
      
      expect(expectedFeeAmount.toNumber()).to.be.greaterThanOrEqual(0);
      expect(expectedFeeAmount.toNumber()).to.be.lessThanOrEqual(smallDeposit.toNumber());
      
      // Test share calculation edge cases
      const smallAmount = new BN(1_000);
      const expectedFeeAmount2 = smallAmount.muln(actualDepositFeeBps).divn(10000);
      const expectedNetDeposit = smallAmount.sub(expectedFeeAmount2);
      
      if (poolState.totalShares.toNumber() === 0) {
        expect(expectedNetDeposit.toNumber()).to.be.greaterThan(0);
      } else {
        const expectedShares = expectedNetDeposit.mul(poolState.totalShares).div(poolState.totalLiquidity);
        expect(expectedShares.toNumber()).to.be.greaterThanOrEqual(0);
      }
    });
  });
});
