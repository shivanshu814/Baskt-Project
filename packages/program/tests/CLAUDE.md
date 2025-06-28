# Testing Guide for Baskt Protocol

This guide documents the general testing patterns, structure, and best practices for working with the Baskt protocol tests.

## Test Architecture Overview

The Baskt protocol testing framework is built on several components:

1. **BaseClient** (`packages/sdk/src/base-client.ts`): The foundation client class that implements core protocol interactions.
   - Handles basic functionality like initializing protocol, managing roles, and working with assets
   - Provides utility methods for all protocol operations

2. **TestClient** (`packages/program/tests/utils/test-client.ts`): Extends BaseClient to provide testing-specific functionality.
   - Singleton instance pattern with `getInstance()` method
   - Helper methods for creating test accounts and initializing test environments
   - Implements `forUser()` to create client instances for different users

3. **Test Files**: Organized by protocol feature in numbered directories:
   - `1_protocol/`: Protocol initialization and management tests
   - `2_assets/`: Asset creation and management tests
   - `3_baskt/`: Baskt creation, activation, and rebalancing tests
   - `4_liquidity/`: Liquidity pool operations tests
   - `5_position/`: Position operations tests

## Getting Started with Tests

### Build and Test Workflow

1. **Build the Anchor program**:
   ```bash
   cd packages/program
   pnpm build:anchor
   ```

2. **Build the SDK** (which copies generated types and IDL):
   ```bash
   cd packages/sdk
   pnpm build
   ```

3. **Run tests**:
   ```bash
   # Important: Always use anchor test to run tests - it starts a local Solana validator
   # and properly sets up the test environment
   
   # Run all tests
   cd packages/program
   anchor test
   
   # Run specific test file
   cd packages/program
   anchor test --run tests/path/to/file.test.ts
   
   # Run specific test case (using grep)
   cd packages/program
   anchor test --run tests/path/to/file.test.ts --grep "test name"
   ```
   
   Note: Do NOT use `ts-mocha` or `pnpm exec ts-mocha` directly as it won't start the 
   Solana validator or set up the test environment properly.

### Common Testing Patterns

1. **Test Client Setup**: Most tests use the TestClient singleton:
   ```typescript
   // Get the test client instance
   const client = TestClient.getInstance();
   
   // Run before tests to set up roles
   before(async () => {
     await client.initializeRoles();
   });
   ```

2. **Creating Test Users**: To test multi-user scenarios, create separate clients:
   ```typescript
   const userKeypair = Keypair.generate();
   const userClient = await TestClient.forUser(userKeypair);
   ```

3. **Feature Flag Management**: Enable required feature flags:
   ```typescript
   await client.updateFeatureFlags({
     allowBasktCreation: true,
     // other flags...
   });
   ```

4. **Test Structure**: Follow standard Mocha/Chai patterns:
   ```typescript
   describe('Feature', () => {
     before(async () => {
       // Setup code
     });
     
     it('should perform specific action', async () => {
       // Test implementation
       // Use expect() for assertions
     });
   });
   ```

5. **Permission Testing**: Tests often verify role-based access control:
   ```typescript
   // Grant role
   await client.addRole(userPublicKey, AccessControlRole.AssetManager);
   
   // Verify role
   const hasRole = await client.hasRole(userPublicKey, AccessControlRole.AssetManager);
   expect(hasRole).to.be.true;
   
   // Test authorized operation
   await userClient.someOperation();
   
   // Revoke role
   await client.removeRole(userPublicKey, AccessControlRole.AssetManager);
   
   // Test unauthorized operation (should fail)
   try {
     await userClient.someOperation();
     expect.fail('Expected to throw error');
   } catch (error) {
     expect(error.message).to.include('Unauthorized');
   }
   ```

## Best Practices for Working with Tests

1. **Test Independence**: Each test should be independent and not rely on state from other tests.

2. **PDA Derivation**: Use program-specific methods to derive PDAs:
   ```typescript
   // For asset PDAs
   const [assetAddress] = PublicKey.findProgramAddressSync(
     [Buffer.from('asset'), Buffer.from(ticker)],
     client.program.programId
   );
   ```

3. **BN Usage**: Always use `BN` for monetary values to avoid floating-point issues.
   ```typescript
   const amount = new BN(1_000_000); // 1 token with 6 decimals
   ```

4. **Error Testing**: Test expected failures with try/catch blocks:
   ```typescript
   try {
     await unauthorizedClient.someOperation();
     expect.fail('Expected to throw error');
   } catch (error) {
     expect(error.message).to.include('ExpectedErrorType');
   }
   ```

5. **State Verification**: Always verify state changes after operations:
   ```typescript
   const stateBefore = await client.getSomeState();
   await client.performOperation();
   const stateAfter = await client.getSomeState();
   expect(stateAfter.someValue).to.equal(expectedNewValue);
   ```

6. **Account Caching**: TestClient caches entities like assets to avoid redundant creation:
   ```typescript
   // TestClient's addAsset has caching to avoid recreating assets
   if (this.storedAssets.has(ticker)) {
     return this.storedAssets.get(ticker);
   }
   ```

## Test Debugging and Fixing Guide

When fixing failing tests, follow these steps:

1. **Understand the Test Purpose**: Before fixing, understand what the test is verifying.

2. **Check Error Messages**: Anchor error messages provide specific information about why a transaction failed.

3. **Verify Program Changes**: If the program code has changed, verify that the test expectations still align with the program behavior.

4. **Debugging Steps**:
   - Add console logs to see values at various stages
   - Check all account derivations are correct
   - Verify all accounts are initialized before use
   - Ensure proper permissions are set

5. **Fix Strategies**:
   - If the program logic changed intentionally, update test expectations
   - If PDAs or accounts have new requirements, update the test setup
   - If permissions changed, ensure test users have proper roles
   - Update error message assertions if error types changed

6. **Test Isolation**: When fixing one test, make sure the fix doesn't break others.

7. **Transaction Error Analysis**: For transaction errors, check:
   - Correct account ownership
   - PDA bumps and seeds
   - Account initialization logic
   - Permission checks
   - Numerical calculations (overflow, underflow)

## Important Notes

1. **Building Before Testing**: Always build both program and SDK before running tests to ensure types and IDL are in sync.

2. **Testing Flow**: Tests are numbered to indicate dependency order. Run them in sequence for best results.

3. **Fixing Rather Than Disabling**: Always work to fix failing tests rather than disabling them.

4. **Roles & Permissions**: Most operations require specific roles. The TestClient has helper methods for role management.

5. **Error Handling**: Be careful with error assertions - some errors might come from Anchor or Solana rather than the program.

6. **Decimal Handling**: Watch out for decimal conversion when working with token amounts (6 decimals for USDC, etc.).

7. **Generated Types**: Tests rely on types generated during the Anchor build process, so always build before testing.

8. **Test First Approach**: When implementing new features, write tests that verify the expected behavior before coding the implementation.