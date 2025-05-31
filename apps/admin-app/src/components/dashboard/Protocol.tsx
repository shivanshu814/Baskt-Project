'use client';

import React from 'react';
import { useProtocol } from '../../hooks/protocols/useProtocol';
import { ProtocolDetailsProps } from '../../types/protocol';
import { ProtocolInitialization } from '../protocol/ProtocolInitialization';
import { ProtocolGeneralInfo } from '../protocol/ProtocolGeneralInfo';
import { FeatureFlags } from '../protocol/FeatureFlags';

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
      <ProtocolGeneralInfo owner={protocol.owner} />
      <FeatureFlags flags={protocol.featureFlags} />
    </div>
  );
}
