'use client';

import { BasktList } from '../baskts/BasktList';
import { useBaskts } from '../../hooks/baskts/useBaskts';

export function AdminBasktsList() {
  const { activatingBasktId, activateBaskt } = useBaskts();

  return <BasktList onActivate={activateBaskt} activatingBasktId={activatingBasktId} />;
}
