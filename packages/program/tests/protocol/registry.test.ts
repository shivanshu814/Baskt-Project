import { expect } from 'chai';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { initializeProtocolWithRegistry, getProtocolRegistry } from '../utils/protocol_setup';
import { getGlobalTestAccounts } from '../utils/test-setup';
import BN from 'bn.js';

describe('Protocol Registry', () => {
  let client: TestClient;
  let registry: PublicKey;

  before(async () => {
    client = TestClient.getInstance();
  });

  it('should initialize protocol registry with all required addresses', async () => {
    // Initialize protocol, liquidity pool, and registry
    const setup = await initializeProtocolWithRegistry(client, {
      depositFeeBps: 0,
      withdrawalFeeBps: 0,
      minDeposit: new BN(0),
    });

    registry = setup.registry;

    // Fetch and verify registry data
    const registryAccount = await getProtocolRegistry(client);
    
    expect(registryAccount).to.not.be.null;
    expect(registryAccount.protocol.toString()).to.equal(setup.protocol.toString());
    expect(registryAccount.liquidityPool.toString()).to.equal(setup.liquidityPool.toString());
    
    // Verify PDAs are stored correctly
    const [expectedProgramAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      client.program.programId
    );
    expect(registryAccount.programAuthority.toString()).to.equal(expectedProgramAuthority.toString());

    const [expectedPoolAuthority] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('pool_authority'),
        setup.liquidityPool.toBuffer(),
        setup.protocol.toBuffer(),
      ],
      client.program.programId
    );
    expect(registryAccount.poolAuthority.toString()).to.equal(expectedPoolAuthority.toString());

    // Verify USDC mint
    const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    expect(registryAccount.escrowMint.toString()).to.equal(usdcMint.toString());

    // Verify bumps are stored
    expect(registryAccount.programAuthorityBump).to.be.greaterThan(0);
    expect(registryAccount.poolAuthorityBump).to.be.greaterThan(0);
    expect(registryAccount.bump).to.be.greaterThan(0);
  });

  it('should not allow re-initialization of registry', async () => {
    // Get the accounts we used for the first initialization
    const { treasury } = await getGlobalTestAccounts();
    const treasuryTokenAccount = await client.getOrCreateUSDCAccount(treasury.publicKey);
    const liquidityPool = await client.findLiquidityPoolPDA();
    const poolAccount = await client.program.account.liquidityPool.fetch(liquidityPool);
    const tokenVault = poolAccount.tokenVault;
    const [protocolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('protocol')],
      client.program.programId
    );
    const [poolAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_authority'), liquidityPool.toBuffer(), protocolPDA.toBuffer()],
      client.program.programId
    );
    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      client.program.programId
    );
    const escrowMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

    try {
      // Try to initialize registry again with valid accounts
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

      expect.fail('Should have thrown an error');
    } catch (error: any) {
      // The error will be about the account already being initialized
      expect(error.toString()).to.satisfy((str: string) => {
        return str.includes('already in use') || 
               str.includes('already been initialized') ||
               str.includes('account is already initialized');
      });
    }
  });
});