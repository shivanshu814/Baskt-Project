import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { ArrowUp, ArrowDown, Share2 } from 'lucide-react';
import { BasktHeaderProps } from '../../../types/baskt';

export const BasktHeader = ({ baskt, onShareClick }: BasktHeaderProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
              <img src={baskt.image} alt={baskt.name} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-[18px] font-bold">{baskt.name}</h1>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShareClick}>
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <div className="text-[32px] font-bold">${baskt.price?.toLocaleString()}</div>
            <div
              className={`flex items-center gap-1 ${
                baskt.change24h && baskt.change24h >= 0 ? 'text-[#16c784]' : 'text-[#ea3943]'
              }`}
            >
              {baskt?.change24h && baskt?.change24h >= 0 ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              <span className="text-[12px]">{Math.abs(baskt?.change24h || 0).toFixed(2)}%</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h3 className="text-[11px] text-muted-foreground">30D Change</h3>
            <p className="font-bold text-[14px]">
              {baskt.performance?.month && baskt.performance.month > 0 ? '+' : '-'}
              {baskt.performance?.month?.toFixed(2)}%
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-[11px] text-muted-foreground">Total Assets</h3>
            <p className="font-bold text-[14px]">{baskt.totalAssets}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-[11px] text-muted-foreground">30D Sharpe Ratio</h3>
            <p className="font-bold text-[14px] capitalize">1.85</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-[11px] text-muted-foreground">30D Sortino Ratio</h3>
            <p className="font-bold text-[14px] capitalize">2.12</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-[11px] text-muted-foreground">30D Volatility</h3>
            <p className="font-bold text-[14px]">18.5%</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-[11px] text-muted-foreground">30D Return vs SOL</h3>
            <p className="font-bold text-[14px] text-[#16c784]">+5.2%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
