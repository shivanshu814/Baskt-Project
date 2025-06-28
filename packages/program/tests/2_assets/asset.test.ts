import { expect } from 'chai';
import { describe, it, before, afterEach } from 'mocha';
import { Keypair, PublicKey } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { AccessControlRole, OnchainAssetPermissions } from '@baskt/types';
import { waitForTx, waitForNextSlot } from '../utils/chain-helpers';
// Using TestClient static method instead of importing from test-setup

describe('asset', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Track test accounts that might get roles assigned
  const testAccounts: Keypair[] = [];

  // Set up test roles before running tests
  before(async () => {
    // Ensure the protocol and roles are initialized before running asset-specific tests
    await TestClient.initializeProtocolAndRoles(client);

    // Verify roles were assigned correctly
    const hasAssetManagerRole = await client.hasRole(
      client.assetManager.publicKey,
      AccessControlRole.AssetManager,
    );
    const hasOracleManagerRole = await client.hasRole(
      client.oracleManager.publicKey,
      AccessControlRole.OracleManager,
    );

    expect(hasAssetManagerRole).to.be.true;
    expect(hasOracleManagerRole).to.be.true;
  });

  afterEach(async () => {
    // Clean up any AssetManager roles that might have been added during tests
    try {
      // Check all test accounts and remove AssetManager roles if they exist
      for (const account of testAccounts) {
        const hasAssetManagerRole = await client.hasRole(account.publicKey, AccessControlRole.AssetManager);
        if (hasAssetManagerRole) {
          const removeRoleSig = await client.removeRole(account.publicKey, AccessControlRole.AssetManager);
          await waitForTx(client.connection, removeRoleSig);
        }
      }

      // Clear the test accounts array for next test
      testAccounts.length = 0;
      await waitForNextSlot(client.connection);
    } catch (error) {
      // Silently handle cleanup errors to avoid masking test failures
      console.warn('Cleanup error in asset.test.ts:', error);
    }
  });

  it('Successfully adds a new synthetic asset with custom oracle', async () => {
    // Create a custom oracle and asset in one step
    // The client should have the AssetManager role by default since it's the protocol owner
    const { assetAddress } = await client.addAsset('BTC');

    // Fetch the asset account to verify it was initialized correctly
    const assetAccount = await client.getAssetRaw(assetAddress);

    // Verify the asset was initialized with correct values
    expect(assetAccount.assetId.toString()).to.equal(assetAddress.toString());
    expect(assetAccount.ticker).to.equal('BTC');

    // Verify permissions are set to default (both true)
    expect(assetAccount.permissions.allowLongs).to.be.true;
    expect(assetAccount.permissions.allowShorts).to.be.true;
  });

  it('Ensures unauthorized users cannot add assets', async () => {
    // Create a new keypair without any roles
    const unauthorizedUser = await TestClient.forUser(Keypair.generate());
    // Try to add an asset with an unauthorized user
    // This should fail with an UnauthorizedSigner error
    try {
      // Create a custom oracle for this test
      await unauthorizedUser.addAsset('UNAUTH');

      // If we reach here, the test failed
      expect.fail('Expected transaction to fail with Unauthorized error');
    } catch (error) {
      // Use type assertion for the error
      const err = error as { message: string };
      // Verify the error is the expected one
      expect(err.message).to.include('Unauthorized');
    }
  });

  it('Tests user with AssetManager role can add assets even if not the owner', async () => {
    // Create a new keypair for a user with AssetManager role
    const assetManagerUserKeypair = Keypair.generate();
    const assetManagerUser = await TestClient.forUser(assetManagerUserKeypair);

    // Track this account for cleanup
    testAccounts.push(assetManagerUserKeypair);

    // Grant the AssetManager role to this user
    await client.addRole(assetManagerUser.getPublicKey(), AccessControlRole.AssetManager);

    // Verify the user has the AssetManager role
    const hasRole = await client.hasRole(
      assetManagerUser.getPublicKey(),
      AccessControlRole.AssetManager,
    );
    expect(hasRole).to.be.true;
    const ticker = 'NEWMGR';

    await assetManagerUser.addAsset(ticker);

    await client.removeRole(assetManagerUser.getPublicKey(), AccessControlRole.AssetManager);

    // Verify the role was revoked
    const hasRoleAfterRevocation = await client.hasRole(
      assetManagerUser.getPublicKey(),
      AccessControlRole.AssetManager,
    );
    expect(hasRoleAfterRevocation).to.be.false;

    // Try to add another asset after role revocation
    try {
      const newTicker = 'REVOKED';
      await assetManagerUser.addAsset(newTicker);

      // If we reach here, the test failed
      expect.fail('Expected transaction to fail after role revocation');
    } catch (error) {
      // Use type assertion for the error
      const err = error as { message: string };
      // Verify the error is the expected one
      expect(err.message).to.include('Unauthorized');
    }

    // Derive the asset address from the ticker
    const [assetAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('asset'), Buffer.from(ticker)],
      client.program.programId,
    );

    // Verify the asset was created
    const assetAccount = await client.getAssetRaw(assetAddress);
    expect(assetAccount.ticker).to.equal(ticker);

    // Verify this user is not the protocol owner
    const protocol = await client.getProtocolAccount();
    expect(protocol.owner.toString()).to.not.equal(assetManagerUser.getPublicKey().toString());
  });

  it('Successfully adds an asset with short-only permissions', async () => {
    // Create a custom oracle and asset with longs disabled and shorts enabled
    const permissions: OnchainAssetPermissions = {
      allowLongs: false,
      allowShorts: true,
    };

    const { assetAddress } = await client.addAsset(
      'SHORT_ONLY', // ticker
      permissions, // custom permissions
    );

    // Fetch the asset account to verify it was initialized correctly
    const assetAccount = await client.getAssetRaw(assetAddress);

    // Verify the asset was initialized with correct values
    expect(assetAccount.ticker).to.equal('SHORT_ONLY');

    // Verify permissions are set correctly - longs disabled, shorts enabled
    expect(assetAccount.permissions.allowLongs).to.be.false;
    expect(assetAccount.permissions.allowShorts).to.be.true;
  });
});
