import React from 'react';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import { StatCardProps } from '../../types/pool';

export const StatCard = React.memo(
  ({ label, value, subtext, icon, tooltip, trend }: StatCardProps) => (
    <div className="relative group rounded-xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex flex-col gap-1 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/70 font-medium">
          {icon}
          {label}
          {tooltip && (
            <span className="cursor-pointer">
              <Info className="h-4 w-4 text-white/40 group-hover:text-primary transition" />
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
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtext && <div className="text-sm text-white/60 mt-1">{subtext}</div>}
      </div>
    </div>
  ),
);

StatCard.displayName = 'StatCard';
