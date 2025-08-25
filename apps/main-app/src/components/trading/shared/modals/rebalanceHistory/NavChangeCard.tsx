import { NumberFormat } from '@baskt/ui';
import { getNavChangeColor } from '../../../../../lib/trading/helper';

export const NavChangeCard = ({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  isChange = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  isChange?: boolean;
}) => (
  <div className="bg-gradient-to-br from-zinc-800/40 to-zinc-700/40 rounded-sm p-4 border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="flex items-center gap-2 mb-3">
      <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {title}
      </span>
    </div>
    <p className={`text-xl font-bold ${isChange ? getNavChangeColor(value) : 'text-white'}`}>
      <NumberFormat
        value={typeof value === 'string' ? parseFloat(value) : value}
        isPrice={true}
        showCurrency={true}
      />
    </p>
  </div>
);
