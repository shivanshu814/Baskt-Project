import React from 'react';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import { StatCardProps } from '../../types/pool';

export const StatCard = React.memo(
  ({ label, value, subtext, icon, tooltip, trend }: StatCardProps) => (
    <div className="relative group rounded-xl p-4 bg-foreground/5 backdrop-blur-md border border-border shadow-lg flex flex-col gap-1 hover:bg-foreground/10 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          {icon}
          {label}
          {tooltip && (
            <span className="cursor-pointer">
              <Info className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
            </span>
          )}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm ${
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {trend.isPositive ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtext && <div className="text-sm text-muted-foreground mt-1">{subtext}</div>}
      </div>
    </div>
  ),
);

StatCard.displayName = 'StatCard';
