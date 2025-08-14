import { Input } from '@baskt/ui';
import { usePercentageSlider } from '../../../../hooks/trade/percentage/use-percentage-slider';
import { PercentageSliderProps } from '../../../../types/baskt/trading/components/tabs';
import { formatPercentageValue } from '../../../../utils/ui/ui';

const PERCENTAGE_SLIDER_MARKERS = [
  { value: 0, label: '0%', position: 'left-0' },
  { value: 25, label: '25%', position: 'left-1/4 transform -translate-x-1/2 ml-2' },
  { value: 50, label: '50%', position: 'left-1/2 transform -translate-x-1/2 ml-1' },
  { value: 75, label: '75%', position: 'left-3/4 transform -translate-x-1/2 ml-1' },
  { value: 100, label: '100%', position: 'right-0' },
] as const;

export function PercentageSlider({
  percentage,
  onSliderChange,
  onPercentageChange,
  isLoading,
}: PercentageSliderProps) {
  const { currentPercentage, sliderGradient } = usePercentageSlider(percentage);

  return (
    <div className="w-full">
      <div className="relative flex items-center gap-3">
        <div className="flex-1">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={currentPercentage}
              onChange={(e) => onSliderChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer slider [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: sliderGradient,
              }}
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2 relative">
              {PERCENTAGE_SLIDER_MARKERS.map((marker) => (
                <span
                  key={marker.value}
                  className={`absolute text-xs text-muted-foreground ${marker.position}`}
                >
                  {marker.label}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border border-border rounded-lg px-2 py-1 w-16 hover:border-purple-500">
          <div className="flex items-center justify-center gap-1">
            <Input
              type="number"
              placeholder="0"
              className="w-12 text-center border-none bg-transparent p-0 text-sm font-medium text-white focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={formatPercentageValue(currentPercentage)}
              onChange={(e) => onPercentageChange(e.target.value)}
              min={0}
              max={100}
              step={1}
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-white">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
