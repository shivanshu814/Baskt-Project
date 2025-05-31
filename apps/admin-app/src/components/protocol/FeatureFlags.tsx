import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { formatFeatureFlagName } from '../../utils/protocol';
import { FeatureFlagsProps } from '../../types/protocol';

export function FeatureFlags({ flags }: FeatureFlagsProps) {
  if (!flags) return null;

  return (
    <Collapsible className="mb-6 border border-border rounded-md overflow-hidden">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/50">
        <h3 className="text-lg font-medium text-foreground">Feature Flags</h3>
        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform ui-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-3 pt-0 grid grid-cols-2 gap-2">
          {Object.entries(flags).map(([key, value]) => (
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
  );
}
