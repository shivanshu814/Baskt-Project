'use client';

import { Button } from '@baskt/ui';
import { X } from 'lucide-react';
import { BasketInfoHeaderMobileProps } from '../../../../types/trading/components/mobile';
import { BasketAssetsDisplay } from '../../shared/baskt/BasketAssetsDisplay';

export function BasketInfoHeaderMobile({ baskt, onClose }: BasketInfoHeaderMobileProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Trade {baskt.name}</h3>
        <BasketAssetsDisplay assets={baskt.assets || []} />
      </div>
      {onClose && (
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
