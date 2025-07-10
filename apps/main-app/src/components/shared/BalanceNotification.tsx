'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

export const BalanceNotification = () => {
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<Date | null>(null); // eslint-disable-line
  const isManualRefresh = useRef(false);

  useEffect(() => {
    const handleBalanceUpdate = () => {
      if (isManualRefresh.current) {
        isManualRefresh.current = false;
        return;
      }

      const now = new Date();
      setLastBalanceUpdate(now);

      toast.success('Balances updated successfully!', {
        icon: <CheckCircle2 className="h-4 w-4" />,
        duration: 2000,
      });
    };

    window.addEventListener('balance-updated', handleBalanceUpdate);
    window.addEventListener('token-received', handleBalanceUpdate);
    window.addEventListener('external-transaction', handleBalanceUpdate);

    return () => {
      window.removeEventListener('balance-updated', handleBalanceUpdate);
      window.removeEventListener('token-received', handleBalanceUpdate);
      window.removeEventListener('external-transaction', handleBalanceUpdate);
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    (window as any).setManualRefreshFlag = () => {
      isManualRefresh.current = true;
    };
  }, []); // eslint-disable-line

  return null;
};
