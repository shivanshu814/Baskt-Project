'use client';

import { useState } from 'react';
import { BasktList } from '../baskts/BasktList';
import { BasktDetailPage } from '../baskts/BasktDetailPage';
import { useBaskts } from '../../hooks/baskts/useBaskts';
import { BasktData } from '../../types/baskt';

export function AdminBasktsList() {
  const { activatingBasktId, activateBaskt, basktList } = useBaskts();
  const [selectedBasktId, setSelectedBasktId] = useState<string | null>(null);

  const handleViewDetails = (basktId: string) => {
    setSelectedBasktId(basktId);
  };

  const handleBack = () => {
    setSelectedBasktId(null);
  };

  // Show detail view if a baskt is selected
  if (selectedBasktId) {
    const selectedBaskt = basktList.find((baskt: BasktData) => baskt.basktId === selectedBasktId);
    if (selectedBaskt) {
      return <BasktDetailPage baskt={selectedBaskt} onBack={handleBack} />;
    }
  }

  // Otherwise show the list view
  return (
    <BasktList
      onActivate={activateBaskt}
      activatingBasktId={activatingBasktId}
      onViewDetails={handleViewDetails}
    />
  );
}
