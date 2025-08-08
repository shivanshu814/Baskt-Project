import { NumberFormat } from '@baskt/ui';
import { MobileBasketListProps } from '../../../../types/trading/components/mobile';
import { BasketAssetsDisplay } from '../../shared/baskt/BasketAssetsDisplay';

export function MobileBasketList({
  baskt,
  filteredBaskts,
  searchQuery,
  onBasktSelect,
}: MobileBasketListProps) {
  const getBasktPerformance = (basktItem: any) => {
    const performance = basktItem.performance?.day || 0;
    const performanceColor = performance >= 0 ? 'text-green-500' : 'text-red-500';
    const performanceText = `${performance >= 0 ? '+' : ''}${performance.toFixed(2)}%`;

    return { performanceColor, performanceText };
  };

  // Filter baskts
  const filteredBasktsList = filteredBaskts
    ?.filter((basktItem) => basktItem.basktId !== baskt?.basktId)
    ?.filter((basktItem) => {
      if (!searchQuery) return true;
      return basktItem.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

  return (
    <div className="max-h-60 overflow-y-auto space-y-2">
      <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-sm border border-border/50">
        <div className="flex items-center gap-3">
          <BasketAssetsDisplay assets={baskt.assets || []} />
          <div>
            <div className="font-semibold text-sm">{baskt.name}</div>
            <div className="text-sm text-muted-foreground">
              <NumberFormat value={baskt.price || 0} isPrice={true} showCurrency={true} />
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${getBasktPerformance(baskt).performanceColor}`}>
            {getBasktPerformance(baskt).performanceText}
          </div>
        </div>
      </div>

      {filteredBasktsList?.map((basktItem, index) => {
        const { performanceColor, performanceText } = getBasktPerformance(basktItem);

        return (
          <div
            key={basktItem.basktId || index}
            className="flex items-center justify-between p-3 hover:bg-zinc-800/50 rounded-sm border border-border/50 cursor-pointer transition-colors"
            onClick={() => onBasktSelect(basktItem.name)}
          >
            <div className="flex items-center gap-3">
              <BasketAssetsDisplay assets={basktItem.assets || []} />
              <div>
                <div className="font-semibold text-sm">{basktItem.name}</div>
                <div className="text-sm text-muted-foreground">
                  <NumberFormat value={basktItem.price || 0} isPrice={true} showCurrency={true} />
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${performanceColor}`}>{performanceText}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
