'use client';

import React from 'react';
import { useProtocol } from '../../hooks/protocols/useProtocol';
import { ProtocolDetailsProps } from '../../types/protocol';
import { ProtocolInitialization } from '../protocol/ProtocolInitialization';
import { ProtocolGeneralInfo } from '../protocol/ProtocolGeneralInfo';
import { FeatureFlags } from '../protocol/FeatureFlags';
import { RegistryInfo } from '../protocol/RegistryInfo';

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
    return <ProtocolInitialization />;
  }

  return (
    <div className={className}>
      <h2 className="text-2xl font-semibold my-6">Protocol Details</h2>
      <div className="grid gap-6">
        <ProtocolGeneralInfo owner={protocol.owner} />
        <FeatureFlags flags={protocol.featureFlags} />
        <RegistryInfo />
      </div>
    </div>
  );
}
