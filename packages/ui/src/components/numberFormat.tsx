interface NumberFormatProps {
  value: number;
  isPrice?: boolean;
}

const formatNumber = (value: number, isPrice: boolean = false): string => {
  if (isPrice) {
    const formattedValue = (value / 1e6).toFixed(2);
    return `$${formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  } else {
    return `${value.toFixed(2)}`;
  }
};

export const NumberFormat = ({ value, isPrice = false }: NumberFormatProps) => {
  return <span>{formatNumber(value, isPrice)}</span>;
};
