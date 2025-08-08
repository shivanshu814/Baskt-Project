'use client';

import React from 'react';
import { useProtocol } from '../../hooks/protocols/useProtocol';
import { ProtocolDetailsProps } from '../../types/protocol';
import { ProtocolGeneralInfo } from '../protocol/ProtocolGeneralInfo';
import { FeatureFlags } from '../protocol/FeatureFlags';
import { ProtocolConfig } from '../protocol/ProtocolConfig';

export function ProtocolDetails({ className = '' }: ProtocolDetailsProps) {
  const { protocol, error } = useProtocol();

  if (error) {
    return (
      <div className={`${className} p-6 border border-border rounded-lg`}>
        <p className="text-destructive">{error.message}</p>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className={`${className} p-6 border border-border rounded-lg`}>
        <p className="text-muted-foreground">No protocol data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-2xl font-semibold my-6">Protocol Details</h2>
      <div className="grid gap-6">
        <ProtocolGeneralInfo
          owner={protocol.owner}
          treasury={protocol.treasury.toString()}
          collateralMint={protocol.collateralMint.toString()}
        />
        <div className="flex flex-col gap-4">
          <FeatureFlags flags={protocol.featureFlags} />
        </div>
        <div className="flex flex-col gap-4 -mt-6">
          <ProtocolConfig config={protocol.config} />
        </div>
      </div>
    </div>
  );
}
