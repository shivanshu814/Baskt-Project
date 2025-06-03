import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient, requestAirdrop } from './test-client';
import { AccessControlRole } from '@baskt/types';
import BN from 'bn.js';
import { initializeProtocolRegistry } from './protocol_setup';

// Global test accounts that persist across test files
let globalTestAccounts: {
  treasury?: Keypair;
  matcher?: Keypair;
  liquidator?: Keypair;
  fundingManager?: Keypair;
  initialized: boolean;
} = {
  initialized: false
};

/**
 * Get or create global test accounts
 * This ensures we use the same accounts across all tests to avoid exceeding role limits
 */
export async function getGlobalTestAccounts() {
  if (!globalTestAccounts.initialized) {
    globalTestAccounts.treasury = Keypair.generate();
    globalTestAccounts.matcher = Keypair.generate();
    globalTestAccounts.liquidator = Keypair.generate();
    globalTestAccounts.fundingManager = Keypair.generate();
    globalTestAccounts.initialized = true;
  }
  
  return {
    treasury: globalTestAccounts.treasury!,
    matcher: globalTestAccounts.matcher!,
    liquidator: globalTestAccounts.liquidator!,
    fundingManager: globalTestAccounts.fundingManager!
  };
}

/**
 * Initialize protocol and roles if not already done
 * This prevents duplicate role assignments
 */
export async function initializeProtocolAndRoles(client: TestClient) {
  // Check if protocol is initialized
  let protocolInitialized = false;
  try {
    await client.getProtocolAccount();
    protocolInitialized = true;
  } catch (error) {
    // Protocol not initialized
  }

  if (!protocolInitialized) {
    await client.initializeProtocol();
  }

  // Initialize TestClient roles (AssetManager, OracleManager)
  await client.initializeRoles();

  // Get global test accounts
  const { treasury, matcher, liquidator, fundingManager } = await getGlobalTestAccounts();

  // Fund accounts if needed
  const accounts = [treasury, matcher, liquidator, fundingManager];
  for (const account of accounts) {
    try {
      const balance = await client.connection.getBalance(account.publicKey);
      if (balance < 1000000) { // Less than 0.001 SOL
        await requestAirdrop(account.publicKey, client.connection);
      }
    } catch (error) {
      await requestAirdrop(account.publicKey, client.connection);
    }
  }

  // Add roles only if they don't exist
  const rolesToAdd = [
    { account: treasury.publicKey, role: AccessControlRole.Treasury },
    { account: matcher.publicKey, role: AccessControlRole.Matcher },
    { account: liquidator.publicKey, role: AccessControlRole.Liquidator },
    { account: fundingManager.publicKey, role: AccessControlRole.FundingManager },
  ];

  // Get current protocol state to check entry count
  let protocolAccount;
  try {
    protocolAccount = await client.getProtocolAccount();
    const entryCount = protocolAccount.accessControl.entries.length;
    // console.log(`Current protocol access control entries: ${entryCount}/20`);
    
    if (entryCount >= 18) {
      // console.warn(`WARNING: Protocol is near capacity (${entryCount}/20 entries). Tests may fail.`);
    }
  } catch (error) {
    console.error("Failed to fetch protocol account:", error);
  }

  for (const { account, role } of rolesToAdd) {
    try {
      const hasRole = await client.hasRole(account, role);
      if (!hasRole) {
        console.log(`Adding role ${role} to ${account.toString()}`);
        await client.addRole(account, role);
        
        // Verify role was added
        const roleAdded = await client.hasRole(account, role);
        if (!roleAdded) {
          throw new Error(`Failed to add role ${role} to ${account.toString()}`);
        }
      }
    } catch (error: any) {
      // Check if it's the serialization error
      if (error.toString().includes('AccountDidNotSerialize') || 
          error.toString().includes('0xbbc')) {
        throw new Error(`Protocol account is full (20 entry limit reached). Please restart the test validator.`);
      }
      
      // If hasRole fails for another reason, try to add the role
      try {
        console.log(`Attempting to add role ${role} to ${account.toString()} after error`);
        await client.addRole(account, role);
      } catch (addError: any) {
        console.error(`ERROR: Could not add role ${role} to ${account.toString()}: ${addError}`);
        if (addError.toString().includes('AccountDidNotSerialize') || 
            addError.toString().includes('0xbbc')) {
          throw new Error(`Protocol account is full (20 entry limit reached). Please restart the test validator.`);
        }
        throw addError;
      }
    }
  }

  return { treasury, matcher, liquidator, fundingManager };
}

/**
 * Standard test setup for liquidity pool tests
 */
export async function setupLiquidityPoolTest(params: {
  client: TestClient;
  initialLiquidity?: BN;
  depositFeeBps?: number;
  withdrawalFeeBps?: number;
  minDeposit?: BN;
}) {
  const {
    client,
    initialLiquidity = new BN(1000_000_000), // 1000 USDC default
    depositFeeBps = 0,
    withdrawalFeeBps = 0,
    minDeposit = new BN(0)
  } = params;

  const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

  // Initialize protocol and roles
  const { treasury } = await initializeProtocolAndRoles(client);

  // Create a provider for liquidity
  const provider = Keypair.generate();
  await requestAirdrop(provider.publicKey, client.connection);
  const providerClient = await TestClient.forUser(provider);

  // Create token accounts
  const providerTokenAccount = await client.getOrCreateUSDCAccount(provider.publicKey);
  const treasuryTokenAccount = await client.getOrCreateUSDCAccount(treasury.publicKey);

  // Mint USDC to provider
  await client.mintUSDC(providerTokenAccount, initialLiquidity.muln(2));

  // Setup liquidity pool
  const poolSetup = await client.setupLiquidityPool({
    depositFeeBps,
    withdrawalFeeBps,
    minDeposit,
    collateralMint: USDC_MINT
  });

  // Initialize protocol registry after liquidity pool
  const registry = await initializeProtocolRegistry(client);

  return {
    ...poolSetup,
    provider,
    providerClient,
    providerTokenAccount,
    treasury,
    treasuryTokenAccount,
    collateralMint: USDC_MINT,
    registry
  };
}