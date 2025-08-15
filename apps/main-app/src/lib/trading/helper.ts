export const formatSliderValue = (percentage: string): string => {
  const numValue = parseFloat(percentage || '0');
  return numValue === 0 ? '' : Math.round(numValue).toString();
};

export const preventNegativeInput = (e: React.KeyboardEvent): void => {
  if (e.key === '-') {
    e.preventDefault();
  }
};
