/**
 * Utility functions for protocol-related operations
 */

/**
 * Formats a feature flag key into a human-readable string
 * Example: "isFeatureEnabled" -> "Is Feature Enabled"
 */
export function formatFeatureFlagName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
