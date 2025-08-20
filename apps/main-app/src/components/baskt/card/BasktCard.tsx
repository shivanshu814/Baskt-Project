'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, cn } from '@baskt/ui';
import { ChevronUp } from 'lucide-react';
import React, { useState } from 'react';
import { BasktCardProps } from '../../../types/baskt';
import { BasktCardAssets } from './BasktCardAssets';
import { BasktCardHeader } from './BasktCardHeader';
import { BasktCardMetrics } from './BasktCardMetrics';
import { BasktCardRebalancing } from './BasktCardRebalancing';

export const BasktCard = React.memo(({ baskt, className }: BasktCardProps) => {
  const [open, setOpen] = useState<string | undefined>(undefined);

  return (
    <Accordion
      type="single"
      collapsible
      value={open}
      onValueChange={setOpen}
      className={cn(
        'rounded-sm !-mb-1 !mt-3 border border-border bg-background/80 hover:bg-background/90 transition-colors duration-200 cursor-pointer m-0',
        className,
      )}
    >
      <AccordionItem value="baskt" className="m-0 border-none px-2 py-2">
        <div
          onClick={() => setOpen(open === 'baskt' ? undefined : 'baskt')}
          className="cursor-pointer"
        >
          <AccordionTrigger className="hidden" />
          <div className="flex items-center">
            <ChevronUp
              className={`w-4 h-4 text-muted-foreground ml-2 transition-transform duration-200 ${
                open === 'baskt' ? 'rotate-180' : 'rotate-90'
              }`}
            />
            <BasktCardHeader
              baskt={baskt?.baskt}
              assets={baskt?.assets}
              metrics={baskt?.metrics}
              setOpen={setOpen}
            />
          </div>
        </div>
        <AccordionContent className="px-2 sm:px-4 pb-3 pt-0 mt-8">
          <BasktCardMetrics metrics={baskt?.metrics} />
          <BasktCardAssets assets={baskt?.assets} />
          <BasktCardRebalancing rebalance={baskt?.rebalance} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
});

BasktCard.displayName = 'BasktCard';
