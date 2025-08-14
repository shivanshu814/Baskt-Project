'use client';

import { BasktInfo } from '@baskt/types';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TradingContainer } from '../../../components/trading/shared/layout/TradingContainer';
import { ModalProvider } from '../../../hooks/trade/modals/use-modal-state';
import { useBasktData } from '../../../hooks/trade/trading-data/use-baskt-data';

export default function BasktTradingPage() {
  const name = useParams().name;
  const basktName = decodeURIComponent(name?.toString() || '');
  const [retryCount, setRetryCount] = useState(0);
  const [baskt, setBaskt] = useState<BasktInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewlyCreated, setIsNewlyCreated] = useState(false); //eslint-disable-line

  const { basktNavData, isBasktDataError, isBasktNavDataLoaded } = useBasktData(
    basktName,
    setBaskt,
    setIsLoading,
    setIsNewlyCreated,
    retryCount,
    setRetryCount,
  );

  useEffect(() => {
    if (!isBasktNavDataLoaded) return;
    if (!baskt) return;
    if (!basktNavData?.data?.nav) return;

    const basktCopy = baskt;
    if (!basktCopy) return;
    if (basktNavData?.data?.nav === basktCopy.price) return;

    setBaskt({
      ...basktCopy,
      price: basktNavData?.data?.nav,
    });
  }, [baskt, isBasktNavDataLoaded, basktNavData, setBaskt]);

  return (
    <ModalProvider>
      <TradingContainer isLoading={isLoading} isBasktDataError={isBasktDataError} baskt={baskt} />
    </ModalProvider>
  );
}
