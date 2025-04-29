'use client';

import React from 'react';
import { useProtocol } from '../../hooks/useProtocol';
import { useBasktClient } from '@baskt/ui';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface ProtocolDetailsProps {
  className?: string;
}

export function ProtocolDetails({ className = '' }: ProtocolDetailsProps) {
  const { client } = useBasktClient();
  const { protocol } = useProtocol();

  const handleInitializeProtocol = async () => {
    try {
      await client?.initializeProtocol();
    } catch (error) {
      console.error('Error initializing protocol:', error); //eslint-disable-line
    }
  };

  if (!protocol) {
    return (
      <div className={`${className} p-6 border border-border rounded-lg`}>
        <p className="text-muted-foreground">No protocol information available.</p>
        <div className="mt-4 flex space-x-2">
          <Button onClick={() => handleInitializeProtocol()}>Initialize Protocol</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <h2 className="text-2xl font-semibold my-6">Protocol Details</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-foreground mb-2">General Information</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">Status:</div>
          <div className="font-medium">
            <span className="text-primary">Initialized</span>
          </div>

          <div className="text-muted-foreground">Owner:</div>
          <div className="font-medium text-sm break-all text-foreground">{protocol.owner}</div>
        </div>
      </div>

      <Collapsible className="mb-6 border border-border rounded-md overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/50">
          <h3 className="text-lg font-medium text-foreground">Feature Flags</h3>
          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform ui-open:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 pt-0 grid grid-cols-2 gap-2">
            {protocol.featureFlags &&
              Object.entries(protocol.featureFlags).map(([key, value]) => (
                <React.Fragment key={key}>
                  <div className="text-muted-foreground">{formatFeatureFlagName(key)}:</div>
                  <div className="font-medium">
                    {value ? (
                      <span className="text-primary">Enabled</span>
                    ) : (
                      <span className="text-destructive">Disabled</span>
                    )}
                  </div>
                </React.Fragment>
              ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Helper function to format feature flag names for display
function formatFeatureFlagName(key: string): string {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
    .trim();
}
