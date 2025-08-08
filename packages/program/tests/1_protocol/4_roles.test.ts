import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import { Keypair } from '@solana/web3.js';
import { TestClient } from '../utils/test-client';
import { TestCleanup } from '../utils/test-cleanup';
import { AccessControlRole } from '@baskt/types';

describe('protocol roles', () => {
  // Get the test client instance
  const client = TestClient.getInstance();

  // Create test accounts
  const testAccount1 = Keypair.generate();
  const testAccount2 = Keypair.generate();
  const nonOwnerAccount = Keypair.generate();

  before(async () => {
    // Initialize protocol and roles before running role tests
    try {
      // Check if protocol is already initialized
      await client.getProtocolAccount();
    } catch (error) {
      // Protocol doesn't exist, initialize it
      await client.initializeProtocol(client.treasury.publicKey);
      await client.initializeRoles();
    }
  });

  after(async () => {
    // Clean up roles that may still exist after tests
    // Note: Some tests intentionally remove roles, so we use conditional cleanup
    await TestCleanup.cleanupRoles(client, [
      { publicKey: testAccount1.publicKey, role: AccessControlRole.AssetManager },
      { publicKey: testAccount2.publicKey, role: AccessControlRole.BasktManager }
    ]);
  });

  it('Successfully adds AssetManager role to an account', async () => {
    // Add the AssetManager role to the test account
    await client.addRole(testAccount1.publicKey, AccessControlRole.AssetManager).catch((error) => {
      console.error(error);
      expect(error).to.not.exist;
    });

    // Verify the account has the role
    const hasRole = await client.hasRole(testAccount1.publicKey, AccessControlRole.AssetManager);
    expect(hasRole).to.be.true;
  });

  it('Successfully adds BasktManager role to an account', async () => {
    // Add the BasktManager role to the test account
    await client.addRole(testAccount2.publicKey, AccessControlRole.BasktManager);

    // Verify the account has the role
    const hasRole = await client.hasRole(testAccount2.publicKey, AccessControlRole.BasktManager);
    expect(hasRole).to.be.true;
  });

  it('Successfully removes a role from an account', async () => {
    // First, ensure the account has the role
    const hasRoleBefore = await client.hasRole(
      testAccount1.publicKey,
      AccessControlRole.AssetManager,
    );
    expect(hasRoleBefore).to.be.true;

    // Remove the role
    await client.removeRole(testAccount1.publicKey, AccessControlRole.AssetManager);

    // Verify the role was removed
    const hasRoleAfter = await client.hasRole(
      testAccount1.publicKey,
      AccessControlRole.AssetManager,
    );
    expect(hasRoleAfter).to.be.false;
  });

  it('Non-owner cannot add a role', async () => {
    // Create a new client instance with the non-owner account
    const program = client.program;

    // Create a mock function for testing non-owner access
    const mockAddRole = async () => {
      // Use the program directly with non-owner account
      return await program.methods
        .addRole(parseInt(AccessControlRole.AssetManager.toString()))
        .accounts({
          owner: nonOwnerAccount.publicKey,
          account: testAccount2.publicKey,
        })
        .signers([nonOwnerAccount])
        .rpc();
    };

    try {
      // Attempt to add a role as non-owner
      await mockAddRole();
      // If we reach here, the test should fail
      expect.fail('Non-owner should not be able to add a role');
    } catch (error) {
      // We expect an error, so this is a successful test
      expect(error).to.exist;
    }
  });

  it('Non-owner cannot remove a role', async () => {
    // First, ensure the account has the role
    await client.addRole(testAccount2.publicKey, AccessControlRole.BasktManager);

    const hasRole = await client.hasRole(testAccount2.publicKey, AccessControlRole.BasktManager);
    expect(hasRole).to.be.true;

    // Create a new client instance with the non-owner account
    const program = client.program;

    // Create a mock function for testing non-owner access
    const mockRemoveRole = async () => {
      // Use the program directly with non-owner account
      return await program.methods
        .removeRole(parseInt(AccessControlRole.BasktManager.toString()))
        .accounts({
          owner: nonOwnerAccount.publicKey,
          account: testAccount2.publicKey,
        })
        .signers([nonOwnerAccount])
        .rpc();
    };

    try {
      // Attempt to remove a role as non-owner
      await mockRemoveRole();
      // If we reach here, the test should fail
      expect.fail('Non-owner should not be able to remove a role');
    } catch (error) {
      // We expect an error, so this is a successful test
      expect(error).to.exist;
    }
  });
});
