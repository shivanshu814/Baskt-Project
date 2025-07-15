/**
 * Format a number as USD with commas
 * @param value Number to format
 * @returns Formatted string with commas and no decimal places
 */
export function formatUSDWithCommas(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number as USD with commas and 2 decimal places
 * @param value Number to format
 * @returns Formatted string with commas and 2 decimal places
 */
export function formatUSDWithCommasAndDecimals(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
