'use client';

import { BasktInfo } from '@baskt/types';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { TradingPageContainer } from '../../../components/trading/shared/layout/TradingPageContainer';
import { ModalProvider } from '../../../hooks/trading/modals/use-modal-state';
import { useBasktData } from '../../../hooks/trading/trade/use-baskt-data';
import { useNavUpdates } from '../../../hooks/trading/trade/use-nav-updates';

function TradingPageContent() {
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

  useNavUpdates(baskt, setBaskt, isBasktNavDataLoaded, basktNavData);

  return (
    <TradingPageContainer isLoading={isLoading} isBasktDataError={isBasktDataError} baskt={baskt} />
  );
}

export default function BasktTradingPage() {
  return (
    <ModalProvider>
      <TradingPageContent />
    </ModalProvider>
  );
}
