/**
 * Date utility functions
 */

export const formatDate = (timestamp: number): string => {
  const d = new Date(timestamp * 1000);
  return !isNaN(d.getTime()) ? d.toLocaleString() : '-';
};

export const getDefaultDateRange = () => {
  const now = new Date();
  const end = now;
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // default: past 7 days
  return { start, end };
};

export const getTimestampFromDate = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};
