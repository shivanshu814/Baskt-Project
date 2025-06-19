export const getPnlColor = (pnl?: string) => {
  if (!pnl) return 'text-gray-400';
  const pnlValue = parseFloat(pnl);
  return pnlValue > 0 ? 'text-green-500' : pnlValue < 0 ? 'text-red-500' : 'text-gray-400';
};

export const formatPnl = (pnl?: string, percentage?: string) => {
  if (!pnl) return '-';
  const pnlValue = parseFloat(pnl);
  const formattedPnl = pnlValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (percentage) {
    return `${formattedPnl} (${percentage}%)`;
  }
  return formattedPnl;
};

export const formatSize = (size: string) => {
  return parseFloat(size).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

export const formatCollateral = (collateral: string) => {
  return parseFloat(collateral).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
