import { useMemo } from 'react';
import { calculateCurrentPercentage } from '../../../utils/calculation/calculations';
import { generateSliderGradient } from '../../../utils/ui/ui';

export function usePercentageSlider(percentage: string | number) {
  const currentPercentage = useMemo(() => {
    return calculateCurrentPercentage(percentage);
  }, [percentage]);

  const sliderGradient = useMemo(() => {
    return generateSliderGradient(currentPercentage);
  }, [currentPercentage]);

  return {
    currentPercentage,
    sliderGradient,
  };
}
