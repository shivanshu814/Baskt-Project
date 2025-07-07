interface NumberFormatProps {
  value: number;
  isPrice?: boolean;
}

const formatNumber = (value: number, isPrice: boolean = false): string => {
  if (isPrice) {
    return `$${(value / 1e6).toFixed(2)}`;
  } else {
    return `${value.toFixed(2)}`;
  }
};

export const NumberFormat = ({ value, isPrice = false }: NumberFormatProps) => {
  return <span>{formatNumber(value, isPrice)}</span>;
};
