import { NumberFormat } from '@baskt/ui';
import { BasktListItemProps } from '../../../../types/baskt';
import { BasketAssetsDisplay } from './BasketAssetsDisplay';

export function BasktListItem({ basktItem, onBasktSelect, onClose }: BasktListItemProps) {
  const handleClick = () => {
    onBasktSelect(basktItem.name);
    onClose();
  };

  const performance = basktItem.performance?.day || 0;
  const isPositive = performance >= 0;

  return (
    <div
      className="flex items-center justify-between p-2 bg-zinc-800/50 rounded border border-border/50 hover:bg-zinc-700/50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <BasketAssetsDisplay assets={basktItem.assets || []} />
        <div>
          <div className="font-medium text-xs">{basktItem.name}</div>
          <div className="text-[10px] text-muted-foreground">
            <NumberFormat value={basktItem.price || 0} isPrice={true} showCurrency={true} />
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}
          {performance.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
