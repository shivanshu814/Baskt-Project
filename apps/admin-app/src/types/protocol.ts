/**
 * Types and interfaces for protocol-related components and data
 */

import { OnchainFeatureFlags } from '@baskt/types';

export interface ProtocolDetailsProps {
  className?: string;
}

export interface FeatureFlagsProps {
  flags: OnchainFeatureFlags | undefined;
}

export interface ProtocolHookResult {
  protocol: {
    owner: string;
    featureFlags: OnchainFeatureFlags;
  } | null;
  isLoading: boolean;
  error: Error | null;
}

export interface ProtocolGeneralInfoProps {
  owner: string;
}
