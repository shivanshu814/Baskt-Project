import { TestClient } from './test-client';
import { waitForTx, waitForNextSlot } from './chain-helpers';
import { AccessControlRole } from '@baskt/types';

/**
 * Centralized cleanup utilities for test files
 */
export class TestCleanup {
  /**
   * Standard feature flag reset for afterEach hooks
   */
  static async resetFeatureFlags(client: TestClient): Promise<void> {
    try {
      const resetSig = await client.updateFeatureFlags({
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
      await waitForTx(client.connection, resetSig);
      await waitForNextSlot(client.connection);
    } catch (error) {
      // Silently handle cleanup errors to avoid masking test failures
      console.warn('Feature flag reset error:', error);
    }
  }

  /**
   * Clean up roles for specific accounts
   */
  static async cleanupRoles(
    client: TestClient,
    roleCleanups: Array<{ publicKey: any; role: AccessControlRole }>
  ): Promise<void> {
    try {
      for (const { publicKey, role } of roleCleanups) {
        try {
          const hasRole = await client.hasRole(publicKey, role);
          if (hasRole) {
            const removeRoleSig = await client.removeRole(publicKey, role);
            await waitForTx(client.connection, removeRoleSig);
          }
        } catch (roleError) {
          console.warn(`Failed to cleanup role ${role} for ${publicKey}:`, roleError);
        }
      }
      await waitForNextSlot(client.connection);
    } catch (error) {
      console.warn('Role cleanup error:', error);
    }
  }

  /**
   * Combined cleanup for tests that need both feature flags and roles reset
   */
  static async fullCleanup(
    client: TestClient,
    roleCleanups?: Array<{ publicKey: any; role: AccessControlRole }>
  ): Promise<void> {
    await Promise.all([
      this.resetFeatureFlags(client),
      roleCleanups ? this.cleanupRoles(client, roleCleanups) : Promise.resolve(),
    ]);
  }
}