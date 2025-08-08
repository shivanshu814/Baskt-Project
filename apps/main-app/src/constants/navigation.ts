import { BriefcaseBusiness, ChartCandlestick, Landmark } from 'lucide-react';
import { ROUTES } from '../routes/route';

export const NAVIGATION_ITEMS = [
  { href: ROUTES.EXPLORE, label: 'Explore', icon: ChartCandlestick },
  { href: ROUTES.PORTFOLIO, label: 'Portfolio', icon: BriefcaseBusiness },
  { href: ROUTES.VAULT, label: 'Vault', icon: Landmark },
] as const;
