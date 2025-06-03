import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TestClient } from './test-client';
import { getGlobalTestAccounts } from './test-setup';
import { AccessControlRole } from '@baskt/types';
import BN from 'bn.js';

/**
 * Initialize the protocol registry with all required addresses
 * This must be called after the protocol and liquidity pool are initialized
 * @param client TestClient instance
 * @returns Registry public key
 */
export async function initializeProtocolRegistry(client: TestClient): Promise<PublicKey> {
  // Get protocol PDA
  const [protocolPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    client.program.programId
  );

  // Get or create test accounts
  const { treasury } = await getGlobalTestAccounts();
  
  // Ensure treasury has the Treasury role
  try {
    const hasRole = await client.hasRole(treasury.publicKey, AccessControlRole.Treasury);
    if (!hasRole) {
      console.log('Adding Treasury role for registry initialization');
      await client.addRole(treasury.publicKey, AccessControlRole.Treasury);
    }
  } catch (error) {
    // If hasRole fails, try to add the role anyway
    console.log('Adding Treasury role for registry initialization (after error)');
    await client.addRole(treasury.publicKey, AccessControlRole.Treasury);
  }

  // Get liquidity pool and related PDAs
  const liquidityPool = await client.findLiquidityPoolPDA();
  
  // Check if liquidity pool exists
  let poolAccount;
  try {
    poolAccount = await client.program.account.liquidityPool.fetch(liquidityPool);
  } catch (error) {
    throw new Error('Liquidity pool must be initialized before registry. Call setupLiquidityPool first.');
  }

  // Get token vault from pool
  const tokenVault = poolAccount.tokenVault;

  // Derive pool authority PDA
  const [poolAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool_authority'), liquidityPool.toBuffer(), protocolPDA.toBuffer()],
    client.program.programId
  );

  // Derive program authority PDA
  const [programAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('authority')],
    client.program.programId
  );

  // Derive registry PDA
  const [registry] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol_registry')],
    client.program.programId
  );

  // Get treasury token account
  const treasuryTokenAccount = await client.getOrCreateUSDCAccount(treasury.publicKey);

  // USDC mint
  const escrowMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

  // Initialize registry
  try {
    await client.program.methods
      .initializeRegistry()
      .accounts({
        owner: client.getPublicKey(),
        protocol: protocolPDA,
        registry: registry,
        treasury: treasury.publicKey,
        treasuryToken: treasuryTokenAccount,
        liquidityPool: liquidityPool,
        tokenVault: tokenVault,
        poolAuthority: poolAuthority,
        programAuthority: programAuthority,
        escrowMint: escrowMint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('Protocol registry initialized successfully');
  } catch (error: any) {
    // Check if registry already exists
    if (error.toString().includes('already in use')) {
      // console.log('Registry already initialized');
    } else {
      throw error;
    }
  }

  return registry;
}

/**
 * Get the protocol registry account
 * @param client TestClient instance
 * @returns Registry account data or null if not initialized
 */
export async function getProtocolRegistry(client: TestClient): Promise<any | null> {
  const [registry] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol_registry')],
    client.program.programId
  );

  try {
    return await client.program.account.protocolRegistry.fetch(registry);
  } catch (error) {
    return null;
  }
}

/**
 * Check if the protocol registry is initialized
 * @param client TestClient instance
 * @returns True if registry is initialized
 */
export async function isRegistryInitialized(client: TestClient): Promise<boolean> {
  const registry = await getProtocolRegistry(client);
  return registry !== null;
}

/**
 * Initialize protocol with registry in one step
 * This is a convenience function that initializes both protocol and registry
 * @param client TestClient instance
 * @param liquidityPoolSetup Optional liquidity pool setup params
 * @returns Protocol and registry public keys
 */
export async function initializeProtocolWithRegistry(
  client: TestClient,
  liquidityPoolSetup?: {
    depositFeeBps: number;
    withdrawalFeeBps: number;
    minDeposit: BN;
  }
): Promise<{
  protocol: PublicKey;
  registry: PublicKey;
  liquidityPool: PublicKey;
}> {
  // Initialize protocol if needed
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

  // Initialize roles
  await client.initializeRoles();

  // Setup liquidity pool with default params if not provided
  const poolParams = liquidityPoolSetup || {
    depositFeeBps: 0,
    withdrawalFeeBps: 0,
    minDeposit: new BN(0),
  };

  const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const { liquidityPool } = await client.setupLiquidityPool({
    ...poolParams,
    collateralMint,
  });

  // Initialize registry
  const registry = await initializeProtocolRegistry(client);

  const [protocol] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    client.program.programId
  );

  return {
    protocol,
    registry,
    liquidityPool,
  };
}