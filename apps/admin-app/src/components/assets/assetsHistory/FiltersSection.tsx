import React from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { ArrowLeft } from 'lucide-react';
import { FiltersSectionProps } from '../../../types/assets';
export const FiltersSection: React.FC<FiltersSectionProps> = ({
  range,
  all,
  onRangeChange,
  onAllChange,
  onFetch,
  onBack,
}) => {
  return (
    <Card className="p-4 bg-[#010b1d] border-white/10">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[300px]">
          <Label className="text-[#E5E7EB]">Date Range</Label>
          <div className="flex items-end gap-2 mt-1">
            <Input
              type="date"
              value={
                range.start instanceof Date && !isNaN(range.start.getTime())
                  ? range.start.toISOString().slice(0, 10)
                  : ''
              }
              onChange={(e) => onRangeChange(e, 'start')}
              disabled={all}
              className="bg-[#1A1A2B] border-white/10 text-white"
            />
            <span className="text-[#E5E7EB]/60 pb-1">to</span>
            <Input
              type="date"
              value={
                range.end instanceof Date && !isNaN(range.end.getTime())
                  ? range.end.toISOString().slice(0, 10)
                  : ''
              }
              onChange={(e) => onRangeChange(e, 'end')}
              disabled={all}
              className="bg-[#1A1A2B] border-white/10 text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={all}
            onChange={onAllChange}
            id="all-prices"
            className="accent-blue-500 h-5 w-5"
          />
          <Label htmlFor="all-prices" className="text-[#E5E7EB]">
            All Time
          </Label>
        </div>

        <div className="flex gap-2">
          <Button onClick={onFetch} className="h-10 bg-blue-500 text-white hover:bg-blue-500/90">
            Fetch
          </Button>
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="h-10 border-white/10 text-white hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
