export const formatNumber = (
  value: number | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    suffix?: string;
  },
): string => {
  if (value === null || value === undefined) return 'N/A';

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 6,
  }).format(value);

  return options?.suffix ? `${formatted}${options.suffix}` : formatted;
};

/**
 * Format a timestamp (seconds or milliseconds) to a readable date string
 * @param timestamp Unix timestamp in seconds or milliseconds
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: number | null | undefined): string => {
  if (!timestamp) return 'N/A';

  // Convert to milliseconds if in seconds
  const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;

  return new Date(timestampMs).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
