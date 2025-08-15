export const DAYS_IN_YEAR = 365;
export const WEEKS_IN_YEAR = 52;
export const MONTHS_IN_YEAR = 12;
export const BPS_DENOMINATOR = 10000;
export const HIGH_YIELD_THRESHOLD = 20;
export const DEFAULT_DECIMAL_PLACES = 6;

export const formatPercentage = (value: number, decimalPlaces: number = 2): string => {
  return `${value.toFixed(decimalPlaces)}%`;
};

export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

export const parseSafeFloat = (value: string | undefined, defaultValue: number = 0): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const calculateAPY = (apr: number): number => {
  const dailyRate = apr / DAYS_IN_YEAR;
  return ((1 + dailyRate / 100) ** DAYS_IN_YEAR - 1) * 100;
};

export const calculateFeeAmount = (amount: string, feeBps: number): number => {
  const amountValue = parseSafeFloat(amount);
  if (amountValue <= 0) return 0;
  return (amountValue * feeBps) / BPS_DENOMINATOR;
};

export const calculateDepositOutput = (
  netAmount: number,
  totalShares: string,
  totalLiquidity: string,
): number => {
  const shares = parseSafeFloat(totalShares);
  const liquidity = parseSafeFloat(totalLiquidity);
  if (liquidity === 0) return 0;
  return (netAmount * shares) / liquidity;
};

export const calculateWithdrawOutput = (
  netAmount: number,
  totalShares: string,
  totalLiquidity: string,
): number => {
  const shares = parseSafeFloat(totalShares);
  const liquidity = parseSafeFloat(totalLiquidity);
  if (shares === 0) return 0;
  return (netAmount * liquidity) / shares;
};

export const calculateBLPPrice = (totalLiquidity: string, totalShares: string): string => {
  const liquidity = parseSafeFloat(totalLiquidity);
  const shares = parseSafeFloat(totalShares);
  if (shares === 0) return '0';
  return (liquidity / shares).toFixed(3);
};
