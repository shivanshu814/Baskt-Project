'use client';

import { BasktList } from '../baskts/BasktList';
import { BasktDetailPage } from '../baskts/BasktDetailPage';
import { useBaskts } from '../../hooks/baskts/useBaskts';

export function AdminBasktsList() {
  const {
    activatingBasktId,
    activateBaskt,
    selectedBaskt,
    handleViewDetails,
    handleBack,
  } = useBaskts();

  // Show detail view if a baskt is selected
  if (selectedBaskt) {
    return <BasktDetailPage baskt={selectedBaskt} onBack={handleBack} />;
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
