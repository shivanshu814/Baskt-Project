import { NumberFormat, PublicKeyText } from '@baskt/ui';
import { ArrowUpDown, BarChart3, ChevronDown, ChevronRight, Wallet } from 'lucide-react';
import { formatDate, getNavChangeColor } from '../../../../../lib/trading/helper';
import { RebalanceHistoryItem } from '../../../../../types/baskt/rebalance';
import { AssetConfigTable } from './AssetConfigTable';
import { NavChangeCard } from './NavChangeCard';

export const RebalanceItem = ({
  item,
  isExpanded,
  onToggle,
}: {
  item: RebalanceHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <div className="border border-border/50 rounded-sm bg-gradient-to-br from-zinc-800/30 to-zinc-900/30 overflow-hidden transition-all duration-300">
    <button
      onClick={onToggle}
      className="w-full p-5 text-left hover:bg-gradient-to-r hover:from-zinc-700/40 hover:to-zinc-800/40 transition-all duration-300 flex items-center justify-between group"
    >
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-sm bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border border-primary/20 shadow-md group-hover:shadow-lg transition-all duration-300">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-lg text-white group-hover:text-primary transition-colors duration-300">
            Rebalance #{Number(item.newRebalanceIndex) / 10}
          </p>
          <p className="text-sm text-muted-foreground">
            {item.createdAt ? formatDate(item.createdAt) : 'N/A'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-right">
          <span className="text-xs text-muted-foreground">NAV Change:</span>
          <span className={`text-sm font-bold ${getNavChangeColor(item.navChange)}`}>
            <NumberFormat
              value={
                typeof item.navChange === 'string' ? parseFloat(item.navChange) : item.navChange
              }
              isPrice={true}
              showCurrency={true}
            />{' '}
          </span>
        </div>
        <div className="h-8 w-8 rounded-lg bg-zinc-700/50 flex items-center justify-center group-hover:bg-zinc-600/50 transition-all duration-300">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
          )}
        </div>
      </div>
    </button>

    {isExpanded && (
      <div className="border-t border-border/30 p-6 space-y-6 bg-gradient-to-br from-zinc-900/20 to-zinc-800/20">
        <div className="flex items-center gap-3 text-sm bg-zinc-800/30 rounded-sm p-3 border border-border/30">
          <span className="text-muted-foreground font-medium">Transaction:</span>
          <PublicKeyText publicKey={item.txSignature} isCopy={true} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NavChangeCard
            title="Previous NAV"
            value={item.previousBaselineNav}
            icon={<Wallet className="w-4 h-4" />}
            iconBg="bg-blue-500/20"
            iconColor="text-blue-400"
          />
          <NavChangeCard
            title="New NAV"
            value={item.newBaselineNav}
            icon={<BarChart3 className="w-5 h-5" />}
            iconBg="bg-green-500/20"
            iconColor="text-green-400"
          />
          <NavChangeCard
            title="Change"
            value={item.navChange}
            icon={<ArrowUpDown className="w-4 h-4" />}
            iconBg="bg-purple-500/20"
            iconColor="text-purple-400"
            isChange={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetConfigTable
            title="Previous Asset Configuration"
            configs={item.previousAssetConfigs}
            badgeColor="bg-blue-500/20"
            badgeText="P"
          />
          <AssetConfigTable
            title="New Asset Configuration"
            configs={item.newAssetConfigs}
            badgeColor="bg-green-500/20"
            badgeText="N"
          />
        </div>
      </div>
    )}
  </div>
);
