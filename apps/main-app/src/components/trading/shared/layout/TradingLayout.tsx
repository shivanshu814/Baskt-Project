import { TradingLayoutProps } from '../../../../types/trading/orders';
import { TradingChart } from '../charts/TradingChart';
import { TradingTabs } from '../tabs/TradingTabs';

export function TradingLayout({ baskt }: TradingLayoutProps) {
  return (
    <div className="flex flex-col flex-1">
      <TradingChart baskt={baskt} />
      <TradingTabs baskt={baskt} />
    </div>
  );
}
