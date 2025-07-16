interface NumberFormatProps {
  value: number;
  isPrice?: boolean;
  showCurrency?: boolean;
}

/**
 * NumberFormat component that automatically handles:
 * - Price values (divides by 1e6 if isPrice=true)
 * - Small values (< 1): shows 5 decimal places
 * - Large values (>= 1): shows 2 decimal places
 * - Currency formatting (adds $ if showCurrency=true)
 */
const formatNumber = (
  value: number,
  isPrice: boolean = false,
  showCurrency: boolean = false,
): string => {
  let convertedValue = value;

  if (isPrice) {
    convertedValue = value / 1e6;
  }

  let formattedValue: string;
  if (convertedValue < 1 && convertedValue > 0) {
    formattedValue = convertedValue.toLocaleString(undefined, {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    });
  } else {
    formattedValue = convertedValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return showCurrency ? `$${formattedValue}` : formattedValue;
};

export const NumberFormat = ({
  value,
  isPrice = false,
  showCurrency = false,
}: NumberFormatProps) => {
  return <span>{formatNumber(value, isPrice, showCurrency)}</span>;
};
