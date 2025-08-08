import { BasktInfo } from '@baskt/types';

// Form UI utilities
export function formatPercentageValue(value: number): string {
  return value === 0 ? '' : value.toString();
}

export function generateSliderGradient(percentage: number): string {
  return `linear-gradient(to right, #8b5cf6 ${percentage}%, #374151 ${percentage}%)`;
}

// Desktop UI utilities
export function filterBasktsBySearch(baskts: BasktInfo[], searchQuery: string): BasktInfo[] {
  if (!searchQuery) return baskts;
  return baskts.filter((baskt) => baskt.name?.toLowerCase().includes(searchQuery.toLowerCase()));
}
